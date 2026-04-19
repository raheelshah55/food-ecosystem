const express = require('express');
const Restaurant = require('../models/restaurant');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // NEW: Import the Uploader!

const router = express.Router();

// --- CREATE A RESTAURANT WITH IMAGE ---
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, address, category, deliveryTime, deliveryFee } = req.body;

        const newRestaurant = new Restaurant({
            name,
            address,
            category: category || "Fast Food",
            deliveryTime: deliveryTime || "25-35 min",
            deliveryFee: deliveryFee || 150,
            
            // NEW: If a file was uploaded, save the secure Cloudinary URL!
            image: req.file ? req.file.path : "", 
            
            owner: req.user.userId 
        });

        await newRestaurant.save();
        res.status(201).json({ message: "Restaurant created!", restaurant: newRestaurant });

    } catch (error) {
        console.error("Restaurant Creation Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- GET ALL RESTAURANTS ---
router.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate('owner', 'name email');
        res.status(200).json(restaurants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;