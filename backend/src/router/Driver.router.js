const express = require('express');
const router = express.Router();
const driverController = require('../controller/Driver.controller');
const driverTripController = require('../controller/driverTrip.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireDriver } = require('../middleware/roleMiddleware');

// Public — đăng ký / đăng nhập / đăng xuất (không cần JWT)
router.post('/driver-register', driverController.registerDriver);
router.post('/driver-login', driverController.loginDriver);
router.post('/driver-logout', driverController.logoutDriver);

// Các route sau cần xác thực
router.use(authMiddleware);

router.get('/me', requireDriver, driverController.getCurrentDriver);
router.put('/profile', requireDriver, driverController.updateDriverProfile);
router.put('/change-password', requireDriver, driverController.changePassword);

router.get('/status', requireDriver, driverTripController.getDriverStatus);
router.get('/trips/:driverId', driverTripController.getDriverTrips);
router.get('/stats/:driverId', driverTripController.getDriverStats);
router.put('/confirm-trip', requireDriver, driverTripController.confirmTrip);
router.put('/complete-trip/:bookingId', requireDriver, driverTripController.completeTrip);

module.exports = router;
