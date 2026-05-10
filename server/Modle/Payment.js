// server\Modle\Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    fromCash: { type: mongoose.Schema.Types.ObjectId, ref: 'Cash', required: true },
    toCash: { type: mongoose.Schema.Types.ObjectId, ref: 'Cash', required: true },
    amount: { type: Number, required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
