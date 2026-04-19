import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import axios from 'axios';
import { io } from 'socket.io-client';

// ⚠️ CHANGE THIS TO YOUR RENDER URL!
const API_URL = 'https://food-ecosystem-api.onrender.com';

export default function App() {
  const [email, setEmail] = useState('driver@test.com');
  const [password, setPassword] = useState('password123');
  const [token, setToken] = useState(null);

  const [orders, setOrders] = useState([]);
  const[activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- UPDATED: Fetch Active Orders AND Available Orders ---
  const fetchDriverData = async (userToken) => {
    setLoading(true);
    try {
      // 1. Check if the driver is already delivering something
      const activeRes = await axios.get(`${API_URL}/api/orders/driver/active`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (activeRes.data) {
        setActiveOrder(activeRes.data); // Restore their active delivery!
      } else {
        setActiveOrder(null);
      }

      // 2. Fetch available orders
      const availRes = await axios.get(`${API_URL}/api/orders/available`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setOrders(availRes.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { transports:['websocket'] });
    
    // When sockets trigger, fetch both lists again
    socket.on('orderUpdated', () => fetchDriverData(token));
    
    return () => socket.disconnect();
  }, [token]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      setToken(response.data.token);
      fetchDriverData(response.data.token);
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
      // Wait a half second and re-fetch everything from the server to be safe
      setTimeout(() => fetchDriverData(token), 500); 
    } catch (error) {
      alert("Failed to accept order.");
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
      fetchDriverData(token);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🛵 Driver App</Text>
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
        <Text style={styles.headerText}>🟢 Online (🔴 LIVE)</Text>
      </View>

      {activeOrder ? (
        <View style={{ flex: 1 }}>
          
          {/* REPLACED THE CRASHING MAP WITH A SAFE UI FOR NOW */}
          <View style={styles.enRouteContainer}>
            <Text style={{ fontSize: 60 }}>🛵💨</Text>
            <Text style={styles.enRouteText}>You are on the way!</Text>
            <Text style={{ color: '#666', marginTop: 10 }}>Drive safely to the customer.</Text>
          </View>

          <View style={styles.bottomCard}>
            <Text style={styles.subtitle}>Current Delivery</Text>
            <Text style={styles.restaurantName}>🍔 Pick up: {activeOrder.restaurant?.name}</Text>
            <Text style={styles.addressText}>{activeOrder.restaurant?.address}</Text>
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
            <Text style={styles.restaurantName}>🏠 Deliver to: {activeOrder.customer?.name}</Text>
            <Text style={styles.addressText}>{activeOrder.deliveryAddress}</Text>

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
                  <Text style={styles.payoutText}>Payout: ${(item.totalAmount * 0.15).toFixed(2)}</Text> 
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
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#10ac84' },
  input: { backgroundColor: 'white', padding: 15, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, fontSize: 16 },
  button: { backgroundColor: '#10ac84', padding: 15, marginHorizontal: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  header: { backgroundColor: '#10ac84', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  card: { backgroundColor: 'white', padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, elevation: 3 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  addressText: { fontSize: 14, color: '#555', marginBottom: 5 },
  payoutText: { fontSize: 16, fontWeight: 'bold', color: '#10ac84', marginVertical: 10 },
  acceptButton: { backgroundColor: '#10ac84', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  deliverButton: { backgroundColor: '#2980b9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  
  // NEW STYLES
  enRouteContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f8f5' },
  enRouteText: { fontSize: 24, fontWeight: 'bold', color: '#10ac84', marginTop: 20 },
  bottomCard: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 }
});