const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const verifyToken = require('../middleware/authMiddleware'); // Security bouncer

const router = express.Router();

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword, role: role || 'customer' });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- UPDATE USER PROFILE ---
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { phone, address } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId, 
            { phone, address }, 
            { new: true }
        ).select('-password'); 

        res.status(200).json({ message: "Profile updated!", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- GET MY PROFILE ---
router.get('/my-profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- GET ALL USERS (ADMIN ONLY) ---
router.get('/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Access denied." });
        const users = await User.find().select('-password'); 
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;