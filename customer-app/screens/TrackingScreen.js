import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';
import { io } from 'socket.io-client';
import MapView, { Marker } from 'react-native-maps';

// ⚠️ CHANGE THIS TO YOUR IP ADDRESS
const API_URL = 'http://10.253.78.175:5000';

// Global Socket Connection
const socket = io(API_URL, { transports: ['websocket'] });

export default function TrackingScreen({ navigation }) {
  const { token } = useContext(CartContext);
  const [order, setOrder] = useState(null);
  
  // NEW: State to hold the Rider's Live Location!
  const [riderLocation, setRiderLocation] = useState(null);

  const fetchLatestOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = response.data;
      if (orders.length > 0) {
        setOrder(orders[orders.length - 1]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchLatestOrder();

    // 1. Listen for standard status updates (Pending -> Cooking -> Ready)
    socket.on('orderUpdated', () => fetchLatestOrder());

    // 2. NEW: Listen for the Live GPS Signal!
    socket.on('liveTracking', (data) => {
      // Make sure the GPS data belongs to THIS specific order!
      if (order && data.orderId === order._id) {
        setRiderLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    });

    return () => {
      socket.off('orderUpdated');
      socket.off('liveTracking');
    };
  }, [token, order]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {Platform.OS === 'web' ? (
        <View style={styles.webMapWarning}>
          <Text>🗺️ Maps do not work in the Web Browser.</Text>
          <Text>Use Expo Go on your phone to see the map!</Text>
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          region={{
            // If the rider is moving, center the map on the rider! Otherwise, center on Restaurant.
            latitude: riderLocation ? riderLocation.latitude : 31.5204,
            longitude: riderLocation ? riderLocation.longitude : 74.3587,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={{ latitude: 31.5204, longitude: 74.3587 }} title="Restaurant" pinColor="red" />
          <Marker coordinate={{ latitude: 31.5350, longitude: 74.3400 }} title="You" pinColor="blue" />
          
          {/* --- NEW: THE MOVING RIDER ICON --- */}
          {riderLocation && order.status === 'Out for Delivery' && (
            <Marker coordinate={riderLocation} title="Your Rider">
              <Text style={{ fontSize: 35 }}>🛵</Text>
            </Marker>
          )}
          {/* ---------------------------------- */}
        </MapView>
      )}

      <View style={styles.bottomCard}>
        <Text style={styles.title}>Order Status</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: order.status === 'Delivered' ? '#2ecc71' : '#ffc107' }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>

        <Text style={styles.infoText}>Order #{order._id.slice(-6)}</Text>
        <Text style={styles.infoText}>Payment: {order.paymentMethod} (Rs. {order.totalAmount})</Text>
        
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 15 }} />

        {order.driver && (order.status === 'Out for Delivery' || order.status === 'Delivered') && (
          <View style={{ backgroundColor: '#fdf0f4', padding: 15, borderRadius: 10, marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#D70F64' }}>🛵 Your Rider: {order.driver.name}</Text>
            {order.driver.phone && <Text style={{ fontSize: 14, color: '#333', marginTop: 5 }}>📞 {order.driver.phone}</Text>}
          </View>
        )}

        {order.status === 'Pending' && <Text style={styles.subtext}>Waiting for restaurant to accept...</Text>}
        {order.status === 'Preparing' && <Text style={styles.subtext}>👨‍🍳 The kitchen is cooking your food!</Text>}
        {order.status === 'Ready' && <Text style={styles.subtext}>🛍️ Food is ready! Waiting for a rider...</Text>}
        
        {/* Changed text slightly to show tracking is active */}
        {order.status === 'Out for Delivery' && <Text style={styles.subtext}>📡 Tracking Rider Live...</Text>}
        
        {order.status === 'Delivered' && <Text style={styles.subtext}>✅ Enjoy your meal!</Text>}

        {order.status === 'Delivered' && (
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeButtonText}>Order Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  webMapWarning: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' },
  bottomCard: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 15 },
  statusText: { fontWeight: 'bold', fontSize: 16 },
  infoText: { fontSize: 16, color: '#555', marginBottom: 5 },
  subtext: { fontSize: 18, fontStyle: 'italic', color: '#8e44ad', textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  homeButton: { backgroundColor: '#ff4757', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  homeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});