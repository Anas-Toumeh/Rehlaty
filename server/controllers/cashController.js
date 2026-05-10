// controllers/cashController.js
const Cash = require('../Modle/Cash');
const bcrypt = require('bcryptjs');

// @desc    إنشاء حساب دفع جديد
// @route   POST /api/cash/register
exports.registerCashAccount = async (req, res) => {
    try {
        const { name, phone, password, balance } = req.body;
        
        const existingAccount = await Cash.findOne({ phone });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'هذا الرقم مسجل مسبقاً'
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const cashAccount = new Cash({
            name,
            phone,
            password: hashedPassword,
            balance: balance || 0
        });
        
        await cashAccount.save();
        
        res.status(201).json({
            success: true,
            message: 'تم إنشاء حساب الدفع بنجاح',
            account: {
                name: cashAccount.name,
                phone: cashAccount.phone,
                balance: cashAccount.balance
            }
        });
        
    } catch (error) {
        console.error('Error in registerCashAccount:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء الحساب'
        });
    }
};

// @desc    شحن الرصيد
// @route   POST /api/cash/recharge
exports.rechargeBalance = async (req, res) => {
    try {
        const { phone, amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'المبلغ يجب أن يكون أكبر من 0'
            });
        }
        
        const cashAccount = await Cash.findOne({ phone });
        if (!cashAccount) {
            return res.status(404).json({
                success: false,
                message: 'الحساب غير موجود'
            });
        }
        
        cashAccount.balance += amount;
        await cashAccount.save();
        
        res.status(200).json({
            success: true,
            message: `تم شحن ${amount} ل.س بنجاح`,
            account: {
                name: cashAccount.name,
                phone: cashAccount.phone,
                balance: cashAccount.balance
            }
        });
        
    } catch (error) {
        console.error('Error in rechargeBalance:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في شحن الرصيد'
        });
    }
};

// @desc    التحقق من الرصيد
// @route   POST /api/cash/check-balance
exports. checkBalance = async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        const cashAccount = await Cash.findOne({ phone });
        if (!cashAccount) {
            return res.status(404).json({
                success: false,
                message: 'الحساب غير موجود'
            });
        }
        
        const isMatch = await bcrypt.compare(password, cashAccount.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'كلمة المرور غير صحيحة'
            });
        }
        
        res.status(200).json({
            success: true,
            balance: cashAccount.balance,
            name: cashAccount.name,
            phone: cashAccount.phone
        });
        
    } catch (error) {
        console.error('Error in checkBalance:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في التحقق من الرصيد'
        });
    }
};

// @desc    دفع قيمة حجز
// @route   POST /api/cash/pay
exports.payWithCash = async (req, res) => {
    try {
        const { phone, password, amount, bookingId } = req.body;
        
        const cashAccount = await Cash.findOne({ phone });
        if (!cashAccount) {
            return res.status(404).json({
                success: false,
                message: 'الحساب غير موجود',
                code: 'ACCOUNT_NOT_FOUND'
            });
        }
        
        const isMatch = await bcrypt.compare(password, cashAccount.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'كلمة المرور غير صحيحة',
                code: 'WRONG_PASSWORD'
            });
        }
        
        if (cashAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: `الرصيد غير كافٍ. الرصيد الحالي: ${cashAccount.balance} ل.س`,
                code: 'INSUFFICIENT_BALANCE',
                balance: cashAccount.balance,
                required: amount,
                shortfall: amount - cashAccount.balance
            });
        }
        
        cashAccount.balance -= amount;
        await cashAccount.save();
        
        res.status(200).json({
            success: true,
            message: `تم الدفع بنجاح. الرصيد المتبقي: ${cashAccount.balance} ل.س`,
            code: 'PAYMENT_SUCCESS',
            balance: cashAccount.balance,
            deducted: amount,
            bookingId: bookingId
        });
        
    } catch (error) {
        console.error('Error in payWithCash:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في عملية الدفع',
            code: 'SERVER_ERROR'
        });
    }
};

// @desc    الحصول على معلومات الحساب
// @route   GET /api/cash/account/:phone
exports.getAccountInfo = async (req, res) => {
    try {
        const { phone } = req.params;
        
        const cashAccount = await Cash.findOne({ phone });
        if (!cashAccount) {
            return res.status(404).json({
                success: false,
                message: 'الحساب غير موجود'
            });
        }
        
        res.status(200).json({
            success: true,
            account: {
                name: cashAccount.name,
                phone: cashAccount.phone,
                balance: cashAccount.balance
            }
        });
        
    } catch (error) {
        console.error('Error in getAccountInfo:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب معلومات الحساب'
        });
    }
};

