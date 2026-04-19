const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    
    // --- NEW FOODPANDA FEATURE: VARIATIONS & ADD-ONS ---
    variations:[
        {
            title: String, // e.g., "Choose Size" or "Extra Toppings"
            isRequired: Boolean, // Must they pick one? (e.g., Size is required, Toppings are optional)
            options:[
                {
                    name: String, // e.g., "Large" or "Extra Cheese"
                    additionalPrice: Number // e.g., 2.00
                }
            ]
        }
    ]
    // ----------------------------------------------------
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);