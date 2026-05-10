const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Modle/User'); // تأكد من المسار الصحيح للموديل
require('dotenv').config({ path: './.env' }); // لجلب رابط قاعدة البيانات ومفتاح التشفير

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // استخدام رابط قاعدة البيانات من ملف .env

        const adminExists = await User.findOne({ role: 'Admin' });
        if (adminExists) {
            console.log("الأدمن موجود بالفعل!");
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123123123", salt); // كلمة المرور الافتراضية

        const admin = new User({
            fullName: "Anas",
            email: "admin@gmail.com.com",
            password: hashedPassword,
            phone: "0000000000",
            role: 'Admin'
        });

        await admin.save();
        console.log("تم إنشاء الـ Super Admin بنجاح!");
        console.log("الايميل: admin@system.com | الباسورد: admin123");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createSuperAdmin();