const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth'); 
const bookingController = require('../controllers/bookingController'); 

router.use(auth); 

// Customers use unified payment+booking endpoint
router.post('/pay', authorize('Customer'), bookingController.createBookingWithPayment); // POST /api/bookings/pay

// Only internal users can create bookings directly
router.post('/', authorize('CompanyManager', 'Admin', 'Employee'), bookingController.createBooking);     
router.get('/booked-seats/:tripId', bookingController.getBookedSeats);
router.get('/my-bookings',bookingController.getMyBookings);                    // GET /api/bookings/my-bookings
router.get('/user/:userId', bookingController.getUserBookings);                 // GET /api/bookings/user/:userId
router.get('/trip/:tripId/seats', bookingController.getBookedSeats);           // GET /api/bookings/trip/:tripId/seats

router.get('/:bookingId', bookingController.getBookingDetails);                 // GET /api/bookings/:bookingId
router.patch('/:bookingId/cancel', bookingController.cancelBooking);

module.exports = router;