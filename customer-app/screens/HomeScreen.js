import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import axios from 'axios';

// ⚠️ CHANGE THIS TO YOUR IP ADDRESS
const API_URL = 'https://food-ecosystem-api.onrender.com'; 
const BRAND_COLOR = '#D70F64';

export default function HomeScreen({ navigation }) {
  const[restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const[searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories =['All', 'Burgers', 'Pizza', 'Desi', 'Fast Food', 'Desserts']; 

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/restaurants`);
        setRestaurants(response.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchRestaurants();
  },[]);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const resCategory = restaurant.category || 'Burgers'; 
    const matchesCategory = selectedCategory === 'All' || resCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Menu', { restaurantId: item._id, restaurantName: item.name })}
    >
      {/* --- NEW: REAL IMAGE DISPLAY --- */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 40 }}>🍽️</Text>
        </View>
      )}
      {/* ------------------------------- */}
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {item.rating || 4.5}</Text>
          </View>
        </View>
        
        <Text style={styles.tags}>{item.category || 'Fast Food'} • Rs. Rs. Rs.</Text>
        
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>🛵 {item.deliveryTime || '25-35 min'}</Text>
          <Text style={styles.deliveryText}> • </Text>
          <Text style={styles.deliveryText}>Rs. {item.deliveryFee || 150} delivery</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.locationText}>📍 Delivering to <Text style={{fontWeight: 'bold'}}>Current Location</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileIcon}>
              <Text style={{color: BRAND_COLOR, fontWeight: 'bold'}}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TextInput 
          style={styles.searchBar}
          placeholder="🔍 Search for restaurants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.title}>All Restaurants</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item._id}
          renderItem={renderRestaurant}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No restaurants found!</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: BRAND_COLOR, padding: 20, paddingTop: 10, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  locationText: { color: 'white', fontSize: 16 },
  profileIcon: { width: 35, height: 35, backgroundColor: 'white', borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  searchBar: { backgroundColor: 'white', padding: 12, borderRadius: 10, fontSize: 16, elevation: 5 },
  categoriesContainer: { paddingVertical: 15, paddingLeft: 15 },
  categoryPill: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, elevation: 2 },
  categoryPillActive: { backgroundColor: BRAND_COLOR },
  categoryText: { fontWeight: 'bold', color: '#555' },
  categoryTextActive: { color: 'white' },
  title: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, color: '#333' },
  
  card: { backgroundColor: 'white', marginHorizontal: 15, marginBottom: 20, borderRadius: 15, overflow: 'hidden', elevation: 3 },
  
  // NEW: Image styling
  restaurantImage: { width: '100%', height: 160, resizeMode: 'cover' },
  
  imagePlaceholder: { backgroundColor: '#ffd1dc', height: 160, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  ratingBadge: { backgroundColor: '#f1c40f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontWeight: 'bold', fontSize: 12 },
  tags: { color: '#7f8c8d', fontSize: 14, marginBottom: 10 },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center' },
  deliveryText: { color: '#2c3e50', fontSize: 14, fontWeight: '500' }
});