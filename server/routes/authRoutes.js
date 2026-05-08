const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// 1. تسجيل مستخدم جديد (للزوار ليصبحوا زبائن)
// POST /api/auth/register
router.post('/register', authController.register);

// 2. تسجيل الدخول (لكافة الأدوار)
// POST /api/auth/login
router.post('/login', authController.login);
router.post('/customer-login', authController.customerLogin);



module.exports = router;