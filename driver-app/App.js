import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import axios from 'axios';
import { io } from 'socket.io-client';
import MapView, { Marker } from 'react-native-maps'; 
import * as Location from 'expo-location'; // NEW: Import Location API!

// ⚠️ CHANGE TO YOUR IP ADDRESS
const API_URL = 'https://food-ecosystem-api.onrender.com';

// We put the socket OUTSIDE the component so it doesn't reconnect constantly
const socket = io(API_URL, { transports:['websocket'] });

export default function App() {
  const [email, setEmail] = useState('driver@test.com');
  const [password, setPassword] = useState('password123');
  const[token, setToken] = useState(null);

  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState(null); // Driver's Live Location

  const fetchAvailableOrders = async (userToken) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/orders/available`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    
    socket.on('orderUpdated', () => {
      fetchAvailableOrders(token);
    });

    return () => socket.off('orderUpdated');
  }, [token]);

  // --- NEW: LIVE GPS TRACKING ENGINE ---
  useEffect(() => {
    let locationSubscription = null;

    const startTracking = async () => {
      // 1. Ask for GPS Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need GPS to track your delivery!');
        return;
      }

      // 2. If they have an active delivery, start reading GPS every 3 seconds!
      if (activeOrder && activeOrder.status === 'Out for Delivery') {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Read every 3 seconds
            distanceInterval: 1, // Or every 1 meter moved
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setMyLocation({ latitude, longitude }); // Update Driver Map
            
            // 3. Beam coordinates to the Backend!
            socket.emit('driverLocationUpdate', {
              orderId: activeOrder._id,
              latitude: latitude,
              longitude: longitude
            });
          }
        );
      }
    };

    startTracking();

    // Clean up tracking when order is delivered
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [activeOrder]);
  // -------------------------------------

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      setToken(response.data.token);
      fetchAvailableOrders(response.data.token);
    } catch (error) {
      alert("Login failed.");
    }
  };

  const acceptOrder = async (order) => {
    try {
      await axios.put(`${API_URL}/api/orders/${order._id}/driver`, 
        { status: 'Out for Delivery' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveOrder({ ...order, status: 'Out for Delivery' }); 
      setOrders(orders.filter(o => o._id !== order._id)); 
    } catch (error) {
      // FIX: This will pop up a box telling you EXACTLY why it failed!
      alert(`Error: ${error.message}`);
      console.log("ACCEPT ERROR:", error);
    }
  };

  const markDelivered = async () => {
    try {
      await axios.put(`${API_URL}/api/orders/${activeOrder._id}/driver`, 
        { status: 'Delivered' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Awesome!", "Delivery completed.");
      setActiveOrder(null); 
      setMyLocation(null); // Turn off GPS pin
      fetchAvailableOrders(token); 
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  if (!token) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.title}>🛵 Rider App</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Go Online</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🟢 Online (🔴 LIVE GPS)</Text>
      </View>

      {activeOrder ? (
        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMapWarning}>
              <Text>🗺️ GPS requires a physical phone!</Text>
            </View>
          ) : (
            <MapView
              style={{ flex: 1 }}
              region={{
                // Center map on Driver if we have GPS, otherwise Restaurant
                latitude: myLocation ? myLocation.latitude : 31.5204, 
                longitude: myLocation ? myLocation.longitude : 74.3587,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker coordinate={{ latitude: 31.5204, longitude: 74.3587 }} title="Pickup" pinColor="red" />
              <Marker coordinate={{ latitude: 31.5350, longitude: 74.3400 }} title="Dropoff" pinColor="blue" />
              
              {/* --- NEW: RIDER'S LIVE LOCATION PIN --- */}
              {myLocation && (
                <Marker coordinate={myLocation} title="You are here">
                  <Text style={{ fontSize: 30 }}>🛵</Text>
                </Marker>
              )}
            </MapView>
          )}

          <View style={styles.bottomCard}>
            <Text style={styles.subtitle}>Current Delivery</Text>
            <Text style={styles.restaurantName}>🍔 Pick up: {activeOrder.restaurant?.name}</Text>
            <Text style={styles.addressText}>{activeOrder.restaurant?.address}</Text>
            
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
            
            <Text style={styles.restaurantName}>🏠 Deliver to: {activeOrder.customer?.name}</Text>
            <Text style={styles.addressText}>{activeOrder.deliveryAddress}</Text>
            
            {activeOrder.customer?.phone && (
              <Text style={{ fontSize: 16, color: '#D70F64', fontWeight: 'bold', marginTop: 5 }}>
                📞 Call: {activeOrder.customer.phone}
              </Text>
            )}

            <TouchableOpacity style={styles.deliverButton} onPress={markDelivered}>
              <Text style={styles.buttonText}>✅ Mark as Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Text style={styles.subtitle}>Available Deliveries</Text>
          {loading ? <Text style={{textAlign:'center'}}>Searching...</Text> : null}
          {orders.length === 0 && !loading ? (
            <Text style={{textAlign:'center', marginTop: 20}}>No orders ready for pickup yet.</Text>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.restaurantName}>{item.restaurant?.name || 'Unknown Restaurant'}</Text>
                  <Text style={styles.addressText}>📍 Pickup: {item.restaurant?.address}</Text>
                  <Text style={styles.addressText}>🏠 Dropoff: {item.deliveryAddress}</Text>
                  <Text style={styles.payoutText}>Payout: Rs. {(item.totalAmount * 0.15).toFixed(2)}</Text> 
                  <TouchableOpacity style={styles.acceptButton} onPress={() => acceptOrder(item)}>
                    <Text style={styles.buttonText}>Accept Delivery</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loginContainer: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' }, 
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#10ac84' },
  input: { backgroundColor: 'white', padding: 15, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, fontSize: 16 },
  button: { backgroundColor: '#10ac84', padding: 15, marginHorizontal: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  header: { backgroundColor: '#10ac84', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 20, fontWeight: 'bold', margin: 15 },
  card: { backgroundColor: 'white', padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, elevation: 3 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  addressText: { fontSize: 14, color: '#555', marginBottom: 5 },
  payoutText: { fontSize: 16, fontWeight: 'bold', color: '#10ac84', marginVertical: 10 },
  acceptButton: { backgroundColor: '#10ac84', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  deliverButton: { backgroundColor: '#2980b9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  webMapWarning: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' },
  bottomCard: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 }
});