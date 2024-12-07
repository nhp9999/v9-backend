const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Không tìm thấy token xác thực'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Không tìm thấy thông tin người dùng'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Bạn không có quyền truy cập tính năng này'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    isAdmin
}; 