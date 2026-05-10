const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

router.post('/register', cashController.registerCashAccount);

router.post('/recharge', cashController.rechargeBalance);

router.post('/check-balance', cashController.checkBalance);

router.post('/pay', cashController.payWithCash);

router.get('/account/:phone', cashController.getAccountInfo);

module.exports = router;