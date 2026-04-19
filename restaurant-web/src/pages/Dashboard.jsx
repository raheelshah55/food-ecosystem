import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function Dashboard() {
  const[orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await axios.get('https://food-ecosystem-api.onrender.com/api/orders/restaurant-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(); 

    const socket = io('https://food-ecosystem-api.onrender.com');
    socket.on('orderUpdated', () => {
      fetchOrders(); 
    });

    return () => socket.disconnect();
  }, [navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://food-ecosystem-api.onrender.com/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // FIX: Instantly update the screen without waiting for the Socket!
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🍳 Kitchen Dashboard (🔴 LIVE)</h2>
        <button 
          onClick={() => { localStorage.removeItem('token'); navigate('/'); }}
          style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      <h3>Incoming Orders ({orders.length})</h3>

      {orders.length === 0 ? (
        <p>No orders yet. Waiting for hungry customers...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order) => (
            <div key={order._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Order #{order._id.slice(-6)}</strong>
                <span style={{ 
                  backgroundColor: order.status === 'Pending' ? '#D70F64' : order.status === 'Preparing' ? '#17a2b8' : '#28a745', 
                  color: 'white',
                  padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' 
                }}>
                  {order.status}
                </span>
              </div>
              
              <p style={{ margin: '10px 0' }}><strong>Customer:</strong> {order.customer?.name || 'Unknown'}</p>
              
              {/* --- HERE IS THE NEW ADD-ONS DISPLAY! --- */}
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                {order.items.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <strong>{item.quantity}x {item.menuItem?.name}</strong>
                    
                    {/* If the customer picked add-ons, show them in gray text! */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                        + {item.customizations.join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {/* ---------------------------------------- */}
              
              <p style={{ margin: '0 0 15px 0', fontSize: '18px' }}><strong>Total: ${order.totalAmount}</strong></p>

              <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                {order.status === 'Pending' && (
                  <button onClick={() => updateOrderStatus(order._id, 'Preparing')} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    👨‍🍳 Accept & Start Cooking
                  </button>
                )}
                {order.status === 'Preparing' && (
                  <button onClick={() => updateOrderStatus(order._id, 'Ready')} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🛍️ Mark as Ready for Pickup
                  </button>
                )}
                {order.status === 'Ready' && (
                  <p style={{ margin: 0, color: 'gray', fontStyle: 'italic' }}>Waiting for driver...</p>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;