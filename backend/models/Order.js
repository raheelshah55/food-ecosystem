const mongoose = require('mongoose');

// We create a mini-schema for items inside the order
const orderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, default: 1 },
    customizations: [String] // Holds ["Large", "Extra Cheese"]
});

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [orderItemSchema], // Array of items
    totalAmount: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    
    // --- NEW PAYMENT FEATURES ---
    paymentMethod: { type: String, enum:['COD', 'Card'], default: 'COD' },
    paymentStatus: { type: String, enum:['Pending', 'Paid'], default: 'Pending' },
    // ----------------------------
    
    status: { 
        type: String, 
        enum:['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'], 
        default: 'Pending' 
    },
    
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);