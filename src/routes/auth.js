const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Route để tạo lại tài khoản admin
router.post('/recreate-admin', async (req, res) => {
    const client = await pool.connect();
    try {
        // Xóa tài khoản admin cũ nếu có
        await client.query('DELETE FROM users WHERE username = $1', ['admin']);

        // Tạo mật khẩu mới và hash
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log('Mật khẩu gốc:', password);
        console.log('Mật khẩu đã hash:', hashedPassword);
        
        // Tạo tài khoản admin mới
        const result = await client.query(
            `INSERT INTO users (username, password, full_name, role, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING *`,
            ['admin', hashedPassword, 'Administrator', 'admin', 'active']
        );

        // Kiểm tra mật khẩu ngay sau khi tạo
        const testPassword = await bcrypt.compare(password, result.rows[0].password);
        console.log('Kiểm tra mật khẩu sau khi tạo:', testPassword);

        res.json({ 
            message: 'Tạo lại tài khoản admin thành công',
            passwordCheck: testPassword
        });
    } catch (error) {
        console.error('Lỗi tạo lại admin:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra' });
    } finally {
        client.release();
    }
});

// Route đăng nhập
router.post('/login', async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Request body:', req.body);
        const { username, password } = req.body;

        // Kiểm tra username và password
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Lấy thông tin user và đảm bảo chỉ lấy các trường cần thiết
        const result = await client.query(
            `SELECT 
                id, 
                username, 
                password,
                role,
                status,
                department_code,
                full_name,
                email,
                phone
            FROM users 
            WHERE username = $1`,
            [username]
        );

        console.log('Query result:', {
            found: result.rows.length > 0,
            username: username
        });

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const user = result.rows[0];

        // Kiểm tra trạng thái tài khoản
        if (user.status === 'inactive') {
            return res.status(401).json({
                message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
            });
        }

        // Debug password check
        console.log('Password check:', {
            inputPassword: password,
            hashedPasswordLength: user.password ? user.password.length : 0
        });

        // Kiểm tra mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword);
        
        if (!validPassword) {
            return res.status(401).json({
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                department_code: user.department_code 
            },
            process.env.JWT_SECRET || 'your-secret-key', // Thêm fallback secret key
            { expiresIn: '24h' }
        );

        // Cập nhật last_login
        await client.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Chuẩn bị response
        const response = {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                department_code: user.department_code,
                email: user.email,
                phone: user.phone
            }
        };

        console.log('Login successful for user:', username);
        res.json(response);
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            message: 'Có lỗi xảy ra, vui lòng thử lại'
        });
    } finally {
        client.release();
    }
});

module.exports = router; 