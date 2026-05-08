// controllers/bookingController.js
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

exports.createBooking = async (req, res) => {
    try {
        const { tripId, selectedSeats, totalPrice } = req.body;
        const userId = req.user._id;

        // 1. جلب الرحلة مع معلومات الشركة
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'الرحلة غير موجودة'
            });
        }

        // 2. جلب جميع الحجوزات المؤكدة لهذه الرحلة
        const existingBookings = await Booking.find({
            tripId: tripId,
            paymentStatus: { $ne: 'Cancelled' }
        });

        // 3. حساب المقاعد المحجوزة حالياً
        const bookedSeats = [];
        for (const booking of existingBookings) {
            for (const seat of booking.selectedSeats) {
                bookedSeats.push(seat.seatNumber);
            }
        }

        // 4. التحقق من أن المقاعد المطلوبة غير محجوزة مسبقاً
        for (const seat of selectedSeats) {
            if (bookedSeats.includes(seat.seatNumber)) {
                return res.status(400).json({
                    success: false,
                    message: `المقعد رقم ${seat.seatNumber} غير متاح`
                });
            }
        }

        // 5. التحقق من أن عدد المقاعد لا يتجاوز السعة القصوى
        const totalSeatsToBook = selectedSeats.length;
        const availableSeats = trip.totalSeats - bookedSeats.length;
        
        if (totalSeatsToBook > availableSeats) {
            return res.status(400).json({
                success: false,
                message: `لا يوجد مقاعد كافية. المتاح: ${availableSeats} مقعد`
            });
        }

        // 6. إنشاء الحجز
        const booking = new Booking({
            userId,
            tripId,
            companyId: trip.companyId,
            selectedSeats,
            totalPrice,
            paymentStatus: 'Paid'
        });

        await booking.save();

        // 7. إعادة الحجز مع populate
        await booking.populate('tripDetails');
        await booking.populate('userDetails');

        res.status(201).json({
            success: true,
            message: 'تم الحجز بنجاح',
            booking
        });

    } catch (error) {
        console.error('Error in createBooking:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء الحجز',
            error: error.message
        });
    }
};

