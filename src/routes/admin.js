const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');

// Áp dụng middleware cho tất cả routes
router.use(authenticateToken);
router.use(adminMiddleware);

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management routes
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Declaration management routes
router.get('/declarations/pending', adminController.getPendingDeclarations);
router.post('/declarations/:id/approve', adminController.approveDeclaration);
router.post('/declarations/:id/reject', adminController.rejectDeclaration);

module.exports = router; 