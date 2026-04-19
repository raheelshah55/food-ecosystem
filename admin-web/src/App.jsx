import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [email, setEmail] = useState('admin@test.com'); 
  const[password, setPassword] = useState('password123');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const [orders, setOrders] = useState([]);
  const[users, setUsers] = useState([]);

  // --- NEW STATES FOR UPLOADING RESTAURANT ---
  const[newResName, setNewResName] = useState('');
  const [newResAddress, setNewResAddress] = useState('');
  const [newResImage, setNewResImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  // ------------------------------------------

  useEffect(() => {
    if (token) fetchData();
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

  // --- NEW: FUNCTION TO UPLOAD RESTAURANT TO CLOUDINARY ---
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!newResImage) return alert("Please select an image!");
    
    setUploading(true);
    
    try {
      // To send files in React, we MUST use FormData!
      const formData = new FormData();
      formData.append('name', newResName);
      formData.append('address', newResAddress);
      formData.append('image', newResImage); // Attach the file!

      await axios.post('http://localhost:5000/api/restaurants', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // Tell backend a file is coming!
        }
      });

      alert("🎉 Restaurant Created & Image Uploaded to Cloudinary!");
      setNewResName('');
      setNewResAddress('');
      setNewResImage(null);
    } catch (error) {
      console.error(error);
      alert("Upload failed. Check your Cloudinary keys in .env!");
    }
    setUploading(false);
  };
  // --------------------------------------------------------

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

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const platformCut = (totalRevenue * 0.10).toFixed(2);

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8e44ad', padding: '15px 20px', borderRadius: '10px', color: 'white' }}>
        <h1 style={{ margin: 0 }}>👑 God Mode Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* --- NEW: ADD RESTAURANT UPLOAD SECTION --- */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#D70F64', margin: '0 0 15px 0' }}>➕ Add New Restaurant</h2>
        
        <form onSubmit={handleAddRestaurant} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Restaurant Name (e.g. KFC)" value={newResName} onChange={e => setNewResName(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          <input type="text" placeholder="Address (e.g. Lahore)" value={newResAddress} onChange={e => setNewResAddress(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
          
          {/* File Input! */}
          <input type="file" accept="image/*" onChange={e => setNewResImage(e.target.files[0])} required />
          
          <button type="submit" disabled={uploading} style={{ padding: '10px 20px', backgroundColor: '#D70F64', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {uploading ? "⏳ Uploading to Cloud..." : "Upload & Create"}
          </button>
        </form>
      </div>
      {/* ------------------------------------------ */}

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
          <h2 style={{ margin: 0, fontSize: '32px' }}>Rs. {platformCut}</h2>
        </div>
      </div>

    </div>
  );
}

export default App;