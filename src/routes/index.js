const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const declarationRoutes = require('./declaration');
const batchRoutes = require('./batch');
const adminRoutes = require('./admin');
const authMiddleware = require('../middleware/auth');

// Debug logs
console.log('Loading routes...');

// Debug middleware
router.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use(authMiddleware);

// Admin routes
router.use('/admin', adminRoutes);

// Other protected routes
router.use('/declarations', declarationRoutes);
router.use('/declaration-batches', batchRoutes);

console.log('Routes loaded successfully');

module.exports = router; 