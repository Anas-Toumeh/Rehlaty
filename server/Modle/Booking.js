const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    tripId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trip', 
        required: true 
    },
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    selectedSeats: [{
        seatNumber: Number,
        passengerName: { type: String, required: true },
        passengerGender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
        passengerPhone: String,
        passengerNationalId: String
    }],
    totalPrice: { type: Number, required: true },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid', 'Cancelled'], 
        default: 'Pending' 
    },
    bookingDate: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ✅ إضافة virtual للحصول على معلومات الرحلة
bookingSchema.virtual('tripDetails', {
    ref: 'Trip',
    localField: 'tripId',
    foreignField: '_id',
    justOne: true
});

// ✅ إضافة virtual للحصول على معلومات المستخدم
bookingSchema.virtual('userDetails', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model('Booking', bookingSchema);