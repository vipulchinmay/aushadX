import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
  interpolate,
  FadeIn,
} from "react-native-reanimated";

interface User {
  id: string;
  name: string;
  status: string;
}

export default function ShareProfile() {
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [scanning, setScanning] = useState(false);
  const mockUsersRef = useRef<User[]>([
    { id: "1", name: "Olivia Parker", status: "Connected" },
    { id: "2", name: "Ethan Mitchell", status: "Connected" },
    { id: "3", name: "Sophia Reynolds", status: "Pending" },
    { id: "4", name: "Benjamin Hayes", status: "Connected" },
  ]);

  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  // Track component mount status
  const isMounted = useRef(true);
  const appState = useRef(AppState.currentState);

  // App State handling (prevent animations in background)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        if (scanning) {
          stopAnimations();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
      stopAnimations();
    };
  }, [scanning]);

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

  // Animation functions
  const startAnimations = () => {
    try {
      // Rotation (staggered start)
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1
      );

      // Pulse (staggered start)
      pulse.value = 1;
      pulse.value = withRepeat(
        withTiming(1.2, { duration: 1500, easing: Easing.ease }),
        -1,
        true // Reverse
      );
    } catch (err) {
      console.log("Animation start error:", err);
    }
  };

  const stopAnimations = () => {
    try {
      cancelAnimation(rotation);
      cancelAnimation(pulse);

      rotation.value = withTiming(0, { duration: 500, easing: Easing.ease });
      pulse.value = withTiming(1, { duration: 500, easing: Easing.ease });
    } catch (err) {
      console.log("Animation stop error:", err);
      rotation.value = 0;
      pulse.value = 1;
    }
  };

  // Button press animation (scale down and fade)
  const animateButtonPress = () => {
    buttonScale.value = withTiming(0.95, { duration: 100, easing: Easing.ease }, () => {
      buttonScale.value = withTiming(1, { duration: 100, easing: Easing.ease });
    });
    buttonOpacity.value = withTiming(0.7, { duration: 100, easing: Easing.ease }, () => {
      buttonOpacity.value = withTiming(1, { duration: 100, easing: Easing.ease });
    });
  };

  // Scanning start/stop
  const startScanning = () => {
    if (scanning) return;
    animateButtonPress();
    setScanning(true);
    setSharedUsers([]);
    startAnimations();
  };

  const stopScanning = () => {
    if (!scanning) return;
    animateButtonPress();
    setScanning(false);
    setSharedUsers(mockUsersRef.current);
    stopAnimations();
  };

  // Combined Share Profile Button Handler
  const handleShareProfileClick = () => {
    if (scanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Share Profile</Text>

      <View style={styles.radarContainer}>
        {/* Single pulsing radar ring */}
        <Animated.View style={[styles.radarRing, pulseStyle]} />

        {/* Center Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="compass-outline" size={70} color="#4a86ff" />
        </View>

        {/* Rotating Beam */}
        {scanning && <Animated.View style={[styles.radarBeam, rotationStyle]} />}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {scanning
            ? "Scanning for nearby devices..."
            : sharedUsers.length > 0
            ? "Found connections nearby"
            : "Tap Share to discover nearby devices"}
        </Text>
      </View>

      <View style={styles.sharedListContainer}>
        <Text style={styles.sectionTitle}>Connections</Text>
        {sharedUsers.length > 0 ? (
          <FlatList
            data={sharedUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={36} color="#4a86ff" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          item.status === "Connected" ? styles.connectedDot : styles.pendingDot,
                        ]}
                      />
                      <Text style={styles.userStatus}>{item.status}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons
                    name={item.status === "Connected" ? "checkmark-circle" : "time-outline"}
                    size={24}
                    color={item.status === "Connected" ? "#4CAF50" : "#FFC107"}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color="#637394" />
            <Text style={styles.emptyText}>No connections yet</Text>
            <Text style={styles.emptySubtext}>Share your profile to connect with others</Text>
          </View>
        )}
      </View>

      {/* Share / Stop Button */}
      <TouchableOpacity
        style={[styles.shareButton, buttonStyle]}
        onPress={handleShareProfileClick}
        activeOpacity={0.8}
      >
        <View style={styles.shareButtonContent}>
          <Ionicons name="share-social" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.shareText}>{scanning ? "Stop Scanning" : "Share Profile"}</Text>
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
  statusContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: "#bcc6d9",
    fontWeight: "500",
  },
  sharedListContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: "#4CAF50",
  },
  pendingDot: {
    backgroundColor: "#FFC107",
  },
  userStatus: {
    fontSize: 14,
    color: "#bcc6d9",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#bcc6d9",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#637394",
    marginTop: 8,
    textAlign: "center",
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
  stopButton: {
    position: "absolute",
    bottom: 40,
    width: 200,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e74c3c",
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
  stopButtonContent: {
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
});
