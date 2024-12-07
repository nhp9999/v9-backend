const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        let client;
        try {
            // Kiểm tra JWT_SECRET ngay từ đầu
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not configured');
                return res.status(500).json({
                    message: 'Lỗi cấu hình hệ thống'
                });
            }

            console.log('Login request received:', {
                body: req.body
            });

            // Kiểm tra dữ liệu đầu vào
            const { username, password } = req.body;
            if (!username || !password) {
                console.log('Missing username or password');
                return res.status(400).json({
                    message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
                });
            }

            // Kết nối database
            client = await pool.connect();
            console.log('Connected to database');

            // L���y thông tin user
            const userResult = await client.query(
                `SELECT 
                    id, 
                    username, 
                    password,
                    role,
                    status,
                    department_code,
                    full_name,
                    email,
                    phone,
                    unit
                FROM users 
                WHERE LOWER(username) = LOWER($1)`,
                [username]
            );

            console.log('User query completed:', {
                found: userResult.rows.length > 0,
                username: username
            });

            if (userResult.rows.length === 0) {
                return res.status(401).json({
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            const user = userResult.rows[0];

            // Debug: Kiểm tra mật khẩu trong database
            console.log('Stored password info:', {
                hasPassword: !!user.password,
                passwordLength: user.password ? user.password.length : 0,
                isHashed: user.password ? user.password.startsWith('$2') : false
            });

            // Kiểm tra trạng thái tài khoản
            if (user.status === 'inactive' || user.status === 'Đã khóa') {
                console.log('Account is locked:', username);
                return res.status(401).json({
                    message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
                });
            }

            // Kiểm tra password
            console.log('Verifying password for user:', username);
            
            // Kiểm tra xem password có được hash chưa
            if (!user.password) {
                console.error('User password is not set:', username);
                return res.status(401).json({
                    message: 'Tài khoản chưa được thiết lập mật khẩu'
                });
            }

            // Nếu mật khẩu chưa được hash, hash nó
            if (!user.password.startsWith('$2')) {
                console.log('Password is not hashed, hashing it now...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                
                // Cập nhật mật khẩu đã hash vào database
                await client.query(
                    'UPDATE users SET password = $1 WHERE id = $2',
                    [hashedPassword, user.id]
                );
                
                user.password = hashedPassword;
                console.log('Password has been hashed and updated');
            }

            let isValidPassword = false;
            try {
                console.log('Comparing passwords:', {
                    inputLength: password.length,
                    storedLength: user.password.length
                });
                isValidPassword = await bcrypt.compare(password, user.password);
            } catch (bcryptError) {
                console.error('Password verification error:', {
                    error: bcryptError.message,
                    username: username
                });
                return res.status(500).json({
                    message: 'Có lỗi xảy ra khi xác thực mật khẩu'
                });
            }

            console.log('Password verification result:', isValidPassword);

            if (!isValidPassword) {
                return res.status(401).json({
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            // Cập nhật last_login_at
            try {
                await client.query(
                    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
                console.log('Last login time updated for user:', username);
            } catch (updateError) {
                console.error('Error updating last login time:', {
                    error: updateError.message,
                    username: username
                });
                // Không return lỗi vì việc cập nhật last_login không quan trọng
            }

            // Tạo token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role,
                    department_code: user.department_code,
                    status: user.status
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log('Token generated for user:', username);

            const responseData = {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    department_code: user.department_code,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    unit: user.unit,
                    status: user.status
                }
            };

            console.log('Login successful for user:', username);
            res.json(responseData);
        } catch (error) {
            console.error('Login error:', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({
                message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.'
            });
        } finally {
            if (client) {
                try {
                    await client.release();
                    console.log('Database connection released');
                } catch (releaseError) {
                    console.error('Error releasing client:', releaseError);
                }
            }
        }
    },

    me: async (req, res) => {
        let client;
        try {
            client = await pool.connect();

            // Lấy thông tin user
            const userResult = await client.query(
                'SELECT id, username, role, department_code, full_name, unit, status, commune FROM users WHERE id = $1',
                [req.user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const user = userResult.rows[0];

            // Kiểm tra trạng thái tài khoản
            if (user.status === 'inactive' || user.status === 'Đã khóa') {
                return res.status(401).json({
                    message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user info error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy thông tin người dùng'
            });
        } finally {
            if (client) {
                try {
                    await client.release();
                } catch (releaseError) {
                    console.error('Error releasing client:', releaseError);
                }
            }
        }
    },

    resetAdminPassword: async (req, res) => {
        let client;
        try {
            client = await pool.connect();

            // Tạo mật khẩu mới
            const newPassword = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Cập nhật mật khẩu cho tài khoản admin
            const result = await client.query(
                `UPDATE users 
                SET password = $1, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE username = 'admin' 
                RETURNING id, username, role, status`,
                [hashedPassword]
            );

            if (result.rows.length === 0) {
                // Nếu không tìm thấy tài khoản admin, tạo mới
                const createResult = await client.query(
                    `INSERT INTO users (
                        username, 
                        password, 
                        full_name, 
                        role, 
                        status, 
                        created_at, 
                        updated_at
                    ) VALUES (
                        'admin', 
                        $1, 
                        'Administrator', 
                        'admin', 
                        'active', 
                        CURRENT_TIMESTAMP, 
                        CURRENT_TIMESTAMP
                    ) RETURNING id, username, role, status`,
                    [hashedPassword]
                );

                console.log('Created new admin account');
                res.json({
                    message: 'Đã tạo mới tài khoản admin',
                    user: createResult.rows[0],
                    password: newPassword
                });
            } else {
                console.log('Reset admin password successfully');
                res.json({
                    message: 'Đã cập nhật mật khẩu admin',
                    user: result.rows[0],
                    password: newPassword
                });
            }
        } catch (error) {
            console.error('Reset admin password error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật mật khẩu admin'
            });
        } finally {
            if (client) {
                await client.release();
            }
        }
    }
};

module.exports = authController; 