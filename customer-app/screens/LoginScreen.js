import { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { CartContext } from '../CartContext';

// ⚠️ MAKE SURE THIS IS YOUR CURRENT LAPTOP IP ADDRESS
const API_URL = 'http://10.253.78.175:5000';
const BRAND_COLOR = '#D70F64';

export default function LoginScreen({ navigation }) {
  const[email, setEmail] = useState('admin@test.com'); 
  const [password, setPassword] = useState('password123');
  
  const { setToken } = useContext(CartContext); 

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      setToken(response.data.token);
      navigation.replace('Home');
    } catch (error) {
      console.log("LOGIN ERROR: ", error); // This prints the error to your VS Code terminal!
      alert("Login failed! Is your phone on the same Wi-Fi as your laptop?");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login to Order Food</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: BRAND_COLOR },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, elevation: 2 },
  button: { backgroundColor: BRAND_COLOR, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});