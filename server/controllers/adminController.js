const Company = require('../Modle/Company');
const User = require('../Modle/User');
const Trip = require('../Modle/Trip');
const Booking = require('../Modle/Booking');
const bcrypt = require('bcryptjs');
const path = require('path');

// --- 1. إدارة الشركات (Companies Management) ---

// إنشاء شركة جديدة
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

// تفعيل/تعطيل شركة
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

// تعديل بيانات الشركة
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, email, password } = req.body;

        // 1. البحث عن الشركة أولاً
        let company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ msg: "الشركة غير موجودة" });
        }

        // 2. تجهيز البيانات الجديدة للتحديث
        const updatedData = {
            name,
            phone,
            address,
            email
        };

        // 3. إذا قام المستخدم برفع صورة جديدة
        if (req.file) {
            updatedData.logo = `/uploads/${req.file.filename}`;
             
        }

        // 5. تنفيذ التحديث في قاعدة البيانات
        company = await Company.findByIdAndUpdate(
            id,
            { $set: updatedData },
             // لإعادة البيانات بعد التعديل
        );

        res.json(company);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("خطأ في السيرفر أثناء التعديل");
    }
};

// --- 2. إدارة حسابات المدراء (Managers Management) ---

// تعيين مدير لشركة
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

// إعادة تعيين كلمة المرور (لأي مستخدم من قبل الأدمن)
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
// --- 3. الرقابة والإحصائيات العامة (System Overview) ---

// مراقبة النشاط (رؤية كل الرحلات)
exports.getAllTripsMonitoring = async (req, res) => {
    try {
        const trips = await Trip.find().populate('companyId', 'name'); // جلب اسم الشركة مع كل رحلة
        res.json(trips);
    } catch (err) {
        res.status(500).send("خطأ في جلب الرحلات للرقابة");
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 })
            .populate('managerId', 'fullName email');
        // جلب الشركات مرتبة حسب تاريخ الإنشاء
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
            .populate('companyId', 'name logo') // تعديل من company إلى companyId
            .populate('bookings')
            .sort({ departureTime: 1 });

        // إضافة حقل افتراضي لحساب المقاعد المحجوزة قبل الإرسال للفرونت إند
        const formattedTrips = trips.map(trip => {
            // استخدام الـ virtual getter bookedSeatsCount (يعتمد على populate('bookings'))
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

// 2. عدد الرحلات النشطة
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

// 3. مجموع المسافرين (داخل مصفوفة seats)
exports.getActivePassengersCount = async (req, res) => {
    try {
        const result = await Trip.aggregate([
            { $match: { status: { $in: ['Scheduled', 'OnWay'] } } },
            { $unwind: "$seats" }, // فك مصفوفة المقاعد
            { $match: { "seats.isBooked": true } }, // اختيار المحجوز فقط
            { $group: { _id: null, totalActivePassengers: { $sum: 1 } } }
        ]);

        const count = result.length > 0 ? result[0].totalActivePassengers : 0;
        res.status(200).json({ totalPassengers: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. الرحلات المكتملة شهرياً
exports.getMonthlyCompletedTrips = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const trips = await Trip.find({
            status: 'Completed',
            departureTime: { $gte: oneMonthAgo } // استخدام departureTime بدلاً من date
        }).populate('companyId', 'name');

        res.status(200).json({
            count: trips.length,
            trips: trips
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }};