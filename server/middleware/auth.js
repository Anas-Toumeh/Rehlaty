const jwt = require('jsonwebtoken');

// 1. دالة التحقق من التوكن (Authentication)
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'لا يوجد توكن، الوصول مرفوض' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded; 
        next();
    } catch (err) {
        res.status(401).json({ msg: 'التوكن غير صالح' });
    }
};

// 2. دالة التحقق من الصلاحيات (Authorization)
const authorize = (...roles) => {
    return (req, res, next) => {
        // تأكد أن الدور موجود في التوكن
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                msg: `الدور ${req.user ? req.user.role : 'غير معروف'} غير مسموح له بالقيام بهذا الإجراء` 
            });
        }
        next();
    };
};


module.exports = { auth, authorize };