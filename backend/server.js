require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // NEW: Required for sockets
const { Server } = require('socket.io'); // NEW: Import Socket.io

const app = express();

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } // Allow all of our apps to connect
});
app.set('io', io);
// Make 'io' available inside our routes!
io.on('connection', (socket) => {
    console.log('🔌 A device connected to Sockets:', socket.id);
    
    // --- NEW: CATCH DRIVER GPS AND FORWARD IT TO CUSTOMERS ---
    socket.on('driverLocationUpdate', (data) => {
        // data contains: { orderId, latitude, longitude }
        // We instantly broadcast this to everyone listening!
        io.emit('liveTracking', data); 
    });
    // ---------------------------------------------------------

    socket.on('disconnect', () => {
        console.log('Device disconnected');
    });
});
// -----------------------

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

// Import Routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.send({ message: "Welcome to the Food Ecosystem API!" });
});

const PORT = process.env.PORT || 5000;
// NEW: Change app.listen to server.listen to start BOTH Express and Sockets!
server.listen(PORT, () => {
    console.log(`🚀 Backend Server is running on port ${PORT}`);
});