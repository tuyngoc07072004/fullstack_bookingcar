// router/Vehicle.router.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controller/Vehicle.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireStaff } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', requireStaff, vehicleController.addVehicle);
router.put('/:id', requireStaff, vehicleController.updateVehicle);
router.patch('/:id/status', requireStaff, vehicleController.updateVehicleStatus);
router.delete('/:id', requireStaff, vehicleController.deleteVehicle);

router.get('/', vehicleController.getAllVehicles);
router.get('/stats', vehicleController.getVehicleStats);
router.get('/search', vehicleController.searchVehicles);
router.get('/filter', vehicleController.getVehiclesByFilters);
router.get('/status/:status', vehicleController.getVehiclesByStatus);
router.get('/seats/:seats', vehicleController.getVehiclesBySeats);
router.get('/:id', vehicleController.getVehicleById);

module.exports = router;