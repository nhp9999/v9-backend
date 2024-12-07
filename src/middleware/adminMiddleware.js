const adminMiddleware = (req, res, next) => {
    console.log('Admin middleware - User:', req.user);
    
    if (!req.user) {
        console.log('No user found in request');
        return res.status(401).json({
            message: 'Vui lòng đăng nhập'
        });
    }
    
    if (req.user.role !== 'admin') {
        console.log('User role is not admin:', req.user.role);
        return res.status(403).json({
            message: 'Không có quyền truy cập'
        });
    }
    
    console.log('Admin access granted');
    next();
};

module.exports = adminMiddleware; 