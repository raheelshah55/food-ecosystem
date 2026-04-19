import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(null);

  // NEW: addToCart now accepts selected add-ons and a calculated final price!
  const addToCart = (item, restaurantId, selectedOptions =[], finalPrice = item.price) => {
    setCart([...cart, { 
      ...item, 
      restaurantId, 
      selectedOptions, 
      cartItemPrice: finalPrice // The price INCLUDING add-ons
    }]);
    // Removed the annoying alert, Foodpanda uses silent cart additions!
  };

  // NEW: Calculate total using the final custom price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.cartItemPrice || item.price), 0).toFixed(2);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, getTotalPrice, setCart, token, setToken }}>
      {children}
    </CartContext.Provider>
  );
};