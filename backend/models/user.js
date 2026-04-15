const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'driver', 'restaurant', 'admin'], // These are the 4 roles!
        default: 'customer' 
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);