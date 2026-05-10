// controllers/bookingController.js
const Booking = require('../Modle/Booking');
const Trip = require('../Modle/Trip');
const Cash = require('../Modle/Cash');
const Company = require('../Modle/Company');
const Payment = require('../Modle/Payment');
const User = require('../Modle/User');
const bcrypt = require('bcryptjs');

exports.createBooking = async (req, res) => {
    try {
        const { tripId, selectedSeats, totalPrice } = req.body;
        
        
        const userId = req.user.id;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'الرحلة غير موجودة'
            });
        }

        const existingBookings = await Booking.find({
            tripId: tripId,
            paymentStatus: { $ne: 'Cancelled' }
        });

        const bookedSeats = [];
        for (const booking of existingBookings) {
            for (const seat of booking.selectedSeats) {
                bookedSeats.push(seat.seatNumber);
            }
        }

        for (const seat of selectedSeats) {
            if (bookedSeats.includes(seat.seatNumber)) {
                return res.status(400).json({
                    success: false,
                    message: `المقعد رقم ${seat.seatNumber} غير متاح`
                });
            }
        }

        const totalSeatsToBook = selectedSeats.length;
        const availableSeats = trip.totalSeats - bookedSeats.length;
        
        if (totalSeatsToBook > availableSeats) {
            return res.status(400).json({
                success: false,
                message: `لا يوجد مقاعد كافية. المتاح: ${availableSeats} مقعد`
            });
        }

        const booking = new Booking({
            userId,
            tripId,
            companyId: trip.companyId,
            selectedSeats,
            totalPrice,
            paymentStatus: 'Paid'
        });

        await booking.save();

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

// @desc    Create booking and process wallet payment (simulated cash wallets)
// @route   POST /api/bookings/pay
// @access  Private (Customer)
exports.createBookingWithPayment = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { tripId, selectedSeats, phone, password } = req.body;

        // Basic validation
        if (!tripId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({ success: false, message: 'بيانات الحجز غير مكتملة' });
        }

        // 1) fetch trip
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'الرحلة غير موجودة' });
        }

        // 2) validate seat numbers and uniqueness
        const seatNumbers = selectedSeats.map(s => Number(s.seatNumber)).filter(n => !Number.isNaN(n));
        if (seatNumbers.length !== selectedSeats.length) {
            return res.status(400).json({ success: false, message: 'بيانات أرقام المقاعد غير صحيحة' });
        }
        const uniqueSeats = [...new Set(seatNumbers)];
        if (uniqueSeats.length !== seatNumbers.length) {
            return res.status(400).json({ success: false, message: 'يوجد مقاعد مكررة في الطلب' });
        }
        const maxSeats = trip.totalSeats || 45;
        for (const n of seatNumbers) {
            if (n < 1 || n > maxSeats) {
                return res.status(400).json({ success: false, message: `رقم مقعد غير صالح: ${n}` });
            }
        }

        // 3) server-side amount calculation
        const amount = seatNumbers.length * (trip.price || 0);

        // 4) initial availability check
        const existingBookings = await Booking.find({ tripId: trip._id, paymentStatus: { $ne: 'Cancelled' } });
        const bookedSet = new Set();
        for (const b of existingBookings) {
            for (const s of b.selectedSeats) {
                bookedSet.add(Number(s.seatNumber));
            }
        }
        for (const n of seatNumbers) {
            if (bookedSet.has(n)) {
                return res.status(400).json({ success: false, message: `المقعد رقم ${n} غير متاح` });
            }
        }

        // 5) find payer cash account by phone
        const payer = await Cash.findOne({ phone });
        if (!payer) {
            return res.status(404).json({ success: false, message: 'الحساب غير موجود' });
        }

        // 6) ensure payer belongs to logged-in user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
        }
        if (String(user.phone) !== String(payer.phone)) {
            return res.status(403).json({ success: false, message: 'محفظة الدفع لا تنتمي للمستخدم المسجل' });
        }

        // 7) verify password
        const isMatch = await bcrypt.compare(password, payer.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
        }

        // 8) attempt atomic debit from payer (prevents overdraft)
        const debitResult = await Cash.updateOne(
            { _id: payer._id, balance: { $gte: amount } },
            { $inc: { balance: -amount } }
        );

        if (!debitResult || debitResult.modifiedCount === 0) {
            const freshPayer = await Cash.findById(payer._id);
            return res.status(400).json({ success: false, message: `الرصيد غير كافٍ. الرصيد الحالي: ${freshPayer ? freshPayer.balance : 0} ل.س` });
        }

        // 9) find company and its receiver cash by company.phone
        const company = await Company.findById(trip.companyId);
        if (!company) {
            // refund payer
            await Cash.updateOne({ _id: payer._id }, { $inc: { balance: amount } });
            return res.status(404).json({ success: false, message: 'شركة الرحلة غير موجودة' });
        }

        const receiver = await Cash.findOne({ phone: company.phone });
        if (!receiver) {
            // refund payer
            await Cash.updateOne({ _id: payer._id }, { $inc: { balance: amount } });
            return res.status(400).json({ success: false, message: 'Company wallet is not configured.' });
        }

        // 10) credit receiver
        await Cash.updateOne({ _id: receiver._id }, { $inc: { balance: amount } });

        // 11) final availability re-check (to avoid race) BEFORE creating booking
        const conflicting = await Booking.findOne({
            tripId: trip._id,
            paymentStatus: { $ne: 'Cancelled' },
            'selectedSeats.seatNumber': { $in: seatNumbers }
        });

        if (conflicting) {
            // refund payer and debit receiver
            try {
                await Cash.updateOne({ _id: payer._id }, { $inc: { balance: amount } });
                await Cash.updateOne({ _id: receiver._id }, { $inc: { balance: -amount } });
            } catch (refundErr) {
                console.error('Refund failed after seat conflict:', refundErr);
            }
            return res.status(400).json({ success: false, message: 'بعض المقاعد أصبحت محجوزة أثناء المعاملة. حاول مرة أخرى.' });
        }

        // 12) create payment record
        const payment = new Payment({
            fromCash: payer._id,
            toCash: receiver._id,
            amount,
            tripId: trip._id,
            status: 'Completed',
            note: `Payment by ${payer.phone} for trip ${trip._id}`
        });
        await payment.save();

        // 13) create booking and link payment
        const booking = new Booking({
            userId,
            tripId: trip._id,
            companyId: trip.companyId,
            selectedSeats,
            totalPrice: amount,
            paymentStatus: 'Paid',
            paymentId: payment._id
        });
        await booking.save();

        // 14) link bookingId -> payment
        payment.bookingId = booking._id;
        await payment.save();

        // 15) fetch updated payer balance
        const updatedPayer = await Cash.findById(payer._id);

        return res.status(201).json({
            success: true,
            message: 'تم الدفع وإنشاء الحجز بنجاح',
            booking,
            payment,
            accountBalance: updatedPayer ? updatedPayer.balance : null
        });

    } catch (error) {
        console.error('Error in createBookingWithPayment:', error);
        return res.status(500).json({ success: false, message: 'حدث خطأ داخلي' });
    }
};

exports.getBookedSeats = async (req, res) => {
    try {
        const { tripId } = req.params;
        
        const bookings = await Booking.find({
            tripId: tripId,
            paymentStatus: { $ne: 'Cancelled' }
        });
        
        const bookedSeats = [];
        for (const booking of bookings) {
            for (const seat of booking.selectedSeats) {
                bookedSeats.push(seat.seatNumber);
            }
        }
        
        res.status(200).json({
            success: true,
            bookedSeats: bookedSeats.sort((a, b) => a - b)
        });
        
    } catch (error) {
        console.error('Error in getBookedSeats:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب المقاعد المحجوزة'
        });
    }
};
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        
        const bookings = await Booking.find({ userId })
            .populate({
                path: 'tripId',
                populate: [
                    { path: 'companyId', select: 'name logo phone' },
                    { path: 'busId', select: 'busNumber plateNumber' },
                    { path: 'driverId', select: 'fullName phone' }
                ]
            })
            .sort({ createdAt: -1 });
        
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            bookingDate: booking.bookingDate,
            totalPrice: booking.totalPrice,
            paymentStatus: booking.paymentStatus,
            selectedSeats: booking.selectedSeats,
            tripDetails: booking.tripId ? {
                _id: booking.tripId._id,
                from: booking.tripId.from,
                to: booking.tripId.to,
                departureTime: booking.tripId.departureTime,
                arrivalTime: booking.tripId.arrivalTime,
                price: booking.tripId.price,
                companyName: booking.tripId.companyId?.name,
                companyLogo: booking.tripId.companyId?.logo,
                busNumber: booking.tripId.busId?.busNumber,
                driverName: booking.tripId.driverId?.fullName
            } : null
        }));
        
        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            bookings: formattedBookings
        });
        
    } catch (error) {
        console.error('Error in getMyBookings:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب حجوزاتك',
            error: error.message
        });
    }
};

// @route   GET /api/bookings/user/:userId
// @access  Private (Customer أو Admin)
exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (req.user.role !== 'Admin' && req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بمشاهدة هذه الحجوزات'
            });
        }
        
        const bookings = await Booking.find({ userId })
            .populate({
                path: 'tripId',
                populate: [
                    { path: 'companyId', select: 'name logo phone' },
                    { path: 'busId', select: 'busNumber plateNumber' },
                    { path: 'driverId', select: 'fullName phone' }
                ]
            })
            .sort({ createdAt: -1 });
        
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            bookingDate: booking.bookingDate,
            totalPrice: booking.totalPrice,
            paymentStatus: booking.paymentStatus,
            selectedSeats: booking.selectedSeats,
            tripDetails: booking.tripId ? {
                _id: booking.tripId._id,
                from: booking.tripId.from,
                to: booking.tripId.to,
                departureTime: booking.tripId.departureTime,
                arrivalTime: booking.tripId.arrivalTime,
                price: booking.tripId.price,
                companyName: booking.tripId.companyId?.name,
                companyLogo: booking.tripId.companyId?.logo,
                busNumber: booking.tripId.busId?.busNumber,
                driverName: booking.tripId.driverId?.fullName
            } : null
        }));
        
        res.status(200).json({
            success: true,
            count: formattedBookings.length,
            bookings: formattedBookings
        });
        
    } catch (error) {
        console.error('Error in getUserBookings:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الحجوزات',
            error: error.message
        });
    }
};

// @route   GET /api/bookings/:bookingId
exports.getBookingDetails = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'tripId',
                populate: [
                    { path: 'companyId', select: 'name logo phone email' },
                    { path: 'busId', select: 'busNumber plateNumber capacity busType' },
                    { path: 'driverId', select: 'fullName phone' }
                ]
            })
            .populate('userId', 'fullName email phone');
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'الحجز غير موجود'
            });
        }
        
        if (req.user.role !== 'Admin' && req.user._id.toString() !== booking.userId._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بمشاهدة هذا الحجز'
            });
        }
        
        res.status(200).json({
            success: true,
            booking: {
                _id: booking._id,
                bookingDate: booking.bookingDate,
                totalPrice: booking.totalPrice,
                paymentStatus: booking.paymentStatus,
                selectedSeats: booking.selectedSeats,
                user: {
                    _id: booking.userId._id,
                    fullName: booking.userId.fullName,
                    email: booking.userId.email,
                    phone: booking.userId.phone
                },
                tripDetails: booking.tripId ? {
                    _id: booking.tripId._id,
                    from: booking.tripId.from,
                    to: booking.tripId.to,
                    departureTime: booking.tripId.departureTime,
                    arrivalTime: booking.tripId.arrivalTime,
                    price: booking.tripId.price,
                    totalSeats: booking.tripId.totalSeats,
                    company: {
                        name: booking.tripId.companyId?.name,
                        logo: booking.tripId.companyId?.logo,
                        phone: booking.tripId.companyId?.phone,
                        email: booking.tripId.companyId?.email
                    },
                    bus: {
                        number: booking.tripId.busId?.busNumber,
                        plateNumber: booking.tripId.busId?.plateNumber,
                        capacity: booking.tripId.busId?.capacity,
                        type: booking.tripId.busId?.busType
                    },
                    driver: {
                        name: booking.tripId.driverId?.fullName,
                        phone: booking.tripId.driverId?.phone
                    }
                } : null
            }
        });
        
    } catch (error) {
        console.error('Error in getBookingDetails:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب تفاصيل الحجز',
            error: error.message
        });
    }
};

// @route   PATCH /api/bookings/:bookingId/cancel
exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'الحجز غير موجود'
            });
        }
        
        // التحقق من الصلاحية
        if (req.user.role !== 'Admin' && req.user.id !== booking.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بإلغاء هذا الحجز'
            });
        }
        
        // التحقق من أن الرحلة لم تنطلق بعد
        const trip = await Trip.findById(booking.tripId);
        if (trip && new Date(trip.departureTime) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن إلغاء حجز رحلة انطلقت بالفعل'
            });
        }
        
        // التحقق من أن الحجز لم يتم إلغاؤه مسبقاً
        if (booking.paymentStatus === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'هذا الحجز ملغي بالفعل'
            });
        }
        
        booking.paymentStatus = 'Cancelled';
        await booking.save();
        
        // إعادة المبلغ إلى محفظة المستخدم (إذا وجدت)
        // يمكن إضافة منطق استرداد المبلغ هنا
        
        res.status(200).json({
            success: true,
            message: 'تم إلغاء الحجز بنجاح',
            booking: {
                _id: booking._id,
                paymentStatus: booking.paymentStatus
            }
        });
        
    } catch (error) {
        console.error('Error in cancelBooking:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إلغاء الحجز',
            error: error.message
        });
    }
};

