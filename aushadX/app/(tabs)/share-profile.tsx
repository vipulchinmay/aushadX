import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import BluetoothScanner from "../../components/Bluetooth";

const ShareProfile = () => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Share Profile via Bluetooth
      </Text>
      <BluetoothScanner />
    </View>
  );
};

export default ShareProfile;
