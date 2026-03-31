const express = require('express');
const router = express.Router();
const staffCustomerController = require('../controller/StaffCustomer.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireStaff } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireStaff);

router.get('/customers', staffCustomerController.getAllCustomers);

router.get('/customers/:customerId/bookings', staffCustomerController.getCustomerBookings);

router.get('/customers/:customerId/bookings/:bookingId', staffCustomerController.getCustomerBookingDetail);

module.exports = router;