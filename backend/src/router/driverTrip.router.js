const express = require('express');
const router = express.Router();
const driverTripController = require('../controller/driverTrip.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireDriver } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/status', requireDriver, driverTripController.getDriverStatus);
router.get('/me/vehicle', requireDriver, driverTripController.getMyVehicle);
router.post('/self-booking', requireDriver, driverTripController.createDriverSelfBooking);
router.get('/:driverId/trips', driverTripController.getDriverTrips);
router.get('/:driverId/stats', driverTripController.getDriverStats);
router.put('/confirm-trip', requireDriver, driverTripController.confirmTrip);
router.put('/complete-trip/:bookingId', requireDriver, driverTripController.completeTrip);

module.exports = router;