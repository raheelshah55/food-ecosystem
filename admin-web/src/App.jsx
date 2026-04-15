import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [email, setEmail] = useState('admin@test.com'); // We made this user in Step 3!
  const [password, setPassword] = useState('password123');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const[orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch Admin Data
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const orderRes = await axios.get('http://localhost:5000/api/orders/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userRes = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(orderRes.data);
      setUsers(userRes.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        alert("You are not an Admin!");
        handleLogout();
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      if (response.data.user.role !== 'admin') {
        alert("Access Denied. You are not an admin!");
        return;
      }

      setToken(response.data.token);
      localStorage.setItem('adminToken', response.data.token);
    } catch (error) {
      alert("Login failed!");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  // --- UI: LOGIN ---
  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'Arial', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
        <h2 style={{ textAlign: 'center', color: '#8e44ad' }}>👑 Admin Portal</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '10px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  // --- STATS CALCULATION ---
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const platformCut = (totalRevenue * 0.10).toFixed(2); // The platform takes a 10% fee!

  // --- UI: DASHBOARD ---
  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8e44ad', padding: '15px 20px', borderRadius: '10px', color: 'white' }}>
        <h1 style={{ margin: 0 }}>👑 God Mode Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Users</h3>
          <h2 style={{ margin: 0, fontSize: '32px' }}>{users.length}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Orders Processed</h3>
          <h2 style={{ margin: 0, fontSize: '32px' }}>{orders.length}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: '#2ecc71', padding: '20px', borderRadius: '10px', color: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Platform Revenue (10%)</h3>
          <h2 style={{ margin: 0, fontSize: '32px' }}>${platformCut}</h2>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2>All Platform Orders</h2>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '10px 0' }}>Order ID</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', color: '#888' }}>...{order._id.slice(-6)}</td>
                <td>{order.customer?.name}</td>
                <td>{order.restaurant?.name}</td>
                <td>{order.driver?.name || 'Unassigned'}</td>
                <td>
                  <span style={{ backgroundColor: order.status === 'Delivered' ? '#2ecc71' : '#f1c40f', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', color: order.status === 'Delivered' ? 'white' : 'black' }}>
                    {order.status}
                  </span>
                </td>
                <td>${order.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default App;