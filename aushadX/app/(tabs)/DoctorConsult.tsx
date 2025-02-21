import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Linking,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function DoctorConsultScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow location access to find hospitals.");
        setLoading(false);
        return;
      }
      try {
        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation);

        const { latitude, longitude } = userLocation.coords;
        setMapRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=8000&type=hospital&key=AIzaSyCMrNFVUYbfMsVRWl7J8NbmOaN3qc5v6vo`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const enrichedHospitals = await Promise.all(
            data.results.map(async (hospital: any) => {
              const detailsResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.place_id}&fields=name,vicinity,formatted_phone_number,rating,geometry&key=AIzaSyCMrNFVUYbfMsVRWl7J8NbmOaN3qc5v6vo`
              );
              const detailsData = await detailsResponse.json();
              if (detailsData.result) {
                return {
                  ...detailsData.result,
                  distance: calculateDistance(
                    latitude,
                    longitude,
                    detailsData.result.geometry.location.lat,
                    detailsData.result.geometry.location.lng
                  ),
                };
              }
              return null;
            })
          );

          setHospitals(enrichedHospitals.filter((h) => h !== null));
        } else {
          setHospitals([]);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch hospital details.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const makeCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openDirections = (destLat: number, destLng: number) => {
    const { latitude, longitude } = location.coords;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Custom marker component
  const CustomMarker = ({ color }) => (
    <View style={[styles.markerContainer, { backgroundColor: color }]}>
      <View style={styles.markerInner} />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <>
          {mapRegion && (
            <MapView style={styles.map} region={mapRegion}>
              <Marker coordinate={mapRegion} pinColor="#2196F3" title="Your Location" />
              {hospitals.map((hospital, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: hospital.geometry.location.lat,
                    longitude: hospital.geometry.location.lng,
                  }}
                  pinColor="#ff3b30"
                  title={hospital.name}
                />
              ))}
            </MapView>
          )}

          <FlatList
            data={hospitals}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) =>
              item && item.name && item.vicinity ? (
                <View style={styles.card}>
                  <Text style={styles.text}>🏥 {item.name}</Text>
                  <Text style={styles.text}>📍 {item.vicinity}</Text>
                  {item.formatted_phone_number && (
                    <Text style={styles.text}>📞 {item.formatted_phone_number}</Text>
                  )}
                  {item.rating && <Text style={styles.text}>⭐ Rating: {item.rating}/5</Text>}
                  {item.distance && <Text style={styles.text}>📏 Distance: {item.distance} km</Text>}
                  
                  {/* Button Container */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => makeCall(item.formatted_phone_number)}
                    >
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.directionButton}
                      onPress={() => openDirections(item.geometry.location.lat, item.geometry.location.lng)}
                    >
                      <Text style={styles.directionButtonText}>Directions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  map: {
    width: Dimensions.get("window").width,
    height: height * 0.4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#333",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    width: "100%",
    position: "relative",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  
   // Custom Marker Styles
   markerContainer: {
     width: 20,
     height: 20,
     borderRadius: 10,
     justifyContent: 'center',
     alignItems: 'center',
     elevation:5
   },
   markerInner:{
     width:'80%',
     height:'80%',
     borderRadius:'50%',
   },
  
   buttonContainer:{
     flexDirection:'row',
     justifyContent:'space-between',
     marginTop:10
   },
  
   callButton:{
     flexGrow :1 ,
     marginRight :5 ,
     backgroundColor:"#4CAF50",
     paddingVertical :8 ,
     borderRadius :10 ,
     alignItems:'center'
   },
  
   callButtonText:{
     color:"#fff",
     fontSize :14 ,
     fontWeight :"bold",
   },
  
   directionButton:{
     flexGrow :1 ,
     backgroundColor:"#2196F3",
     paddingVertical :8 ,
     borderRadius :10 ,
     alignItems:'center'
   },
  
   directionButtonText:{
     color:"#fff",
     fontSize :14 ,
     fontWeight :"bold",
   },
});

