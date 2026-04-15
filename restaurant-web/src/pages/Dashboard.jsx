import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/orders/restaurant-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders(); // Fetch immediately on load

    // Connect to the Backend Socket
    const socket = io('http://localhost:5000');
    
    // Listen for the magic signal
    socket.on('orderUpdated', () => {
      console.log('🔔 Received socket signal: Order Updated! Refetching...');
      fetchOrders(); 
    });

    // Cleanup when leaving the page
    return () => socket.disconnect();
  }, [navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
                  backgroundColor: order.status === 'Pending' ? '#ffc107' : order.status === 'Preparing' ? '#17a2b8' : '#28a745', 
                  color: order.status === 'Pending' ? 'black' : 'white',
                  padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' 
                }}>
                  {order.status}
                </span>
              </div>
              
              <p style={{ margin: '10px 0' }}><strong>Customer:</strong> {order.customer?.name || 'Unknown'}</p>
              
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.menuItem?.name} 
                  </li>
                ))}
              </ul>
              
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