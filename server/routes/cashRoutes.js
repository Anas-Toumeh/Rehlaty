const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

// إنشاء حساب جديد
router.post('/register', cashController.registerCashAccount);

// شحن الرصيد
router.post('/recharge', cashController.rechargeBalance);

// التحقق من الرصيد (رقم هاتف + كلمة مرور)
router.post('/check-balance', cashController.checkBalance);

// دفع قيمة حجز (رقم هاتف + كلمة مرور + المبلغ)
router.post('/pay', cashController.payWithCash);

// جلب معلومات الحساب
router.get('/account/:phone', cashController.getAccountInfo);

module.exports = router;