const express = require('express');
const MenuItem = require('../models/menuItem');
const verifyToken = require('../middleware/authMiddleware'); // Our Bouncer

const router = express.Router();

// --- ADD A MENU ITEM (Requires Login) ---
router.post('/', verifyToken, async (req, res) => {
    try {
        // 1. We added 'variations' here so it grabs it from Thunder Client!
        const { name, description, price, restaurantId, variations } = req.body;

        const newMenuItem = new MenuItem({
            name,
            description,
            price,
            restaurant: restaurantId,
            variations: variations ||[] // 2. We added it here so it saves to the database!
        });

        await newMenuItem.save();
        res.status(201).json({ message: "Menu item added!", menuItem: newMenuItem });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// --- GET MENU FOR A SPECIFIC RESTAURANT (Public - for the Customer App) ---
// Notice the ":restaurantId" in the URL. This is a dynamic variable!
router.get('/:restaurantId', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ restaurant: req.params.restaurantId });
        res.status(200).json(menuItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
// forcing update
module.exports = router;