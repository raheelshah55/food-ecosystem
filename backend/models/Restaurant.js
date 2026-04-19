const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    image: { type: String, default: "" },
    
    // --- NEW FOODPANDA FEATURES ---
    category: { type: String, default: "Burgers" }, // e.g., Pizza, Asian, Desserts
    rating: { type: Number, default: 4.5 },
    deliveryFee: { type: Number, default: 1.49 },
    deliveryTime: { type: String, default: "25-35 min" },
    // ------------------------------

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);