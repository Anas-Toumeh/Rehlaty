// Modle/Cash.js (نسخة مبسطة بدون pre)
const mongoose = require('mongoose');

const cashSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    password: {
        type: String,
        required: true
    },
    
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

cashSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('Cash', cashSchema);