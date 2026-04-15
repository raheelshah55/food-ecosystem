import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Import our new page

function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Arial' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* Use it here! */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;