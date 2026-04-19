import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';
import { io } from 'socket.io-client';

// ⚠️ MAKE SURE THIS IS YOUR RENDER URL!
const API_URL = 'https://food-ecosystem-api.onrender.com';
const BRAND_COLOR = '#D70F64'; // Premium Pink

export default function TrackingScreen({ navigation }) {
  const { token } = useContext(CartContext);
  const [order, setOrder] = useState(null);

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

    const socket = io(API_URL, { transports: ['websocket'] });
    
    socket.on('orderUpdated', () => {
      console.log('🔔 Order Status Changed! Refetching...');
      fetchLatestOrder();
    });

    return () => socket.disconnect();
  }, [token]);

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ textAlign: 'center', fontSize: 18 }}>Setting up your tracking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* REPLACED THE CRASHING MAP WITH A BEAUTIFUL GRAPHIC */}
      <View style={styles.graphicContainer}>
        {order.status === 'Pending' && <Text style={styles.emoji}>🕒</Text>}
        {order.status === 'Preparing' && <Text style={styles.emoji}>👨‍🍳</Text>}
        {order.status === 'Ready' && <Text style={styles.emoji}>🛍️</Text>}
        {order.status === 'Out for Delivery' && <Text style={styles.emoji}>🛵💨</Text>}
        {order.status === 'Delivered' && <Text style={styles.emoji}>🎉</Text>}
        
        <Text style={styles.graphicText}>
          {order.status === 'Delivered' ? 'Order Complete!' : 'On the way to you!'}
        </Text>
      </View>

      {/* THE LIVE STATUS CARD */}
      <View style={styles.bottomCard}>
        <Text style={styles.title}>Order Status</Text>
        
        <View style={[styles.statusBadge, 
          { backgroundColor: order.status === 'Delivered' ? '#2ecc71' : '#ffc107' }
        ]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>

        <Text style={styles.infoText}>Order #{order._id.slice(-6)}</Text>
        <Text style={styles.infoText}>Total: ${order.totalAmount.toFixed(2)}</Text>
        
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 15 }} />

        {order.status === 'Pending' && <Text style={styles.subtext}>Waiting for restaurant to accept...</Text>}
        {order.status === 'Preparing' && <Text style={styles.subtext}>The kitchen is cooking your food!</Text>}
        {order.status === 'Ready' && <Text style={styles.subtext}>Food is ready! Waiting for a driver...</Text>}
        {order.status === 'Out for Delivery' && <Text style={styles.subtext}>Driver is en route to your location!</Text>}
        {order.status === 'Delivered' && <Text style={styles.subtext}>Enjoy your meal!</Text>}

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
  container: { flex: 1, backgroundColor: '#fdf0f4' },
  
  // New Graphic Styles
  graphicContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 10 },
  graphicText: { fontSize: 22, fontWeight: 'bold', color: BRAND_COLOR },

  bottomCard: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 15 },
  statusText: { fontWeight: 'bold', fontSize: 16 },
  infoText: { fontSize: 16, color: '#555', marginBottom: 5 },
  subtext: { fontSize: 18, fontStyle: 'italic', color: BRAND_COLOR, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  homeButton: { backgroundColor: BRAND_COLOR, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  homeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});