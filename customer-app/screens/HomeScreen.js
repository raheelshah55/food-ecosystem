import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';

export default function HomeScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/restaurants');
        setRestaurants(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      // NEW: When clicked, go to the 'Menu' screen and pass the restaurant's ID!
      onPress={() => navigation.navigate('Menu', { 
        restaurantId: item._id, 
        restaurantName: item.name 
      })}
    >
      <Text style={styles.restaurantName}>{item.name}</Text>
      <Text style={styles.restaurantAddress}>📍 {item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Restaurant</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item._id}
          renderItem={renderRestaurant}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#333' },
  card: { backgroundColor: 'white', padding: 20, marginHorizontal: 20, marginBottom: 15, borderRadius: 10, elevation: 3 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  restaurantAddress: { color: '#666', fontSize: 14 }
});