const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Admin', 'CompanyManager', 'Employee', 'Customer', 'Driver'], 
        default: 'Customer' 
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    isActive: { type: Boolean, default: true }, // New field to control employee/manager status
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);