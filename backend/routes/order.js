const express = require('express');
const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// --- 1. PLACE ORDER (Customer) ---
router.post('/', verifyToken, async (req, res) => {
    try {
        const { restaurantId, items, totalAmount, deliveryAddress, paymentMethod } = req.body;
        const newOrder = new Order({
            customer: req.user.userId,
            restaurant: restaurantId,
            items,
            totalAmount,
            deliveryAddress,
            paymentMethod: paymentMethod || 'COD'
        });
        await newOrder.save();
        
        // This shouts to the Kitchen and Driver to Auto-Update!
        req.app.get('io').emit('orderUpdated'); 
        
        res.status(201).json({ message: "Order placed!", order: newOrder });
    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- 2. GET MY ORDERS (Customer) ---
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.userId })
            .populate('restaurant', 'name')
            .populate('items.menuItem', 'name price')
            .populate('driver', 'name phone');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 3. GET RESTAURANT ORDERS (Kitchen) ---
router.get('/restaurant-orders', verifyToken, async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.userId });
        if (!restaurant) return res.status(404).json({ message: "No restaurant found." });

        const orders = await Order.find({ restaurant: restaurant._id })
            .populate('customer', 'name phone') 
            .populate('items.menuItem', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 4. GET AVAILABLE ORDERS (Driver) ---
router.get('/available', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Ready', driver: null })
            .populate('restaurant', 'name address')
            .populate('customer', 'name phone');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 5. UPDATE STATUS (Kitchen) ---
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        
        req.app.get('io').emit('orderUpdated'); // Shouts to Driver and Customer to Auto-Update!
        
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("UPDATE STATUS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- 6. UPDATE STATUS (Driver) ---
router.put('/:id/driver', verifyToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // If accepting the order, attach the driver's ID!
        if (req.body.status === 'Out for Delivery') {
            order.driver = req.user.userId;
        }
        order.status = req.body.status;
        await order.save();

        req.app.get('io').emit('orderUpdated'); // Shouts to Customer to Auto-Update!
        
        res.status(200).json(order);
    } catch (error) {
        console.error("DRIVER UPDATE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- 7. ADMIN GET ALL ---
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Admins only." });
        const orders = await Order.find()
            .populate('restaurant', 'name')
            .populate('customer', 'name')
            .populate('driver', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;