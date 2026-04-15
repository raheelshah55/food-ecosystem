import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import axios from 'axios';
import { io } from 'socket.io-client'; // 1. IMPORTING SOCKETS!

export default function App() {
  const [email, setEmail] = useState('driver@test.com');
  const [password, setPassword] = useState('password123');
  const[token, setToken] = useState(null);

  const [orders, setOrders] = useState([]);
  const[activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // We moved this up so the Socket can use it to refresh the screen!
  const fetchAvailableOrders = async (userToken) => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders/available', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // 2. THIS IS THE MAGIC SOCKET CONNECTION!
  useEffect(() => {
    if (!token) return; // Only connect if logged in

    // Connect to the backend using websocket!
    const socket = io('http://localhost:5000', {
      transports:['websocket'],
    });
    
    socket.on('connect', () => {
      console.log('✅ Driver App connected to Sockets!');
    });

    // Listen for the backend signal to refresh the data automatically
    socket.on('orderUpdated', () => {
      console.log('🔔 Socket signal received! Refetching deliveries...');
      fetchAvailableOrders(token);
    });

    return () => socket.disconnect();
  }, [token]);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      setToken(response.data.token);
      fetchAvailableOrders(response.data.token);
    } catch (error) {
      alert("Login failed.");
    }
  };

  const acceptOrder = async (order) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${order._id}/driver`, 
        { status: 'Out for Delivery' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setActiveOrder({ ...order, status: 'Out for Delivery' });
      Alert.alert("Delivery Accepted", "Head to the restaurant!");
    } catch (error) {
      alert("Failed to accept order.");
    }
  };

  const markDelivered = async () => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${activeOrder._id}/driver`, 
        { status: 'Delivered' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Awesome!", "Delivery completed. Earnings added to your account.");
      setActiveOrder(null);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  // UI: LOGIN SCREEN
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

  // UI: DELIVERIES SCREEN
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Notice we removed the manual Refresh button! It's automatic now! */}
        <Text style={styles.headerText}>🟢 Online (🔴 LIVE)</Text>
      </View>

      {activeOrder ? (
        <View style={{ padding: 20 }}>
          <Text style={styles.subtitle}>Current Delivery</Text>
          <View style={[styles.card, { borderColor: '#10ac84', borderWidth: 2 }]}>
            <Text style={styles.restaurantName}>🍔 Pick up from: {activeOrder.restaurant?.name}</Text>
            <Text style={styles.addressText}>{activeOrder.restaurant?.address}</Text>
            
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 15 }} />
            
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
  subtitle: { fontSize: 20, fontWeight: 'bold', margin: 20 },
  card: { backgroundColor: 'white', padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, elevation: 3 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  addressText: { fontSize: 14, color: '#555', marginBottom: 5 },
  payoutText: { fontSize: 16, fontWeight: 'bold', color: '#10ac84', marginVertical: 10 },
  acceptButton: { backgroundColor: '#10ac84', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  deliverButton: { backgroundColor: '#2980b9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 }
});