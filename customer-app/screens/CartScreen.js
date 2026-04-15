import { useContext, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';

export default function CartScreen({ navigation }) {
  const { cart, getTotalPrice, token, setCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Format the data to match what our Backend Order Model expects
      const orderData = {
        restaurantId: cart[0].restaurantId, // Assuming all items are from the same restaurant
        items: cart.map(item => ({
          menuItem: item._id,
          quantity: 1
        })),
        totalAmount: getTotalPrice(),
        deliveryAddress: "123 Mobile Phone Street" // Hardcoded for now
      };

      // 2. Send the Order! (Showing our VIP pass)
      await axios.post('http://localhost:5000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Success! Clear cart and go home
      alert("🎉 Order Placed Successfully!");
      setCart([]); // Empty the cart memory
      setLoading(false);
      navigation.navigate('Home');

    } catch (error) {
      console.error(error);
      alert("Checkout failed!");
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>${item.price}</Text>
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
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ${getTotalPrice()}</Text>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.checkoutText}>Complete Checkout</Text>
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
  card: { backgroundColor: 'white', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },
  totalContainer: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  totalText: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  checkoutButton: { backgroundColor: '#ff4757', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});