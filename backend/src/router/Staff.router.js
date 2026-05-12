const express = require('express');
const router = express.Router();
const staffController = require('../controller/Staff.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.post('/register', staffController.registerStaff);
router.post('/login', staffController.loginStaff);
router.post('/logout', staffController.logoutStaff);

router.get('/me', authMiddleware, staffController.getCurrentStaff);
router.put('/profile', authMiddleware, staffController.updateStaffProfile);
router.get('/accounts', authMiddleware, requireAdmin, staffController.getStaffAccounts);
router.put('/accounts/:id/role', authMiddleware, requireAdmin, staffController.updateStaffAccountRole);
router.patch('/accounts/:id/status', authMiddleware, requireAdmin, staffController.updateStaffAccountStatus);
router.delete('/accounts/:id', authMiddleware, requireAdmin, staffController.deleteStaffAccount);

router.post('/request-password-change', authMiddleware, staffController.requestPasswordChange);
router.post('/verify-otp', authMiddleware, staffController.verifyStaffOtp);
router.post('/change-password', authMiddleware, staffController.changeStaffPassword);
router.put('/change-password', authMiddleware, staffController.changeStaffPassword);

module.exports = router;