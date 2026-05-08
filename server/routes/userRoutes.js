const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {auth} = require('../middleware/auth');

// البحث متاح للكل (بدون تسجيل دخول)
router.get('/search', userController.searchTrips);

// الحجز والملف الشخصي يحتاج تسجيل دخول
router.post('/book',auth,userController.bookTrip);
router.get('/my-bookings', auth, userController.getMyBookings);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/dashboard', auth, userController.getUserDashboard);

module.exports = router;