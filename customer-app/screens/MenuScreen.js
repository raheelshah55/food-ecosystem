import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext'; // Import the cart memory

export default function MenuScreen({ route, navigation }) {
  const { restaurantId, restaurantName } = route.params;
  const [menu, setMenu] = useState([]);
  
  // Pull the addToCart function and cart data from our Context!
  const { cart, addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/menu/${restaurantId}`);
        setMenu(response.data);
      } catch (error) {
        console.error("Error fetching menu:", error);
      }
    };
    fetchMenu();
  }, [restaurantId]);

  const renderMenuItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDesc}>{item.description}</Text>
        <Text style={styles.foodPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => addToCart(item, restaurantId)} // ACTUALLY ADD TO CART
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu for {restaurantName}</Text>
      
      <FlatList
        data={menu}
        keyExtractor={(item) => item._id}
        renderItem={renderMenuItem}
        contentContainerStyle={{ paddingBottom: 80 }} // Space for the bottom button
      />

      {/* Floating View Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity 
          style={styles.viewCartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.viewCartText}>
            View Cart ({cart.length} items)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#333' },
  card: { backgroundColor: 'white', padding: 15, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  foodName: { fontSize: 16, fontWeight: 'bold' },
  foodDesc: { color: '#666', fontSize: 12, marginVertical: 5 },
  foodPrice: { color: '#28a745', fontWeight: 'bold' },
  addButton: { backgroundColor: '#ff4757', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  
  viewCartButton: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 5 },
  viewCartText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});