// controllers/bookingController.js
const Booking = require('../Modle/Booking');
const Trip = require('../Modle/Trip');

exports.createBooking = async (req, res) => {
    try {
        const { tripId, selectedSeats, totalPrice } = req.body;
        
        
        const userId = req.user.id;

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
        const userId = req.user._id;
        
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
        
        // تنسيق البيانات للواجهة
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

// @desc    جلب حجوزات مستخدم معين (للاستخدام في صفحة /user/:id/mybookings)
// @route   GET /api/bookings/user/:userId
// @access  Private (Customer أو Admin)
exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // التحقق من الصلاحية: المستخدم يمكنه رؤية حجوزاته فقط، أو الأدمن يمكنه رؤية الكل
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

// @desc    جلب تفاصيل حجز واحد
// @route   GET /api/bookings/:bookingId
// @access  Private (Customer يمكنه رؤية حجزه فقط)
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
        
        // التحقق من الصلاحية
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

// @desc    إلغاء حجز
// @route   PATCH /api/bookings/:bookingId/cancel
// @access  Private (Customer يمكنه إلغاء حجزه فقط)
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

