const User = require("../Modle/User");
const Bus = require("../Modle/Bus");
const Trip = require("../Modle/Trip");
const Booking = require("../Modle/Booking");
const bcrypt = require("bcryptjs");


// @route   GET /api/users
// @access  Private (CompanyManager, Admin)
// @route   GET /api/users
// @access  Private (CompanyManager, Admin)
exports.getUsers = async (req, res) => {
    try {
        const {search,role, isActive } = req.query;
        console.log(role);
        
        
        let query = {};
        
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        if (role && role !== 'all') {
            if (Array.isArray(role)) {
                query.role = { $in: role };
                console.log('✅ Multiple roles filter:', role);
            } else {
                query.role = role;
                console.log('✅ Single role filter:', role);
            }
        }
        
        if (isActive !== undefined && isActive !== 'all') {
            query.isActive = isActive === 'true';
        }
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        console.log('📋 Final query:', JSON.stringify(query, null, 2));
        
        const users = await User.find(query)
            .select('-password') 
            .populate('companyId', 'name')
            .sort({ createdAt: -1 });
        
        console.log(`✅ Found ${users.length} users`);
        
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
        
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب المستخدمين',
            error: error.message 
        });
    }
};

// @route   GET /api/users/:id
// @access  Private (CompanyManager, Admin)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        let query = { _id: id };
        
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const user = await User.findOne(query).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        res.status(200).json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب المستخدم',
            error: error.message 
        });
    }
};

// @route   POST /api/users/register
// @access  Private (CompanyManager, Admin)
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, phone, password, role, companyId } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني موجود بالفعل'
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        let userCompanyId = companyId;
        if (req.user.role === 'CompanyManager') {
            userCompanyId = req.user.companyId;
        }
        
        const user = new User({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: role || 'Employee',
            companyId: userCompanyId || null,
            isActive: true,
            createdAt: new Date()
        });
        
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'تم إنشاء المستخدم بنجاح',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error in createUser:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || 'فشل في إنشاء المستخدم'
        });
    }
};

// @route   PUT /api/users/:id
// @access  Private (CompanyManager, Admin)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, role, isActive, password } = req.body;
        
        let query = { _id: id };
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const user = await User.findOne(query);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        if (id === req.user._id && role && role !== user.role) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تغيير دور المستخدم الحالي'
            });
        }
        
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني موجود بالفعل'
                });
            }
            user.email = email;
        }
        
        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (role && id !== req.user._id) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || 'فشل في تحديث المستخدم'
        });
    }
};

// @route   DELETE /api/users/:id
// @access  Private (CompanyManager, Admin)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id === req.user._id) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف حسابك الحالي'
            });
        }
        
        let query = { _id: id };
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const user = await User.findOne(query);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        if (user.role === 'Driver') {
            const relatedTrips = await Trip.find({
                driverId: id,
                status: { $in: ['Scheduled', 'OnWay'] }
            });
            
            if (relatedTrips.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `لا يمكن حذف السائق لأن هناك ${relatedTrips.length} رحلة مرتبطة به`
                });
            }
        }
        
        await user.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
        });
        
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حذف المستخدم',
            error: error.message 
        });
    }
};

// @route   PATCH /api/users/:id/toggle-status
// @access  Private (CompanyManager, Admin)
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        if (id === req.user._id && isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تعطيل حسابك الحالي'
            });
        }
        
        let query = { _id: id };
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const user = await User.findOne(query);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        
        if (user.role === 'Driver' && isActive === false) {
            const futureTrips = await Trip.find({
                driverId: id,
                status: { $in: ['Scheduled', 'OnWay'] }
            });
            
            if (futureTrips.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `لا يمكن تعطيل السائق لأن هناك ${futureTrips.length} رحلة مستقبلية مرتبطة به`
                });
            }
        }
        
        user.isActive = isActive;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`,
            user: {
                _id: user._id,
                fullName: user.fullName,
                isActive: user.isActive
            }
        });
        
    } catch (error) {
        console.error('Error in toggleUserStatus:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تغيير حالة المستخدم',
            error: error.message 
        });
    }
};

// @route   GET /api/users/stats
// @access  Private (CompanyManager, Admin)
exports.getUserStats = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const totalUsers = await User.countDocuments(query);
        const activeUsers = await User.countDocuments({ ...query, isActive: true });
        const inactiveUsers = totalUsers - activeUsers;
        
        const employees = await User.countDocuments({ ...query, role: { $in: ['Employee', 'CompanyManager'] } });
        const drivers = await User.countDocuments({ ...query, role: 'Driver' });
        const customers = await User.countDocuments({ ...query, role: 'Customer' });
        
        res.status(200).json({
            success: true,
            stats: {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
                employees: employees,
                drivers: drivers,
                customers: customers
            }
        });
        
    } catch (error) {
        console.error('Error in getUserStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب إحصائيات المستخدمين',
            error: error.message 
        });
    }
};

// @route   GET /api/users/available-drivers
// @access  Private (CompanyManager)
exports.getAvailableDrivers = async (req, res) => {
    try {
        const { departureTime } = req.query;
        
        let query = {
            role: 'Driver',
            isActive: true
        };
        
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        let occupiedDriverIds = [];
        
        if (departureTime) {
            const targetDate = new Date(departureTime);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const occupiedDrivers = await Trip.find({
                departureTime: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['Scheduled', 'OnWay'] }
            }).distinct('driverId');
            
            occupiedDriverIds = occupiedDrivers.filter(id => id !== null).map(id => id.toString());
        }
        
        if (departureTime && occupiedDriverIds.length > 0) {
            query._id = { $nin: occupiedDriverIds };
        }
        
        const drivers = await User.find(query)
            .select('fullName phone email')
            .sort({ fullName: 1 });
        
        const formattedDrivers = drivers.map(driver => ({
            _id: driver._id,
            name: driver.fullName,
            fullName: driver.fullName,
            phone: driver.phone,
            email: driver.email
        }));
        
        res.status(200).json({
            success: true,
            count: formattedDrivers.length,
            drivers: formattedDrivers
        });
        
    } catch (error) {
        console.error('Error in getAvailableDrivers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب السائقين المتاحين',
            error: error.message 
        });
    }
};


exports.getBuses = async (req, res) => {
    try {
        const { search, isActive } = req.query;
        console.log(req.user);
        
        let query = { companyId: req.user.companyId };
        
        if (isActive !== undefined && isActive !== 'all') {
            query.isActive = isActive === 'true';
        }
        
        if (search) {
            query.$or = [
                { busNumber: { $regex: search, $options: 'i' } },
                { plateNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const buses = await Bus.find(query)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: buses.length,
            buses
        });
        
    } catch (error) {
        console.error('Error in getBuses:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الباصات',
            error: error.message 
        });
    }
};

// @route   GET /api/buses/:id
// @access  Private (CompanyManager)
exports.getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bus = await Bus.findOne({
            _id: id,
            companyId: req.user.companyId
        }).populate('createdBy', 'fullName email');
        
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'الباص غير موجود'
            });
        }
        
        res.status(200).json({
            success: true,
            bus
        });
        
    } catch (error) {
        console.error('Error in getBusById:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الباص',
            error: error.message 
        });
    }
};

// @route   POST /api/buses
// @access  Private (CompanyManager)
exports.createBus = async (req, res) => {
    try {
        const { busNumber, plateNumber, capacity, busType, features, isActive } = req.body;
        
        const existingBus = await Bus.findOne({
            companyId: req.user.companyId,
            $or: [
                { busNumber: busNumber },
                { plateNumber: plateNumber }
            ]
        });
        
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'يوجد باص بنفس الرقم أو لوحة السيارة بالفعل'
            });
        }
        
        const bus = new Bus({
            busNumber,
            plateNumber,
            companyId: req.user.companyId,
            capacity: Number(capacity),
            busType: busType || 'Normal',
            features: features || [],
            createdBy: req.user._id,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await bus.save();
        
        res.status(201).json({
            success: true,
            message: 'تم إضافة الباص بنجاح',
            bus
        });
        
    } catch (error) {
        console.error('Error in createBus:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || 'فشل في إنشاء الباص'
        });
    }
};

// @route   PUT /api/buses/:id
// @access  Private (CompanyManager)
exports.updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const { busNumber, plateNumber, capacity, busType, features, isActive } = req.body;
        
        const bus = await Bus.findOne({
            _id: id,
            companyId: req.user.companyId
        });
        
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'الباص غير موجود'
            });
        }
        
        const existingBus = await Bus.findOne({
            companyId: req.user.companyId,
            _id: { $ne: id },
            $or: [
                { busNumber: busNumber },
                { plateNumber: plateNumber }
            ]
        });
        
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'يوجد باص آخر بنفس الرقم أو لوحة السيارة'
            });
        }
        
        bus.busNumber = busNumber || bus.busNumber;
        bus.plateNumber = plateNumber || bus.plateNumber;
        bus.capacity = capacity !== undefined ? Number(capacity) : bus.capacity;
        bus.busType = busType || bus.busType;
        bus.features = features !== undefined ? features : bus.features;
        bus.isActive = isActive !== undefined ? isActive : bus.isActive;
        
        await bus.save();
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث الباص بنجاح',
            bus
        });
        
    } catch (error) {
        console.error('Error in updateBus:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || 'فشل في تحديث الباص'
        });
    }
};

// @route   DELETE /api/buses/:id
// @access  Private (CompanyManager)
exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const bus = await Bus.findOne({
            _id: id,
            companyId: req.user.companyId
        });
        
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'الباص غير موجود'
            });
        }
        
        const relatedTrips = await Trip.find({
            busId: id,
            status: { $in: ['Scheduled', 'OnWay'] }
        });
        
        if (relatedTrips.length > 0) {
            return res.status(400).json({
                success: false,
                message: `لا يمكن حذف الباص لأن هناك ${relatedTrips.length} رحلة مرتبطة به`
            });
        }
        
        await bus.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'تم حذف الباص بنجاح'
        });
        
    } catch (error) {
        console.error('Error in deleteBus:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حذف الباص',
            error: error.message 
        });
    }
};

// @route   PATCH /api/buses/:id/toggle-status
// @access  Private (CompanyManager)
exports.toggleBusStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const bus = await Bus.findOne({
            _id: id,
            companyId: req.user.companyId
        });
        
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'الباص غير موجود'
            });
        }
        
        if (isActive === false) {
            const futureTrips = await Trip.find({
                busId: id,
                status: { $in: ['Scheduled', 'OnWay'] }
            });
            
            if (futureTrips.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `لا يمكن تعطيل الباص لأن هناك ${futureTrips.length} رحلة مستقبلية مرتبطة به`
                });
            }
        }
        
        bus.isActive = isActive;
        await bus.save();
        
        res.status(200).json({
            success: true,
            message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الباص بنجاح`,
            bus
        });
        
    } catch (error) {
        console.error('Error in toggleBusStatus:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تغيير حالة الباص',
            error: error.message 
        });
    }
};

// @route   GET /api/buses/stats
// @access  Private (CompanyManager)
exports.getBusStats = async (req, res) => {
    try {
        const totalBuses = await Bus.countDocuments({ companyId: req.user.companyId });
        const activeBuses = await Bus.countDocuments({ companyId: req.user.companyId, isActive: true });
        const inactiveBuses = totalBuses - activeBuses;
        
        const vipBuses = await Bus.countDocuments({ companyId: req.user.companyId, busType: 'VIP' });
        const normalBuses = await Bus.countDocuments({ companyId: req.user.companyId, busType: 'Normal' });
        const luxuryBuses = await Bus.countDocuments({ companyId: req.user.companyId, busType: 'Luxury' });
        
        const totalCapacity = await Bus.aggregate([
            { $match: { companyId: req.user.companyId } },
            { $group: { _id: null, total: { $sum: '$capacity' } } }
        ]);
        
        res.status(200).json({
            success: true,
            stats: {
                total: totalBuses,
                active: activeBuses,
                inactive: inactiveBuses,
                byType: {
                    VIP: vipBuses,
                    Normal: normalBuses,
                    Luxury: luxuryBuses
                },
                totalCapacity: totalCapacity[0]?.total || 0
            }
        });
        
    } catch (error) {
        console.error('Error in getBusStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب إحصائيات الباصات',
            error: error.message 
        });
    }
};

// @route   GET /api/buses/available
// @access  Private (CompanyManager)
exports.getAvailableBuses = async (req, res) => {
    try {
        const { departureTime, from } = req.query;
        
        let query = {
            companyId: req.user.companyId,
            isActive: true
        };
        
        let occupiedBusIds = [];
        
        if (departureTime) {
            const targetDate = new Date(departureTime);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const occupiedBuses = await Trip.find({
                companyId: req.user.companyId,
                departureTime: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['Scheduled', 'OnWay'] }
            }).distinct('busId');
            
            occupiedBusIds = occupiedBuses.filter(id => id !== null).map(id => id.toString());
        }
        
        if (departureTime && occupiedBusIds.length > 0) {
            query._id = { $nin: occupiedBusIds };
        }
        
        const buses = await Bus.find(query)
            .select('busNumber plateNumber capacity busType features')
            .sort({ busNumber: 1 });
        
        res.status(200).json({
            success: true,
            count: buses.length,
            buses
        });
        
    } catch (error) {
        console.error('Error in getAvailableBuses:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الباصات المتاحة',
            error: error.message 
        });
    }
};



exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const trip = await Trip.findByIdAndUpdate(id, { status }, { new: true });
        res.json(trip);
    } catch (error) {
        res.status(400).json({ message: "فشل في تحديث الحالة" });
    }
};




// @route   GET /api/reports/trip-stats
// @access  Private (CompanyManager, Admin)
exports.getTripStats = async (req, res) => {
    try {
        // بناء الاستعلام حسب صلاحية المستخدم
        let query = {};
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const trips = await Trip.find(query);
        
        const completedTrips = trips.filter(t => t.status === 'Completed').length;
        const scheduledTrips = trips.filter(t => t.status === 'Scheduled').length;
        const ongoingTrips = trips.filter(t => t.status === 'OnWay').length;
        const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;
        
        const bookingsQuery = {};
        if (req.user.role === 'CompanyManager') {
            const companyTrips = await Trip.find({ companyId: req.user.companyId }).select('_id');
            const tripIds = companyTrips.map(t => t._id);
            bookingsQuery.tripId = { $in: tripIds };
        }
        
        const bookings = await Booking.find(bookingsQuery);
        
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        
        const averageTicketPrice = bookings.length > 0 ? totalRevenue / bookings.length : 0;
        
        res.status(200).json({
            success: true,
            stats: {
                completed: completedTrips,
                scheduled: scheduledTrips,
                ongoing: ongoingTrips,
                cancelled: cancelledTrips,
                totalTrips: trips.length,
                totalBookings: bookings.length,
                totalRevenue: totalRevenue,
                averageTicketPrice: Math.round(averageTicketPrice)
            }
        });
        
    } catch (error) {
        console.error('Error in getTripStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب إحصائيات الرحلات',
            error: error.message 
        });
    }
};

// @route   GET /api/reports/monthly
// @access  Private (CompanyManager, Admin)
exports.getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const selectedMonth = parseInt(month);
        const selectedYear = parseInt(year);
        
        // تحديد بداية ونهاية الشهر
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        
        // بناء الاستعلام
        let tripQuery = {
            status: 'Completed',
            departureTime: { $gte: startDate, $lte: endDate }
        };
        
        if (req.user.role === 'CompanyManager') {
            tripQuery.companyId = req.user.companyId;
        }
        
        // جلب الرحلات المكتملة في الشهر
        const completedTrips = await Trip.find(tripQuery);
        
        // جلب الحجوزات لهذه الرحلات
        const tripIds = completedTrips.map(t => t._id);
        let bookingQuery = { tripId: { $in: tripIds } };
        
        const bookings = await Booking.find(bookingQuery);
        
        // حساب الإيرادات الشهرية
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        
        // إحصائيات الرحلات اليومية
        const dailyStats = [];
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayStart = new Date(selectedYear, selectedMonth - 1, day);
            const dayEnd = new Date(selectedYear, selectedMonth - 1, day, 23, 59, 59);
            
            const dayTrips = completedTrips.filter(t => {
                const tDate = new Date(t.departureTime);
                return tDate >= dayStart && tDate <= dayEnd;
            });
            
            const dayTripIds = dayTrips.map(t => t._id);
            const dayBookings = bookings.filter(b => dayTripIds.includes(b.tripId.toString()));
            const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            
            dailyStats.push({
                date: `${day}/${selectedMonth}/${selectedYear}`,
                trips: dayTrips.length,
                bookings: dayBookings.length,
                revenue: dayRevenue
            });
        }
        
        res.status(200).json({
            success: true,
            report: {
                month: selectedMonth,
                year: selectedYear,
                totalTrips: completedTrips.length,
                totalBookings: bookings.length,
                totalRevenue: totalRevenue,
                dailyStats: dailyStats
            }
        });
        
    } catch (error) {
        console.error('Error in getMonthlyReport:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب التقرير الشهري',
            error: error.message 
        });
    }
};

// @route   GET /api/reports/detailed
// @access  Private (CompanyManager, Admin)
exports.getDetailedReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const selectedMonth = parseInt(month);
        const selectedYear = parseInt(year);
        
        // تحديد بداية ونهاية الشهر
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        
        // بناء الاستعلام
        let tripQuery = {
            status: 'Completed',
            departureTime: { $gte: startDate, $lte: endDate }
        };
        
        if (req.user.role === 'CompanyManager') {
            tripQuery.companyId = req.user.companyId;
        }
        
        // جلب الرحلات المكتملة في الشهر
        const completedTrips = await Trip.find(tripQuery)
            .populate('busId', 'busNumber capacity')
            .populate('driverId', 'fullName');
        
        // جلب الحجوزات
        const tripIds = completedTrips.map(t => t._id);
        let bookingQuery = { tripId: { $in: tripIds } };
        const bookings = await Booking.find(bookingQuery);
        
        // 1. إحصائيات يومية مفصلة
        const dailyStats = [];
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayStart = new Date(selectedYear, selectedMonth - 1, day);
            const dayEnd = new Date(selectedYear, selectedMonth - 1, day, 23, 59, 59);
            
            const dayTrips = completedTrips.filter(t => {
                const tDate = new Date(t.departureTime);
                return tDate >= dayStart && tDate <= dayEnd;
            });
            
            const dayTripIds = dayTrips.map(t => t._id);
            const dayBookings = bookings.filter(b => dayTripIds.includes(b.tripId.toString()));
            const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            
            dailyStats.push({
                date: `${day}/${selectedMonth}/${selectedYear}`,
                trips: dayTrips.length,
                bookings: dayBookings.length,
                revenue: dayRevenue
            });
        }
        
        // 2. أفضل المسارات من حيث الإيرادات
        const routesMap = new Map();
        
        for (const trip of completedTrips) {
            const routeKey = `${trip.from}_to_${trip.to}`;
            const tripBookings = bookings.filter(b => b.tripId.toString() === trip._id.toString());
            const routeRevenue = tripBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            
            if (!routesMap.has(routeKey)) {
                routesMap.set(routeKey, {
                    from: trip.from,
                    to: trip.to,
                    trips: 0,
                    bookings: 0,
                    revenue: 0,
                    totalSeats: 0
                });
            }
            
            const route = routesMap.get(routeKey);
            route.trips++;
            route.bookings += tripBookings.length;
            route.revenue += routeRevenue;
            route.totalSeats += trip.totalSeats || 0;
        }
        
        // حساب نسبة الإشغال لكل مسار
        const topRoutes = Array.from(routesMap.values()).map(route => ({
            ...route,
            rating: route.totalSeats > 0 ? Math.round((route.bookings / route.totalSeats) * 100) : 0
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5); // أفضل 5 مسارات
        
        // 3. نسبة استغلال الباصات
        const busesMap = new Map();
        
        for (const trip of completedTrips) {
            if (!trip.busId) continue;
            
            const busId = trip.busId._id.toString();
            const tripBookings = bookings.filter(b => b.tripId.toString() === trip._id.toString());
            
            if (!busesMap.has(busId)) {
                busesMap.set(busId, {
                    busNumber: trip.busId.busNumber,
                    trips: 0,
                    seatsBooked: 0,
                    totalSeats: 0
                });
            }
            
            const bus = busesMap.get(busId);
            bus.trips++;
            bus.seatsBooked += tripBookings.length;
            bus.totalSeats += trip.totalSeats || trip.busId?.capacity || 0;
        }
        
        const busUtilization = Array.from(busesMap.values()).map(bus => ({
            busNumber: bus.busNumber,
            trips: bus.trips,
            seatsBooked: bus.seatsBooked,
            totalSeats: bus.totalSeats,
            utilization: bus.totalSeats > 0 ? Math.round((bus.seatsBooked / bus.totalSeats) * 100) : 0
        })).sort((a, b) => b.utilization - a.utilization);
        
        res.status(200).json({
            success: true,
            dailyStats,
            topRoutes,
            busUtilization,
            summary: {
                totalTrips: completedTrips.length,
                totalBookings: bookings.length,
                totalRevenue: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
                averageOccupancy: busUtilization.reduce((sum, b) => sum + b.utilization, 0) / (busUtilization.length || 1)
            }
        });
        
    } catch (error) {
        console.error('Error in getDetailedReport:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب التقرير التفصيلي',
            error: error.message 
        });
    }
};

// @route   GET /api/reports/export/:format
// @access  Private (CompanyManager, Admin)
exports.exportReport = async (req, res) => {
    try {
        const { format } = req.params;
        const { month, year } = req.query;
        const selectedMonth = parseInt(month);
        const selectedYear = parseInt(year);
        
        // جلب البيانات للتقرير
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        
        let tripQuery = {
            status: 'Completed',
            departureTime: { $gte: startDate, $lte: endDate }
        };
        
        if (req.user.role === 'CompanyManager') {
            tripQuery.companyId = req.user.companyId;
        }
        
        const completedTrips = await Trip.find(tripQuery)
            .populate('busId', 'busNumber')
            .populate('driverId', 'fullName');
        
        const tripIds = completedTrips.map(t => t._id);
        const bookings = await Booking.find({ tripId: { $in: tripIds } });
        
        // حساب الإحصائيات
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        
        // تحضير البيانات للتصدير
        const reportData = {
            companyName: req.user.companyId?.name || 'شركة النقل',
            month: selectedMonth,
            year: selectedYear,
            generatedAt: new Date().toISOString(),
            summary: {
                totalTrips: completedTrips.length,
                totalBookings: bookings.length,
                totalRevenue: totalRevenue,
                averageRevenuePerTrip: completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0
            },
            trips: completedTrips.map(trip => ({
                from: trip.from,
                to: trip.to,
                date: trip.departureTime,
                driver: trip.driverId?.fullName || 'غير محدد',
                busNumber: trip.busId?.busNumber || 'غير محدد',
                price: trip.price
            })),
            bookings: bookings.map(booking => ({
                tripFrom: booking.tripId?.from,
                tripTo: booking.tripId?.to,
                seats: booking.seatNumbers?.length || 0,
                totalPrice: booking.totalPrice,
                bookedAt: booking.bookedAt
            }))
        };
        
        // هنا يمكن إضافة منطق تصدير PDF أو Excel
        // حالياً نعيد البيانات كـ JSON
        if (format === 'pdf') {
            // يمكن استخدام مكتبة مثل pdfkit
            res.status(200).json({
                success: true,
                message: 'PDF export coming soon',
                data: reportData
            });
        } else if (format === 'excel') {
            // يمكن استخدام مكتبة مثل exceljs
            res.status(200).json({
                success: true,
                message: 'Excel export coming soon',
                data: reportData
            });
        } else {
            res.status(200).json({
                success: true,
                data: reportData
            });
        }
        
    } catch (error) {
        console.error('Error in exportReport:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تصدير التقرير',
            error: error.message 
        });
    }
};

// @route   GET /api/reports/bus-stats
// @access  Private (CompanyManager, Admin)
exports.getBusStats = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'CompanyManager') {
            query.companyId = req.user.companyId;
        }
        
        const buses = await Bus.find(query);
        
        const totalBuses = buses.length;
        const activeBuses = buses.filter(b => b.isActive).length;
        const inactiveBuses = totalBuses - activeBuses;
        
        const vipBuses = buses.filter(b => b.busType === 'VIP').length;
        const normalBuses = buses.filter(b => b.busType === 'Normal').length;
        const luxuryBuses = buses.filter(b => b.busType === 'Luxury').length;
        
        const totalCapacity = buses.reduce((sum, bus) => sum + (bus.capacity || 0), 0);
        
        res.status(200).json({
            success: true,
            stats: {
                total: totalBuses,
                active: activeBuses,
                inactive: inactiveBuses,
                byType: {
                    VIP: vipBuses,
                    Normal: normalBuses,
                    Luxury: luxuryBuses
                },
                totalCapacity: totalCapacity,
                averageCapacity: totalBuses > 0 ? Math.round(totalCapacity / totalBuses) : 0
            }
        });
        
    } catch (error) {
        console.error('Error in getBusStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب إحصائيات الباصات',
            error: error.message 
        });
    }
};




