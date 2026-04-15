const express = require('express');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const verifyToken = require('../middleware/authMiddleware'); // Our Bouncer

const router = express.Router();

// --- PLACE AN ORDER (Customer) ---
router.post('/', verifyToken, async (req, res) => {
    try {
        const { restaurantId, items, totalAmount, deliveryAddress } = req.body;

        const newOrder = new Order({
            customer: req.user.userId, // Comes from the login token!
            restaurant: restaurantId,
            items,
            totalAmount,
            deliveryAddress
        });

        await newOrder.save();
        res.status(201).json({ message: "Order placed successfully!", order: newOrder });
await newOrder.save();
        
        // NEW: Tell everyone an order was updated!
        req.app.get('io').emit('orderUpdated'); 
        
        res.status(201).json({ message: "Order placed successfully!", order: newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- GET MY ORDERS (Customer App) ---
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        // Find orders belonging to this user, and pull in the restaurant and food names
        const orders = await Order.find({ customer: req.user.userId })
            .populate('restaurant', 'name')
            .populate('items.menuItem', 'name price');
            
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- GET ORDERS FOR THE LOGGED-IN RESTAURANT ---
router.get('/restaurant-orders', verifyToken, async (req, res) => {
    try {
        // 1. Find the restaurant owned by the logged-in user
        const restaurant = await Restaurant.findOne({ owner: req.user.userId });
        if (!restaurant) {
            return res.status(404).json({ message: "No restaurant found for this user." });
        }

        // 2. Find all orders for this restaurant (Newest first)
        const orders = await Order.find({ restaurant: restaurant._id })
            .populate('customer', 'name') // Get customer's name
            .populate('items.menuItem', 'name price') // Get food names
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- UPDATE ORDER STATUS (Restaurant) ---
// Notice the ":id", this is the specific Order ID we want to update!
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true } // Returns the newly updated order
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
// NEW: Tell everyone an order was updated!
        req.app.get('io').emit('orderUpdated');

        res.status(200).json({ message: "Status updated!", order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- GET AVAILABLE DELIVERIES (For Drivers) ---
router.get('/available', verifyToken, async (req, res) => {
    try {
        // Find orders that are "Ready" but don't have a driver yet
        const orders = await Order.find({ status: 'Ready', driver: null })
            .populate('restaurant', 'name address') // Get restaurant details
            .populate('customer', 'name'); // Get customer name
            
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- UPDATE ORDER STATUS (Driver) ---
router.put('/:id/driver', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
await order.save();

        // NEW: Tell everyone an order was updated!
        req.app.get('io').emit('orderUpdated');

        res.status(200).json({ message: "Delivery updated!", order });
        // If the driver is accepting the order, attach their ID to it!
        if (status === 'Out for Delivery') {
            order.driver = req.user.userId;
        }
        
        order.status = status;
        await order.save();

        res.status(200).json({ message: "Delivery updated!", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- GET ALL ORDERS (ADMIN ONLY) ---
router.get('/admin/all', verifyToken, async (req, res) => {
    try {
        // Security check: Only let admins see this!
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const orders = await Order.find()
            .populate('restaurant', 'name')
            .populate('customer', 'name')
            .populate('driver', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
module.exports = router;