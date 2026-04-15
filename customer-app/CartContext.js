import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(null); // NEW: Memory for our VIP Pass!

  const addToCart = (item, restaurantId) => {
    setCart([...cart, { ...item, restaurantId }]);
    alert(`${item.name} added to cart!`);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  return (
    // We added token and setToken to the provider value
    <CartContext.Provider value={{ cart, addToCart, getTotalPrice, setCart, token, setToken }}>
      {children}
    </CartContext.Provider>
  );
};