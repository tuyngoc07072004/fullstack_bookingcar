const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getDriverById,
  getDriversByStatus,
  updateDriverStatus,
  searchDrivers
} = require('../controller/driverManagement.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/drivers', getAllDrivers);
router.get('/drivers/search', searchDrivers);
router.get('/drivers/status/:status', getDriversByStatus);
router.get('/drivers/:id', getDriverById);
router.put('/drivers/:id/status', updateDriverStatus);

module.exports = router;