const express = require('express');
const router = express.Router();
const tripController = require('../controller/Trip.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireStaff } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireStaff);

router.get('/stats', tripController.getTripStats);

router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);
router.get('/:id/bookings', tripController.getTripBookings);
router.patch('/:id/status', tripController.updateTripStatus);

router.delete('/:tripId/bookings/:bookingId', tripController.removeBookingFromTrip);

router.post('/assign-booking/:id', tripController.assignBooking);
router.get('/find-trips/:bookingId', tripController.findSuitableTrips);

module.exports = router;