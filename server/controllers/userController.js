const User = require('../Modle/User');
const Trip = require('../Modle/Trip');
const Booking = require('../Modle/Booking');
const Company = require('../Modle/Company');
const Bus = require('../Modle/Bus');

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

        // Display only trips that haven't started yet
        query.departureTime = { $gte: new Date() };

        // Filter departure location (flexible partial search)
        if (from) query.from = { $regex: from, $options: 'i' };
        
        // Filter destination
        if (to) query.to = { $regex: to, $options: 'i' };

        // Filter date (specific day from beginning to end)
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startOfDay, $lte: endOfDay };
        }

        // Filter price (minimum and maximum price)
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Fetch trips with associated company data
        let trips = await Trip.find(query).populate({
            path: 'companyId',
            match: companyName ? { name: { $regex: companyName, $options: 'i' } } : {},
            select: 'name logo'
        }).populate('busId', 'busType features');

        // Filter results if company name filtering is enabled
        trips = trips.filter(trip => trip.companyId !== null);

        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: "حدث خطأ أثناء جلب الرحلات" });
    }
};


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


exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "خطأ في جلب بيانات الملف الشخصي" });
    }
};

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
        
        let query = {
            status: 'Scheduled',
            departureTime: { $gte: new Date() }
        };
        
        if (from && from.trim() !== '') {
            query.from = { $regex: from, $options: 'i' };
        }
        
        if (to && to.trim() !== '') {
            query.to = { $regex: to, $options: 'i' };
        }
        
        if (date) {
            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startOfDay, $lte: endOfDay };
            
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
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
        
        let trips = await Trip.find(query)
            .populate('companyId', 'name logo phone email')
            .populate('busId', 'busNumber plateNumber capacity')
            .populate('driverId', 'fullName phone')
            .sort({ departureTime: 1 });
        
       if (companyFilter && companyFilter !== '') {
            trips = trips.filter(trip => {
                if (!trip.companyId) return false;
                const companyIdStr = trip.companyId._id ? String(trip.companyId._id) : String(trip.companyId);
                return (companyIdStr === companyFilter) || (trip.companyId?.name === companyFilter);
            });
        }
        
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
                companyId: trip.companyId?._id,
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


