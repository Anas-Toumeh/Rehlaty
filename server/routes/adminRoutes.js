const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth'); 
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2000000 }, 
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb('خطأ: الصور فقط مسموح بها!');
    }
});


router.use(auth , authorize('Admin')); 

router.post('/companies', authorize('Admin'), upload.single('logo'), adminController.createCompany);
router.put('/companies/:id', authorize('Admin'), upload.single('logo'), adminController.updateCompany);
router.patch('/companies/:id/status', authorize('Admin'), adminController.toggleCompanyStatus);
router.post('/assign-manager', authorize('Admin'), adminController.assignManager);
router.get('/trips', authorize('Admin'), adminController.getAllTripsMonitoring);
router.get('/companies', authorize('Admin'), adminController.getAllCompanies);
router.get('/trips/active', authorize('Admin'), adminController.getActiveTrips);
router.get('/trips/active-count', authorize('Admin'), adminController.getActiveTripsCount);
router.get('/trips/active-passengers', authorize('Admin'), adminController.getActivePassengersCount);
router.get('/trips/completed-monthly', authorize('Admin'), adminController.getMonthlyCompletedTrips);
module.exports = router;