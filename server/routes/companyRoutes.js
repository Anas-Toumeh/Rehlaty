const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { auth, authorize } = require('../middleware/auth');

    


router.use(auth);
router.get('/users/available-drivers', companyController.getAvailableDrivers); // GET /api/users/available-drivers
router.get('/users/stats', companyController.getUserStats);                    // GET /api/users/stats

router.use(authorize('CompanyManager', 'Admin'));

router.route('/users')
    .get(companyController.getUsers)          // GET /api/users
    .post(companyController.createUser);      // POST /api/users

router.route('/users/:id')
    .get(companyController.getUserById)       // GET /api/users/:id
    .put(companyController.updateUser)        // PUT /api/users/:id
    .delete(companyController.deleteUser);    // DELETE /api/users/:id

router.patch('/users/:id/toggle-status', companyController.toggleUserStatus); // PATCH /api/users/:id/toggle-status







// المسارات الرئيسية
router.route('/buses')
    .get(companyController.getBuses)          // GET /api/buses
    .post(companyController.createBus);       // POST /api/buses

// إحصائيات الباصات
router.get('/buses/stats', companyController.getBusStats);           // GET /api/buses/stats

// الباصات المتاحة (لإضافة الرحلات)
router.get('/buses/available', companyController.getAvailableBuses); // GET /api/buses/available

// مسارات محددة
router.route('/buses/:id')
    .get(companyController.getBusById)        // GET /api/buses/:id
    .put(companyController.updateBus)         // PUT /api/buses/:id
    .delete(companyController.deleteBus);     // DELETE /api/buses/:id

// تبديل حالة الباص (تفعيل/تعطيل)
router.patch('/buses/:id/toggle-status', companyController.toggleBusStatus); // PATCH /api/buses/:id/toggle-status

// مسار تحديث الحالة (PATCH للتعديل الجزئي)
router.patch('/buses/:id/status', companyController.updateStatus);



// إحصائيات الرحلات العامة
router.get('/trip-stats', companyController.getTripStats);        // GET /api/reports/trip-stats

// التقرير الشهري
router.get('/monthly', companyController.getMonthlyReport);        // GET /api/reports/monthly

// التقرير التفصيلي
router.get('/detailed',companyController.getDetailedReport);      // GET /api/reports/detailed

// تصدير التقرير
router.get('/export/:format', companyController.exportReport);     // GET /api/reports/export/pdf
                                                  // GET /api/reports/export/excel

// إحصائيات الباصات
router.get('/bus-stats', companyController.getBusStats);           // GET /api/reports/bus-stats

module.exports = router;