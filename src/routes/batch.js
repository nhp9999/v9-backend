const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const authMiddleware = require('../middleware/auth');

// Batch routes
router.get('/', batchController.getBatches);
router.get('/next-number', authMiddleware, batchController.getNextBatchNumber);
router.post('/', authMiddleware, batchController.create);
router.put('/:id', authMiddleware, batchController.update);
router.delete('/:id', authMiddleware, batchController.delete);
router.post('/:id/submit', authMiddleware, batchController.submit);

module.exports = router; 