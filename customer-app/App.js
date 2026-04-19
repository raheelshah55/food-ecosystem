import ProfileScreen from './screens/ProfileScreen';
import TrackingScreen from './screens/TrackingScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartProvider } from './CartContext';

import LoginScreen from './screens/LoginScreen'; // Import Login
import HomeScreen from './screens/HomeScreen';
import MenuScreen from './screens/MenuScreen';
import CartScreen from './screens/CartScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        {/* Set Login as the initial route! */}
        <Stack.Navigator 
          initialRouteName="Login" 
          screenOptions={{
            headerStyle: { backgroundColor: '#D70F64' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '🍔 FoodDelivery' }} />
          <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Live Tracking' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}