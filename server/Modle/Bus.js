const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    plateNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    busType: { type: String, enum: ['VIP', 'Normal'], default: 'Normal' },
    features: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Bus', busSchema);