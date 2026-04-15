const express = require('express');
const Restaurant = require('../models/Restaurant');
const verifyToken = require('../middleware/authMiddleware'); // Our Bouncer!

const router = express.Router();

// --- CREATE A RESTAURANT (Requires Login) ---
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, address, image } = req.body;

        // Create the restaurant and assign the logged-in user as the owner
        const newRestaurant = new Restaurant({
            name,
            address,
            image,
            owner: req.user.userId // This comes from our Bouncer (the token)
        });

        await newRestaurant.save();
        res.status(201).json({ message: "Restaurant created!", restaurant: newRestaurant });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- GET ALL RESTAURANTS (Public - for the Customer App) ---
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