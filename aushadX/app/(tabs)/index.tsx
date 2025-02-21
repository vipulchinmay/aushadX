import { View, StyleSheet, Alert, ActivityIndicator, Text, Animated, Easing, Image, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import ImageViewer from "@/components/ImageViewer";
import Button from "@/components/Button";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from "@/components/LanguageContext";
import translations from "@/components/translation";

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const { language } = useLanguage();

  // Translation helper function
  const t = (key: string) => translations[language]?.[key] || key;

  // Animation for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [selectedImage]);

  useEffect(() => {
    Animated.timing(welcomeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    // Request camera permissions on component mount
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Needed'), t('Camera permission is needed to take photos'));
      }
    })();
  }, []);

  const animateButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        t("Permission Denied"),
        t("You need to grant gallery access to select a photo.")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t("Permission Denied"),
          t("You need to grant camera access to take a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert(t("Error"), t("Failed to take photo. Please try again."));
    }
  };

  const abortProcessing = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
      Alert.alert(t("Processing Aborted"), t("Image processing has been stopped."));
    }
  };

  const scanImage = async () => {
    if (!selectedImage) {
      Alert.alert(t("No Image Selected"), t("Please choose or take a photo first."));
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
      const response = await fetch(selectedImage, { signal: controller.signal });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];

        // 🌍 Send the selected language along with the image
        const serverResponse = await fetch("http://172.16.30.163:5000/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            image: base64Image,
            language: language  // ✅ Sending selected language
          }),
          signal: controller.signal,
        });

        const data = await serverResponse.json();
        setLoading(false);

        if (data.error) {
          Alert.alert(t("Error"), t("Failed to extract medicine details."));
          return;
        }

        navigation.navigate("Schedule", {
          raw_response: data.raw_response,
        });
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Image processing was aborted.");
      } else {
        console.error("Error scanning image:", error);
        Alert.alert(t("Error"), t("Something went wrong while scanning."));
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.welcomeContainer, { opacity: welcomeAnim }]}>
        {!selectedImage && (
          <Text style={styles.welcomeText}>
            {t("🙏Welcome to AushadX! Tap 'Choose a photo'📸 to get started✨.")}
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <ImageViewer imgSource={selectedImage} />
      </Animated.View>

      <View style={styles.footerContainer}>
        <View style={styles.buttonGroup}>
          <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonContainer]}>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={takePhoto}
              onPressIn={animateButtonPressIn}
              onPressOut={animateButtonPressOut}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{t("Take Photo")}</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.buttonContainer}>
            <Button 
              label={t("Choose from Gallery")} 
              theme="primary" 
              onPress={pickImage} 
              disabled={loading} 
            />
          </View>
        </View>
        
        <Button
          label={loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadingText}>{t("Processing...")}</Text>
            </View>
          ) : (
            t("Use this photo")
          )}
          onPress={scanImage}
          disabled={loading || !selectedImage}
        />
        {loading && (
          <Button 
            label={t("Abort")} 
            onPress={abortProcessing} 
            style={styles.abortButton} 
            disabled={!loading} 
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    marginTop: 50,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
  },
  imageContainer: {
    flex: 1,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
  },
  buttonGroup: {
    width: "100%",
    flexDirection: "column",
    gap: 10,
    marginBottom: 0.5,
  },
  buttonContainer: {
    width: "100%",
  },
  cameraButton: {
    backgroundColor: "#e67e22",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  abortButton: {
    backgroundColor: "#ff4d4d",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 5,
  },
});
