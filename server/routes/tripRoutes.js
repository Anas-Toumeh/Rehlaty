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
router.get('/',getTrips)
router.get('/details/:id', authorize('Customer'), getTripById)
// جميع routes تحتاج مصادقة ودور CompanyManager
router.use(authorize('CompanyManager', 'Admin'));
// Routes

router.post('/',createTrip)
   
router.get('/available-resources', getAvailableResources);  // GET /api/trips/available-resources
router.get('/stats', getTripStats);                         // GET /api/trips/stats

router.route('/:id') 
    .get(getTripById)      // GET /api/trips/:id
    .put(updateTrip)         // PUT /api/trips/:id
    .delete(deleteTrip);     // DELETE /api/trips/:id

module.exports = router;