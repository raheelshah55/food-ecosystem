import { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';

// ⚠️ CHANGE THIS TO YOUR EXACT IP ADDRESS!
const API_URL = 'http://10.253.78.175:5000';
const BRAND_COLOR = '#D70F64';

export default function CartScreen({ navigation }) {
  const { cart, getTotalPrice, token, setCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  
  // NEW: Address and Payment States
  const [address, setAddress] = useState('');
  const[paymentMethod, setPaymentMethod] = useState('COD');

  // NEW: Fetch user's saved address automatically!
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.address) {
          setAddress(response.data.address); // Pre-fill the address!
        }
      } catch (error) {
        console.error("Could not fetch address");
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Security check: Make sure they have an address!
    if (!address.trim()) {
      Alert.alert("Missing Address", "Please enter a delivery address.");
      return;
    }
    
    setLoading(true);

    try {
      const orderData = {
        restaurantId: cart[0].restaurantId,
        items: cart.map(item => ({
          menuItem: item._id,
          quantity: 1,
          customizations: item.selectedOptions ? item.selectedOptions.map(opt => opt.name) :[]
        })),
        totalAmount: getTotalPrice(),
        deliveryAddress: address, // Sends the typed/fetched address!
        paymentMethod: paymentMethod // Sends COD or Card!
      };

      await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCart([]);
      setLoading(false);
      navigation.replace('Tracking'); // Jump to Live Tracking

    } catch (error) {
      console.error(error);
      alert("Checkout failed!");
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.selectedOptions && item.selectedOptions.map((opt, idx) => (
          <Text key={idx} style={styles.addonText}>+ {opt.name}</Text>
        ))}
      </View>
      <Text style={styles.itemPrice}>Rs. {item.cartItemPrice || item.price}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>

      {cart.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Your cart is empty!</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          
          {/* --- THE CHECKOUT PANEL --- */}
          <View style={styles.checkoutPanel}>
            
            {/* Address Input */}
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter delivery address..." 
              value={address} 
              onChangeText={setAddress} 
            />

            {/* Payment Method Selector */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity 
                style={[styles.payButton, paymentMethod === 'COD' && styles.payButtonActive]}
                onPress={() => setPaymentMethod('COD')}
              >
                <Text style={[styles.payText, paymentMethod === 'COD' && styles.payTextActive]}>Cash on Delivery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.payButton, paymentMethod === 'Card' && styles.payButtonActive]}
                onPress={() => setPaymentMethod('Card')}
              >
                <Text style={[styles.payText, paymentMethod === 'Card' && styles.payTextActive]}>Credit Card</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 15 }} />

            <Text style={styles.totalText}>Total: Rs. {getTotalPrice()}</Text>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.checkoutText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#333' },
  card: { backgroundColor: 'white', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  addonText: { fontSize: 12, color: '#777', marginTop: 2, fontStyle: 'italic' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: BRAND_COLOR },
  
  checkoutPanel: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  payButton: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  payButtonActive: { backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR },
  payText: { fontWeight: 'bold', color: '#555' },
  payTextActive: { color: 'white' },
  
  totalText: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  checkoutButton: { backgroundColor: BRAND_COLOR, padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});