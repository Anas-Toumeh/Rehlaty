const express = require('express');
const router = express.Router();
const {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    getAvailableResources,
    getTripStats
} = require('../controllers/tripController');
const { auth, authorize } = require('../middleware/auth');

// Middleware المصادقة (افتراضي لديك)

router.use(auth)
// جميع routes تحتاج مصادقة ودور CompanyManager

// Routes
router.get('/',getTrips)
router.get('/:id',getTripById)
router.use(authorize('CompanyManager', 'Admin','Employee'));
router.post('/',createTrip)
   
// GET /api/trips/available-resources
router.get('/stats', getTripStats);                         // GET /api/trips/stats

router.route('/:id')       // GET /api/trips/:id
    .put(updateTrip)         // PUT /api/trips/:id
    .delete(deleteTrip);     // DELETE /api/trips/:id

module.exports = router;