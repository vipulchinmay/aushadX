import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import * as SMS from "expo-sms";
import axios from "axios";
import { useRoute } from "@react-navigation/native"; // Import useRoute

interface User {
  name: string;
  age: string;
  gender: string;
  blood_group: string;
  medical_conditions: string;
  health_insurance: string;
  date_of_birth: string;
}

export default function ShareProfile() {
  const route = useRoute(); // Use useRoute to access route params

  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  // Animation styles
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // Fetch user details from the database using name
  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `http://172.16.30.163:6000/profile/name/${encodeURIComponent(userData.name)}`
      );
      if (response.data.success) {
        setUserData(response.data.user);
      } else {
        setError("Failed to fetch user data.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(); // Fetch user data when the component mounts
  }, [userData.name]);

  // Function to handle sending the user's details as SMS
  const sendUserDataAsSMS = async (contactNumber: string) => {
    if (!userData) {
      Alert.alert("Error", "User data not available.");
      return;
    }

    const message = `User Details:\nName: ${userData.name}\nAge: ${userData.age}\nGender: ${userData.gender}\nBlood Group: ${userData.blood_group}\nDate of Birth: ${userData.date_of_birth}\nMedical Conditions: ${userData.medical_conditions || "None"}\nHealth Insurance: ${userData.health_insurance || "None"}`;

    try {
      const { result } = await SMS.sendSMSAsync([contactNumber], message);

      if (result === "sent") {
        Alert.alert("Success", "User details sent via SMS!");
      } else {
        Alert.alert("Error", "Failed to send user details via SMS.");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      Alert.alert("Error", "Failed to send user details via SMS.");
    }
  };

  const handleShareProfileClick = () => {
    Alert.prompt(
      "Enter Phone Number",
      "Please enter the recipient's phone number:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          onPress: (phoneNumber) => {
            sendUserDataAsSMS(phoneNumber);
          },
        },
      ],
      "plain-text"
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a86ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Share Profile</Text>
      <View style={styles.radarContainer}>
        <Animated.View style={[styles.radarRing, pulseStyle]} />
        <View style={styles.iconContainer}>
          <Ionicons name="compass-outline" size={70} color="#4a86ff" />
        </View>
        <Animated.View style={[styles.radarBeam, rotationStyle]} />
      </View>

      <TouchableOpacity
        style={[styles.shareButton, buttonStyle]}
        onPress={handleShareProfileClick}
        activeOpacity={0.8}
      >
        <View style={styles.shareButtonContent}>
          <Ionicons name="share-social" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.shareText}>Share Profile</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#1a2151",
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 10,
    marginBottom: 30,
  },
  radarContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  radarRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(74, 134, 255, 0.5)",
    backgroundColor: "rgba(74, 134, 255, 0.1)",
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  radarBeam: {
    position: "absolute",
    width: 200,
    height: 200,
    borderTopWidth: 3,
    borderRightWidth: 1,
    borderRadius: 100,
    borderColor: "rgba(74, 134, 255, 0.9)",
    transform: [{ rotate: "0deg" }],
    zIndex: 1,
  },
  shareButton: {
    position: "absolute",
    bottom: 40,
    width: 200,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4a86ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  shareButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  buttonIcon: {
    marginRight: 8,
  },
  shareText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
  },
});