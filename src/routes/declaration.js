const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const declarationController = require('../controllers/declarationController');

// Employee routes
router.get('/employee', authMiddleware, declarationController.getEmployeeDeclarations);
router.get('/employee/:id', authMiddleware, declarationController.getEmployeeDeclarationDetail);

// Batch routes
router.get('/batches', authMiddleware, declarationController.getBatches);
router.post('/batch/:batch_id/submit', authMiddleware, declarationController.submitBatch);
router.get('/batch/:batch_id/status', authMiddleware, declarationController.getBatchStatus);
router.get('/batch/:batch_id/stats', authMiddleware, declarationController.getBatchStats);
router.get('/batch/:batch_id/history', authMiddleware, declarationController.getBatchHistory);
router.get('/batch/:batch_id/list', authMiddleware, declarationController.getDeclarationsByStatus);

// Public routes
router.get('/search', authMiddleware, declarationController.search);
router.get('/', authMiddleware, declarationController.list);
router.get('/batch/:batch_id', authMiddleware, declarationController.listByBatch);
router.post('/', authMiddleware, declarationController.create);

// Admin routes
router.post('/:id/approve', [authMiddleware, adminMiddleware], declarationController.approve);
router.post('/:id/reject', [authMiddleware, adminMiddleware], declarationController.reject);

module.exports = router; 