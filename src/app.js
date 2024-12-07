const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const { requestLogger, errorLogger } = require('./middleware/logging');

const app = express();

// Enable pre-flight requests for all routes
app.options('*', cors());

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Error logging
app.use(errorLogger);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        origin: req.headers.origin
    });

    // Xử lý lỗi validation
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            type: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            errors: err.errors
        });
    }

    // Xử lý lỗi JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            type: 'AUTH_ERROR',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
        });
    }

    // Xử lý lỗi database
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(400).json({
                    status: 'error',
                    type: 'DUPLICATE_ERROR',
                    message: 'Dữ liệu đã tồn tại trong hệ thống'
                });
            case '23503': // Foreign key violation
                return res.status(400).json({
                    status: 'error',
                    type: 'REFERENCE_ERROR',
                    message: 'Dữ liệu tham chiếu không tồn tại'
                });
            case '23502': // Not null violation
                return res.status(400).json({
                    status: 'error',
                    type: 'NULL_ERROR',
                    message: 'Thiếu thông tin bắt buộc'
                });
            case '42P01': // Undefined table
                return res.status(500).json({
                    status: 'error',
                    type: 'TABLE_ERROR',
                    message: 'Lỗi cấu trúc database'
                });
            case '42703': // Undefined column
                return res.status(500).json({
                    status: 'error',
                    type: 'COLUMN_ERROR',
                    message: 'Lỗi cấu trúc dữ liệu'
                });
            case '28P01': // Invalid password
                return res.status(401).json({
                    status: 'error',
                    type: 'AUTH_ERROR',
                    message: 'Lỗi xác thực database'
                });
            case '3D000': // Invalid catalog name
                return res.status(500).json({
                    status: 'error',
                    type: 'DATABASE_ERROR',
                    message: 'Database không tồn tại'
                });
            case '57P03': // Cannot connect now
                return res.status(503).json({
                    status: 'error',
                    type: 'CONNECTION_ERROR',
                    message: 'Không thể kết nối đến database'
                });
        }
    }

    // Xử lý lỗi chung
    res.status(err.status || 500).json({
        status: 'error',
        type: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'Có lỗi xảy ra',
        ...(process.env.NODE_ENV === 'development' && {
            detail: err.message,
            stack: err.stack
        })
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        type: 'NOT_FOUND',
        message: 'Không tìm thấy tài nguyên yêu cầu'
    });
});

module.exports = app; 