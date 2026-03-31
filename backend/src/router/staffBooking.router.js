const express = require('express');
const router = express.Router();
const staffBookingController = require('../controller/staffBooking.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireStaff } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireStaff);
router.get('/stats', staffBookingController.getBookingStats);
router.get('/', staffBookingController.getAllBookings);
router.get('/assignment-options', staffBookingController.getAssignmentOptions);
router.get('/vehicles/available', staffBookingController.getAvailableVehicles);
router.get('/drivers/available', staffBookingController.getAvailableDrivers);
router.get('/:id/details', staffBookingController.getBookingDetailsForStaff);
router.get('/:id', staffBookingController.getBookingById);
router.patch('/:id/confirm', staffBookingController.confirmBooking);
router.post('/:id/assign', staffBookingController.assignDriverAndVehicle);
router.patch('/:id/status', staffBookingController.updateBookingStatus);
module.exports = router;