const express = require('express');
const router = express.Router();
const staffController = require('../controller/Staff.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', staffController.registerStaff);
router.post('/login', staffController.loginStaff);
router.post('/logout', staffController.logoutStaff);

router.get('/me', authMiddleware, staffController.getCurrentStaff);

module.exports = router;