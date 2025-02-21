import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, PermissionsAndroid, Platform, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const BluetoothScanner = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const manager = new BleManager();

  useEffect(() => {
    requestPermissions();
  }, []);

  // Request Bluetooth Permissions (Android)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !== 'granted' ||
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== 'granted' ||
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== 'granted'
      ) {
        Alert.alert('Permissions required', 'Please enable Bluetooth and location permissions to scan devices.');
        return;
      }
    }

    scanDevices();
  };

  // Scan for Bluetooth Devices
  const scanDevices = () => {
    setDevices([]); // Clear previous results

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        Alert.alert('Error', 'Could not start scanning.');
        return;
      }
      if (device && device.name && !devices.find(d => d.id === device.id)) {
        setDevices(prevDevices => [...prevDevices, device]);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
    }, 10000);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {bluetoothEnabled ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Available Bluetooth Devices:</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ padding: 10, borderBottomWidth: 1 }}>
                <Text>{item.name} ({item.id})</Text>
              </View>
            )}
          />
          <TouchableOpacity onPress={scanDevices} style={{ padding: 10, backgroundColor: 'blue', marginTop: 20 }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>Rescan</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: 'red' }}>Please enable Bluetooth to scan for devices.</Text>
      )}
    </View>
  );
};

export default BluetoothScanner;
