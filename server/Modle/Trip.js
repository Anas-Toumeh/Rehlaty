const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: false 
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    
    departureTime: { type: Date, required: true }, 
    arrivalTime: { type: Date, required: true },

    price: { type: Number, required: true },
    
    totalSeats: { type: Number, default: 0 }, // يتم تعبئتها من bus.capacity
    
    status: {
        type: String,
        enum: ['Scheduled', 'OnWay', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    
    notes: { type: String },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ✅ العلاقة مع الحجوزات
TripSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'tripId'
});

// ✅ حساب عدد المقاعد المحجوزة
TripSchema.virtual('bookedSeatsCount').get(function() {
    if (!this.bookings || this.bookings.length === 0) return 0;
    
    let totalBookedSeats = 0;
    for (const booking of this.bookings) {
        // إذا كان الحجز غير ملغي، نحسب المقاعد
        if (booking.paymentStatus !== 'Cancelled') {
            totalBookedSeats += booking.selectedSeats?.length || 0;
        }
    }
    return totalBookedSeats;
});

// ✅ حساب عدد المقاعد المتاحة
TripSchema.virtual('availableSeatsCount').get(function() {
    const booked = this.bookedSeatsCount || 0;
    const total = this.totalSeats || 0;
    return total - booked;
});

// ✅ دمج المسار
TripSchema.virtual('route').get(function() {
    return `${this.from} → ${this.to}`;
});

module.exports = mongoose.model('Trip', TripSchema);