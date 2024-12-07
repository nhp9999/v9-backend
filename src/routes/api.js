const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const declarationController = require('../controllers/declarationController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', auth.authenticateToken, authController.me);

// Employee batch routes
router.get('/declarations/employee/batches', auth.authenticateToken, declarationController.getEmployeeBatches);
router.get('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.getBatchById);
router.get('/declarations/employee/batch/:id/declarations', auth.authenticateToken, declarationController.getDeclarationsByBatchId);
router.post('/declarations/employee/batch', auth.authenticateToken, declarationController.createEmployeeBatch);
router.put('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.updateBatch);
router.delete('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.deleteEmployeeBatch);

// Employee declaration routes
router.get('/declarations/search/bhxh', auth.authenticateToken, declarationController.searchBHXH);
router.post('/declarations/employee/declaration', auth.authenticateToken, declarationController.createDeclaration);
router.delete('/declarations/employee/declaration/:id', auth.authenticateToken, declarationController.deleteDeclaration);

module.exports = router; 