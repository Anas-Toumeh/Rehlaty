const Company = require('../Modle/Company');
const User = require('../Modle/User');
const Trip = require('../Modle/Trip');
const Booking = require('../Modle/Booking');
const bcrypt = require('bcryptjs');
const path = require('path');


exports.createCompany = async (req, res) => {
    try {
        const { name, phone, address, logo } = req.body;
        const logoPath = req.file ? `/uploads/${req.file.filename}` : '';
        const newCompany = new Company({ name, phone, address, logo: logoPath });
        await newCompany.save();
        res.status(201).json({ msg: "تم إنشاء الشركة بنجاح", company: newCompany });
    } catch (err) {
        res.status(500).send("خطأ في إنشاء الشركة");
    }
};

exports.toggleCompanyStatus = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ msg: "الشركة غير موجودة" });
        company.isActive = !company.isActive;
        await company.save();
        res.json({ msg: `حالة الشركة الآن: ${company.isActive ? 'نشطة' : 'معطلة'}` });
    } catch (err) {
        res.status(500).send("خطأ في تغيير حالة الشركة");
    }
};

exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, email, password } = req.body;

        let company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ msg: "الشركة غير موجودة" });
        }

        const updatedData = {
            name,
            phone,
            address,
            email
        };

        if (req.file) {
            updatedData.logo = `/uploads/${req.file.filename}`;
             
        }

        company = await Company.findByIdAndUpdate(
            id,
            { $set: updatedData },
        );

        res.json(company);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("خطأ في السيرفر أثناء التعديل");
    }
};


exports.assignManager = async (req, res) => {
    try {
        const { fullName, email, password, phone, companyId } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newManager = new User({
            fullName, email, phone,
            password: hashedPassword,
            role: 'CompanyManager',
            companyId
        });
        console.log(newManager);
        company = await Company.findByIdAndUpdate(companyId,{$set: { managerId: newManager._id } });
        await newManager.save();
        res.status(201).json({ msg: "تم تعيين المدير بنجاح" });
    } catch (err) {
        res.status(500).send("خطأ في تعيين المدير");
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ msg: "تم إعادة تعيين كلمة المرور بنجاح" });
    } catch (err) {
        res.status(500).send("خطأ في تغيير كلمة المرور");
    }
};

exports.getAllTripsMonitoring = async (req, res) => {
    try {
        const trips = await Trip.find().populate('companyId', 'name'); 
        res.json(trips);
    } catch (err) {
        res.status(500).send("خطأ في جلب الرحلات للرقابة");
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 })
            .populate('managerId', 'fullName email');
        res.json(companies);
    } catch (err) {
        res.status(500).json({ msg: "خطأ في جلب البيانات" });
    }
};


exports.getActiveTrips = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { status: { $in: ['Scheduled', 'OnWay'] } };

        if (search) {
            query.$or = [
                { from: { $regex: search, $options: 'i' } },
                { to: { $regex: search, $options: 'i' } }
            ];
        }

        const trips = await Trip.find(query)
            .populate('companyId', 'name logo') 
            .populate('bookings')
            .sort({ departureTime: 1 });

        const formattedTrips = trips.map(trip => {
            const bookedCount = trip.bookedSeatsCount || 0;
            return {
                ...trip._doc,
                bookedSeats: bookedCount,
                totalSeats: trip.totalSeats || 0
            };
        });

        res.status(200).json(formattedTrips);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
    }
};

exports.getActiveTripsCount = async (req, res) => {
    try {
        const count = await Trip.countDocuments({ 
            status: { $in: ['Scheduled', 'OnWay'] } 
        });
        res.status(200).json({ activeTripsCount: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getActivePassengersCount = async (req, res) => {
    try {
        const result = await Trip.aggregate([
            { $match: { status: { $in: ['Scheduled', 'OnWay'] } } },
            { $unwind: "$seats" }, 
            { $match: { "seats.isBooked": true } },
            { $group: { _id: null, totalActivePassengers: { $sum: 1 } } }
        ]);

        const count = result.length > 0 ? result[0].totalActivePassengers : 0;
        res.status(200).json({ totalPassengers: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMonthlyCompletedTrips = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const trips = await Trip.find({
            status: 'Completed',
            departureTime: { $gte: oneMonthAgo }
        }).populate('companyId', 'name');

        res.status(200).json({
            count: trips.length,
            trips: trips
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }};