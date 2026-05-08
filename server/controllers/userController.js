const User = require('../Modle/User');
const Trip = require('../Modle/Trip');
const Booking = require('../Modle/Booking');
const Company = require('../Modle/Company');
const Bus = require('../Modle/Bus');
/**
 * 1. البحث الذكي والمرن (Smart & Flexible Search)
 * يتيح البحث بمدينة الانطلاق، الوجهة، التاريخ، اسم الشركة، ونطاق السعر.
 */
exports.searchTrips = async (req, res) => {
    try {
        const { 
            from, 
            to, 
            date, 
            companyName, 
            minPrice, 
            maxPrice 
        } = req.query;

        let query = {};

        // عرض الرحلات التي لم تبدأ بعد فقط
        query.departureTime = { $gte: new Date() };

        // فلترة مكان الانطلاق (بحث جزئي مرن)
        if (from) query.from = { $regex: from, $options: 'i' };
        
        // فلترة مكان الوصول
        if (to) query.to = { $regex: to, $options: 'i' };

        // فلترة التاريخ (يوم محدد من بداية اليوم لنهايته)
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startOfDay, $lte: endOfDay };
        }

        // فلترة السعر (أدنى وأعلى سعر)
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // جلب الرحلات مع بيانات الشركة المرتبطة بها
        let trips = await Trip.find(query).populate({
            path: 'companyId',
            match: companyName ? { name: { $regex: companyName, $options: 'i' } } : {},
            select: 'name logo'
        }).populate('busId', 'busType features');

        // تصفية النتائج إذا كانت فلترة اسم الشركة مفعلة
        trips = trips.filter(trip => trip.companyId !== null);

        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: "حدث خطأ أثناء جلب الرحلات" });
    }
};

/**
 * 2. محاكاة الدفع وحجز المقاعد
 * يقوم بتحديث حالة الكراسي في الرحلة وإنشاء سجل حجز جديد.
 */
exports.bookTrip = async (req, res) => {
    try {
        const { tripId, selectedSeats, totalPrice, creditCardInfo, companyId } = req.body;

        // --- محاكاة بوابة الدفع (Credit Card Simulation) ---
        if (!creditCardInfo || creditCardInfo.cardNumber.length < 16) {
            return res.status(400).json({ msg: "فشل الدفع: بيانات البطاقة غير صالحة" });
        }
        // هنا نفترض نجاح العملية لأن التطبيق Local

        // إنشاء سجل الحجز
        const newBooking = new Booking({
            userId: req.user.id,
            tripId,
            companyId,
            selectedSeats,
            totalPrice,
            paymentStatus: 'Paid',
            bookingDate: Date.now()
        });

        // تحديث حالة المقاعد في الموديل الخاص بالرحلة
        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ msg: "الرحلة غير موجودة" });

        selectedSeats.forEach(s => {
            const seatIndex = trip.seats.findIndex(st => st.seatNumber === s.seatNumber);
            if (seatIndex !== -1) {
                // التحقق من أن المقعد لم يُحجز في هذه الأثناء
                if (trip.seats[seatIndex].isBooked) {
                    throw new Error(`المقعد رقم ${s.seatNumber} تم حجزه بالفعل`);
                }
                trip.seats[seatIndex].isBooked = true;
                trip.seats[seatIndex].bookedBy = req.user.id;
                trip.seats[seatIndex].passengerInfo = {
                    name: s.passengerName,
                    gender: s.passengerGender
                };
            }
        });

        await trip.save();
        await newBooking.save();

        res.status(201).json({ 
            msg: "تم الحجز بنجاح", 
            bookingId: newBooking._id,
            qrData: `BOOKING_ID:${newBooking._id}|USER:${req.user.id}` // البيانات الموجهة للـ QR
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 3. عرض رحلاتي (My Bookings)
 * يعرض الحجوزات السابقة والقادمة للزبون.
 */
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate({
                path: 'tripId',
                select: 'from to departureTime price',
                populate: { path: 'companyId', select: 'name logo' }
            })
            .sort({ bookingDate: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب سجل الحجوزات" });
    }
};

/**
 * 4. إدارة الملف الشخصي (Profile Management)
 */
// جلب البيانات
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب بيانات الملف الشخصي" });
    }
};

// تعديل البيانات الشخصية
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, phone } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { fullName, phone } },
            { new: true }
        ).select('-password');

        res.json({ msg: "تم تحديث البيانات بنجاح", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "خطأ في تحديث البيانات" });
    }
};

// controllers/userController.js



// @desc    جلب الرحلات المتاحة للزبائن (لوحة تحكم المستخدم)
// @route   GET /api/user/dashboard
// @access  Private (Customer فقط)
exports.getUserDashboard = async (req, res) => {
    try {
        const { 
            from, 
            to, 
            date, 
            tripType, 
            minPrice, 
            maxPrice,
            timeFilter,
            companyFilter 
        } = req.query;
        
        // بناء استعلام البحث
        let query = {
            status: 'Scheduled',
            departureTime: { $gte: new Date() }
        };
        
        // فلتر حسب مدينة الانطلاق
        if (from && from.trim() !== '') {
            query.from = { $regex: from, $options: 'i' };
        }
        
        // فلتر حسب الوجهة
        if (to && to.trim() !== '') {
            query.to = { $regex: to, $options: 'i' };
        }
        
        // فلتر حسب التاريخ
        if (date) {
            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startOfDay, $lte: endOfDay };
            
        }
        
        // فلتر حسب السعر
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
        // فلتر حسب وقت الرحلة (اختياري)
        if (timeFilter) {
            switch (timeFilter) {
                case 'morning':
                    query.$expr = { 
                        $and: [
                            { $gte: [{ $hour: '$departureTime' }, 10] },
                            { $lt: [{ $hour: '$departureTime' }, 16] }
                        ]
                    };
                    break;
                case 'early':
                    query.$expr = { 
                        $and: [
                            { $gte: [{ $hour: '$departureTime' }, 5] },
                            { $lt: [{ $hour: '$departureTime' }, 9] }
                        ]
                    };
                    break;
                case 'evening':
                    query.$expr = { 
                        $and: [
                            { $gte: [{ $hour: '$departureTime' }, 23] },
                            { $lt: [{ $hour: '$departureTime' }, 4] }
                        ]
                    };
                    break;
                case 'night':
                    query.$expr = { 
                        $and: [
                            { $gte: [{ $hour: '$departureTime' }, 17] },
                            { $lt: [{ $hour: '$departureTime' }, 22] }
                        ]
                    };
                    break;
            }
        }
        
        // جلب الرحلات
        let trips = await Trip.find(query)
            .populate('companyId', 'name logo phone email')
            .populate('busId', 'busNumber plateNumber capacity')
            .populate('driverId', 'fullName phone')
            .sort({ departureTime: 1 });
        
        // فلتر حسب الشركة (إذا وجد)
        if (companyFilter && companyFilter !== '') {
            trips = trips.filter(trip => 
                trip.companyId?.name === companyFilter
            );
        }
        
        // تنسيق البيانات
        const formattedTrips = trips.map(trip => ({
            _id: trip._id,
            origin: trip.from,
            destination: trip.to,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            price: trip.price,
            totalSeats: trip.totalSeats,
            availableSeats: trip.availableSeats,
            company: {
                companyName: trip.companyId?.name,
                logo: trip.companyId?.logo,
                phone: trip.companyId?.phone
            },
            bus: {
                busNumber: trip.busId?.busNumber,
                busType: trip.busId?.busType
            },
            driver: {
                name: trip.driverId?.fullName
            }
        }));
        
        res.status(200).json({
            success: true,
            count: formattedTrips.length,
            trips: formattedTrips
        });
        
    } catch (error) {
        console.error('Error in getUserDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب الرحلات',
            error: error.message
        });
    }
};


