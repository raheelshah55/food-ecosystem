import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';

// ⚠️ CHANGE TO YOUR IP
const API_URL = 'http://10.253.78.175:5000';
const FOODPANDA_PINK = '#D70F64';

export default function MenuScreen({ route, navigation }) {
  const { restaurantId, restaurantName } = route.params;
  const [menu, setMenu] = useState([]);
  const { cart, addToCart } = useContext(CartContext);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]); // Tracks what add-ons they clicked

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/menu/${restaurantId}`);
        setMenu(response.data);
      } catch (error) {
        console.error("Error fetching menu:", error);
      }
    };
    fetchMenu();
  }, [restaurantId]);

  // When a user clicks a food item...
  const handleFoodClick = (item) => {
    // If it has NO variations, just add it straight to cart!
    if (!item.variations || item.variations.length === 0) {
      addToCart(item, restaurantId);
    } else {
      // If it HAS variations, open the bottom sheet modal!
      setSelectedFood(item);
      setSelectedOptions([]); // Reset choices
      setModalVisible(true);
    }
  };

  // Toggle an add-on check box
  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(o => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  // Calculate price inside the modal
  const getModalTotalPrice = () => {
    if (!selectedFood) return 0;
    let total = selectedFood.price;
    selectedOptions.forEach(opt => { total += opt.additionalPrice });
    return total;
  };

  const handleModalAddToCart = () => {
    addToCart(selectedFood, restaurantId, selectedOptions, getModalTotalPrice());
    setModalVisible(false);
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleFoodClick(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.foodPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.addButtonIcon}>
        <Text style={{ color: FOODPANDA_PINK, fontWeight: 'bold', fontSize: 20 }}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurantName} Menu</Text>
      
      <FlatList
        data={menu}
        keyExtractor={(item) => item._id}
        renderItem={renderMenuItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {cart.length > 0 && (
        <TouchableOpacity style={styles.viewCartButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.viewCartText}>View Cart ({cart.length})</Text>
        </TouchableOpacity>
      )}

      {/* --- THE FOODPANDA BOTTOM SHEET MODAL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedFood?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 24, color: '#555' }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedFood?.variations?.map((variation, index) => (
                <View key={index} style={styles.variationGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.variationTitle}>{variation.title}</Text>
                    {variation.isRequired && <Text style={styles.requiredBadge}>Required</Text>}
                  </View>

                  {variation.options.map((option, optIdx) => (
                    <TouchableOpacity 
                      key={optIdx} 
                      style={styles.optionRow}
                      onPress={() => toggleOption(option)}
                    >
                      <Text style={styles.optionName}>{option.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {option.additionalPrice > 0 && <Text style={styles.optionPrice}>+${option.additionalPrice.toFixed(2)}</Text>}
                        <View style={[styles.checkbox, selectedOptions.includes(option) && styles.checkboxSelected]}>
                          {selectedOptions.includes(option) && <Text style={{color: 'white', fontSize: 12}}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            {/* Modal Add to Cart Button */}
            <TouchableOpacity style={styles.modalAddButton} onPress={handleModalAddToCart}>
              <Text style={styles.modalAddText}>Add to cart</Text>
              <Text style={styles.modalAddText}>${getModalTotalPrice().toFixed(2)}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', margin: 20, color: '#333' },
  card: { backgroundColor: 'white', padding: 15, marginHorizontal: 15, marginBottom: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  foodDesc: { color: '#7f8c8d', fontSize: 13, marginVertical: 5 },
  foodPrice: { color: '#333', fontWeight: 'bold' },
  addButtonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fdf0f4', justifyContent: 'center', alignItems: 'center' },
  
  viewCartButton: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: FOODPANDA_PINK, padding: 15, borderRadius: 10, alignItems: 'center', elevation: 5 },
  viewCartText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  
  variationGroup: { marginBottom: 25 },
  variationTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  requiredBadge: { backgroundColor: '#fdf0f4', color: FOODPANDA_PINK, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  optionName: { fontSize: 16, color: '#333' },
  optionPrice: { fontSize: 14, color: '#7f8c8d', marginRight: 15 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: FOODPANDA_PINK, borderColor: FOODPANDA_PINK },

  modalAddButton: { backgroundColor: FOODPANDA_PINK, flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, marginTop: 10 },
  modalAddText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});