const Trip = require('../Modle/Trip');
const Bus = require('../Modle/Bus');
const User = require('../Modle/User');
const Booking = require('../Modle/Booking');

// @desc    Fetch all trips with filtering and search
// @route   GET /api/trips
// @access  Private (CompanyManager)
const getTrips = async (req, res) => {
    try {
        const { status, search, from, to, date, companyId } = req.query;
        
        // Build search query
        let query = {};
        
        // If user is a company manager, add company filter
        if (req.user && req.user.companyId) {
            query.companyId = req.user.companyId;
        } else if (companyId) {
            query.companyId = companyId;
        }
        
        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Text search
        if (search) {
            query.$or = [
                { from: { $regex: search, $options: 'i' } },
                { to: { $regex: search, $options: 'i' } }
            ];
        }
        
        // City filters
        if (from) query.from = from;
        if (to) query.to = to;
        
        // Date filter
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.departureTime = { $gte: startDate, $lte: endDate };
        }
        
        // Fetch trips with populate
        const trips = await Trip.find(query)
            .populate('busId', 'busNumber capacity busType features')
            .populate('driverId', 'fullName phone email')
            .populate('companyId', 'name')
            .populate('bookings')  // To get bookings to calculate seats
            .sort({ departureTime: 1 });
        
        // Calculate statistics
        const stats = {
            total: trips.length,
            scheduled: trips.filter(t => t.status === 'Scheduled').length,
            ongoing: trips.filter(t => t.status === 'OnWay').length,
            completed: trips.filter(t => t.status === 'Completed').length,
            cancelled: trips.filter(t => t.status === 'Cancelled').length,
            totalPassengers: trips.reduce((sum, t) => sum + (t.bookedSeatsCount || 0), 0)
        };
        
        res.status(200).json({
            success: true,
            count: trips.length,
            stats,
            trips
        });
        
    } catch (error) {
        console.error('Error in getTrips:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching trips',
            error: error.message 
        });
    }
};

// @desc    Fetch a single trip by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
    try {console.log(req.params);
    
        const trip = await Trip.findById(req.params.id)
            .populate('busId', 'busNumber capacity busType')
            .populate('driverId', 'fullName phone email')
            .populate('bookings')
            .populate('companyId')
            .populate('createdBy', 'fullName email');
        
        if (!trip) {
            return res.status(404).json({ 
                success: false, 
                message: 'Trip not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            trip
        });
        
    } catch (error) {
        console.error('Error in getTripById:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching trip',
            error: error.message 
        });
    }
};

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private (CompanyManager)
const createTrip = async (req, res) => {
    try {
        const { from, to, departureTime, arrivalTime, price, busId, driverId, notes,companyId,postedBy } = req.body;
        
        // Check if bus exists
        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).json({ 
                success: false, 
                message: 'Bus not found' 
            });
        }
        
        // Check that no trip exists for the same bus at approximately the same time
        const existingTrip = await Trip.findOne({
            busId,
            departureTime: {
                $gte: new Date(new Date(departureTime).setHours(0, 0, 0)),
                $lt: new Date(new Date(departureTime).setHours(23, 59, 59))
            },
            status: { $in: ['Scheduled', 'OnWay'] }
        });
        
        if (existingTrip) {
            return res.status(400).json({
                success: false,
                message: 'This bus has another trip on the same day'
            });
        }
        
        // Create the trip
        const trip = new Trip({
            companyId:companyId,
            busId,
            driverId: driverId || null,
            from,
            to,
            departureTime,
            arrivalTime,
            price,
            totalSeats: bus.capacity,
            notes,
            createdBy: postedBy,
            status: 'Scheduled'
        });
        
        await trip.save();
        
        // Return data with populate
        await trip.populate('busId', 'busNumber capacity busType');
        await trip.populate('driverId', 'fullName phone');
        
        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            trip
        });
        
    } catch (error) {
        console.error('Error in createTrip:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Error creating trip',
            error: error.message 
        });
    }
};

// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Private (CompanyManager)
const updateTrip = async (req, res) => {
    try {
        const { from, to, status, driverId, notes, price, departureTime, arrivalTime, busId } = req.body;
        
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ 
                success: false,
                message: 'الرحلة غير موجودة' 
            });
        }
        
        // Check for existing bookings - prevent update if bookings exist
        const bookingsCount = await Booking.countDocuments({ tripId: req.params.id });
        
        if (bookingsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن تعديل هذه الرحلة لأنها تحتوي على حجوزات'
            });
        }
        
        if (from) trip.from = from;
        if (to) trip.to = to;
        if (status) trip.status = status;
        if (driverId) trip.driverId = driverId;
        if (busId) trip.busId = busId;
        if (notes) trip.notes = notes;
        if (price) trip.price = price;
        if (departureTime) trip.departureTime = departureTime;
        if (arrivalTime) trip.arrivalTime = arrivalTime;
        
        const updatedTrip = await trip.save();
        
        res.status(200).json({
            success: true,
            message: 'تم تحديث الرحلة بنجاح',
            trip: updatedTrip
        });
        
    } catch (error) {
        console.error('Error in updateTrip:', error);
        res.status(400).json({ 
            success: false, 
            message: 'خطأ في تحديث الرحلة',
            error: error.message 
        });
    }
};

// @route   DELETE /api/trips/:id
// @access  Private (CompanyManager)
const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ 
                success: false, 
                message: 'الرحلة غير موجودة' 
            });
        }
        
        const bookingsCount = await Booking.countDocuments({ tripId: req.params.id });
        
        if (bookingsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `لا يمكن حذف الرحلة لأن هناك ${bookingsCount} حجز/حجوزات مرتبطة بها`
            });
        }
        
        await trip.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'تم حذف الرحلة بنجاح'
        });
        
    } catch (error) {
        console.error('Error in deleteTrip:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حذف الرحلة',
            error: error.message 
        });
    }
};

// @route   GET /api/trips/available-resources
// @access  Private (CompanyManager)
// @route   GET /api/trips/available-resources
// @access  Private (CompanyManager)
const getAvailableResources = async (req, res) => {
    try {
        const { departureTime, from,companyId } = req.query;
       
        
        console.log('🔍 Fetching available resources:', { departureTime, from });
        
        const allActiveDrivers = await User.find({
            companyId:companyId,
            role: 'Driver',
            isActive: true
        }).select('fullName phone email');
        
        console.log(`📋 Total active drivers: ${allActiveDrivers.length}`);
        
        let occupiedDriverIds = [];
        
        if (departureTime) {
            const targetDate = new Date(departureTime);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const occupiedDrivers = await Trip.find({
                companyId:companyId,
                departureTime: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['Scheduled', 'OnWay'] }
            }).distinct('driverId');
            
            occupiedDriverIds = occupiedDrivers.filter(id => id !== null).map(id => id.toString());
            console.log(`🚫 Occupied driver IDs: ${occupiedDriverIds.length}`);
        }
        
        const availableDrivers = allActiveDrivers.filter(driver => {
            return !occupiedDriverIds.includes(driver._id.toString());
        });
        
        console.log(`✅ Available drivers: ${availableDrivers.length}`);
        
        const formattedDrivers = availableDrivers.map(driver => ({
            _id: driver._id,
            name: driver.fullName,
            fullName: driver.fullName,
            phone: driver.phone,
            email: driver.email,
            isNew: true 
        }));
        
        const allActiveBuses = await Bus.find({
            companyId:companyId,
            isActive: true
        }).select('busNumber plateNumber capacity busType features');
        
        console.log(`📋 Total active buses: ${allActiveBuses.length}`);
        
        let occupiedBusIds = [];
        
        if (departureTime) {
            const targetDate = new Date(departureTime);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const occupiedBuses = await Trip.find({
                companyId: companyId,
                departureTime: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['Scheduled', 'OnWay'] }
            }).distinct('busId');
            
            occupiedBusIds = occupiedBuses.filter(id => id !== null).map(id => id.toString());
            console.log(`🚫 Occupied bus IDs: ${occupiedBusIds.length}`);
        }
        
        const availableBuses = allActiveBuses.filter(bus => {
            return !occupiedBusIds.includes(bus._id.toString());
        });
        
        console.log(`✅ Available buses: ${availableBuses.length}`);
        
        const formattedBuses = availableBuses.map(bus => ({
            _id: bus._id,
            busNumber: bus.busNumber,
            plateNumber: bus.plateNumber,
            totalSeats: bus.capacity,
            capacity: bus.capacity,
            busType: bus.busType,
            features: bus.features,
            isNew: true 
        }));
        
        res.status(200).json({
            success: true,
            drivers: formattedDrivers,
            buses: formattedBuses,
            counts: {
                totalDrivers: allActiveDrivers.length,
                availableDrivers: formattedDrivers.length,
                totalBuses: allActiveBuses.length,
                availableBuses: formattedBuses.length
            }
        });
        
    } catch (error) {
        console.error('Error in getAvailableResources:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الموارد المتاحة',
            error: error.message 
        });
    }
};

// @route   GET /api/trips/stats
// @access  Private (CompanyManager)
const getTripStats = async (req, res) => {
    try {
        const query = req.user.companyId ? { companyId: req.user.companyId } : {};
        
        const stats = await Trip.aggregate([
            { $match: query },
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: { $multiply: ['$price', { $size: '$bookings' }] } }
            }}
        ]);
        
        const totalTrips = await Trip.countDocuments(query);
        const totalPassengers = await Booking.countDocuments();
        
        res.status(200).json({
            success: true,
            stats,
            totalTrips,
            totalPassengers
        });
        
    } catch (error) {
        console.error('Error in getTripStats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات',
            error: error.message 
        });
    }
};

module.exports = {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    getAvailableResources,
    getTripStats
};