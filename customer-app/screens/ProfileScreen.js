import { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';

// ⚠️ CHANGE THIS TO YOUR IP ADDRESS
const API_URL = 'http://10.253.78.175:5000';
const BRAND_COLOR = '#D70F64';

export default function ProfileScreen({ navigation }) {
  const { token, setToken } = useContext(CartContext);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing profile data when screen opens
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setName(response.data.name);
        setPhone(response.data.phone || '');
        setAddress(response.data.address || '');
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, [token]);

  // Save the new profile data!
  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/profile`, { phone, address }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack(); // Go back to the previous screen
    } catch (error) {
      alert("Failed to update profile");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.greeting}>Hi, {name}!</Text>

      <Text style={styles.label}>Phone Number</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. 0300 1234567" 
        value={phone} 
        onChangeText={setPhone} 
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Delivery Address</Text>
      <TextInput 
        style={[styles.input, { height: 80 }]} 
        placeholder="House #, Street, City" 
        value={address} 
        onChangeText={setAddress} 
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_COLOR, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 20, marginBottom: 10 },
  avatarText: { fontSize: 40, color: 'white', fontWeight: 'bold' },
  greeting: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16, elevation: 1, textAlignVertical: 'top' },
  saveButton: { backgroundColor: BRAND_COLOR, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  logoutButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' }
});