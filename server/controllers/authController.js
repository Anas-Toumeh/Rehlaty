const User = require('../Modle/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. تسجيل مستخدم جديد (Customer)
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        
        // ✅ 1. التحقق من وجود جميع الحقول المطلوبة
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة (الاسم الكامل، البريد الإلكتروني، رقم الهاتف، كلمة المرور)'
            });
        }
        
        // ✅ 2. التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني غير صحيح'
            });
        }
        
        // ✅ 3. التحقق من صحة رقم الهاتف (رقم سوري: 9 أرقام يبدأ بـ 09)
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'رقم الهاتف غير صحيح. يجب أن يكون 9 أرقام ويبدأ بـ 09'
            });
        }
        
        // ✅ 4. التحقق من قوة كلمة المرور (6 أحرف على الأقل)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            });
        }
        
        // ✅ 5. التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني موجود بالفعل'
            });
        }
        
        // ✅ 6. التحقق من عدم وجود مستخدم بنفس رقم الهاتف
        const existingUserByPhone = await User.findOne({ phone });
        if (existingUserByPhone) {
            return res.status(400).json({
                success: false,
                message: 'رقم الهاتف موجود بالفعل'
            });
        }
        
        // ✅ 7. تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // ✅ 8. تحديد الدور (Customer افتراضياً)
        const userRole ='Customer';
        
        // ✅ 9. إنشاء المستخدم الجديد
        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: userRole,
            isActive: true,
            createdAt: new Date()
        });
        
        await user.save();
        
        // ✅ 10. إنشاء التوكن (JWT)
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // ✅ 11. إرجاع البيانات بدون كلمة المرور
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };
        
        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('❌ Register error:', error);
        
        // معالجة أخطاء MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني أو رقم الهاتف موجود بالفعل'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء الحساب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 2. تسجيل الدخول
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "بيانات الدخول غير صحيحة" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "بيانات الدخول غير صحيحة" });

        // إنشاء التوكن JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, companyId: user.companyId },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId
            }
        });

    } catch (err) {
        res.status(500).send("خطأ في السيرفر");
    }
};

// @desc    تسجيل دخول العملاء (Customers فقط)
// @route   POST /api/auth/customer-login
// @access  Public
exports.customerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // التحقق من وجود البريد الإلكتروني وكلمة المرور
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور'
            });
        }
        
        // البحث عن المستخدم بالبريد الإلكتروني
        const user = await User.findOne({ email });
        
        // التحقق من وجود المستخدم
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }
        
        // ✅ التحقق من أن الدور هو Customer فقط
        if (user.role !== 'Customer') {
            return res.status(403).json({
                success: false,
                message: 'هذا الحساب غير مصرح له بتسجيل الدخول كعميل. يرجى استخدام بوابة تسجيل الدخول المناسبة'
            });
        }
        
        // التحقق من صحة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }
        
        // التحقق من أن الحساب نشط
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'الحساب غير نشط. يرجى التواصل مع الدعم الفني'
            });
        }
        
        // إنشاء التوكن (JWT)
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // إرجاع البيانات بدون كلمة المرور
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };
        
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error in customerLogin:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تسجيل الدخول',
            error: error.message
        });
    }
};