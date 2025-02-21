import {
  View,
  Text,
  StyleSheet,
  Alert,
  Button,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import React, { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useLanguage } from "@/components/LanguageContext";
import translations from "@/components/translation";

const apollo = require("../../assets/images/apollo.png");
const medplus = require("../../assets/images/medplus.png");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Schedule() {
  const params = useLocalSearchParams();
  const { raw_response } = params;
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || key;

  const [days, setDays] = useState<number>(1);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<boolean>(false);

  useEffect(() => {
    console.log("Params:", params);
    if (!raw_response) {
      Alert.alert(t("Error"), t("Some required data is missing."));
    }
  }, [params]);

  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("Permission Denied"), t("Enable notifications in settings."));
      }
    }
    requestPermissions();
  }, []);

  const scheduleReminders = async () => {
    const currentTime = new Date();
    for (let i = 0; i < days; i++) {
      const reminderDate = new Date(reminderTime);
      reminderDate.setDate(reminderDate.getDate() + i);

      if (reminderDate <= currentTime) {
        Alert.alert(t("Invalid Time"), t("Please select a future time."));
        return;
      }

      const trigger = {
        year: reminderDate.getFullYear(),
        month: reminderDate.getMonth(),
        day: reminderDate.getDate(),
        hour: reminderDate.getHours(),
        minute: reminderDate.getMinutes(),
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("⏰ Reminder!"),
          body: `${t("It's time for your medication")}. ${t("Day")} ${i + 1}`,
          sound: "default",
        },
        trigger,
      });
    }

    Alert.alert(
      t("Reminders Set"), 
      t("{{count}} reminders have been scheduled.").replace("{{count}}", days.toString())
    );
  };

  const pharmacyOptions = [
    { id: "1", name: t("Apollo Pharmacy"), logo: apollo, url: "https://www.apollopharmacy.in/" },
    { id: "2", name: t("Med Plus"), logo: medplus, url: "https://www.medplusmart.com/" },
    { id: "3", name: t("Netmeds"), logo: "https://www.netmeds.com/assets/global/images/img_logo_netmeds.png", url: "https://www.netmeds.com/" },
    { id: "4", name: t("1mg"), logo: "https://www.1mg.com/images/tata_1mg_logo.svg", url: "https://www.1mg.com/" },
    { id: "5", name: t("PharmEasy"), logo: "https://assets.pharmeasy.in/web-assets/dist/9b3c895d.svg", url: "https://www.pharmeasy.in/" },
  ];

  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>{t("Medicine Information")}</Text>

          {raw_response ? (
            <View style={styles.infoContainer}>
              <Text style={styles.info}>{raw_response}</Text>
            </View>
          ) : (
            <Text style={styles.info}>{t("No valid data available.")}</Text>
          )}

          <View style={styles.shoppingContainer}>
            <Text style={styles.shoppingTitle}>{t("Buy Your Medicine Online")}</Text>
            <FlatList
              horizontal
              data={pharmacyOptions}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.shoppingItem}
                  onPress={() => openWebsite(item.url)}
                >
                  <Image
                    source={{ uri: item.logo }}
                    style={styles.shoppingImage}
                  />
                  <Text style={styles.shoppingItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t("Select Dosage Days:")}</Text>
            <Text style={styles.dayCount}>
              {days} {days === 1 ? t("Day") : t("Days")}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={30}
              step={1}
              value={days}
              onValueChange={(value) => setDays(value)}
              minimumTrackTintColor="#1E90FF"
              maximumTrackTintColor="#D3D3D3"
              thumbTintColor="#1E90FF"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t("Select Time for Reminder:")}</Text>
            <Button title={t("Pick Time")} onPress={() => setShowPicker(true)} />
            {showPicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setReminderTime(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.section}>
            <Button title={t("Set Reminders")} onPress={scheduleReminders} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoContainer: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginTop: 10,
  },
  info: {
    fontSize: 16,
  },
  shoppingContainer: {
    width: "100%",
    marginTop: 20,
  },
  shoppingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  shoppingItem: {
    backgroundColor: "#fff",
    padding: 10,
    marginRight: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  shoppingImage: {
    width: 80,
    height: 40,
    resizeMode: "contain",
  },
  shoppingItemText: {
    fontSize: 14,
    color: "#25292e",
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  dayCount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  slider: {
    width: "80%",
    height: 40,
  },
});
