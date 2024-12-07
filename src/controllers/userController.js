const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Hàm validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Hàm validate số điện thoại
const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
};

const userController = {
    async getUsers(req, res) {
        const client = await pool.connect();
        console.log('=== BẮT ĐẦU LẤY DANH SÁCH USERS ===');
        try {
            console.log('Đang thực hiện truy vấn lấy danh sách users...');
            const result = await client.query(
                `SELECT 
                    id, 
                    username, 
                    role, 
                    department_code, 
                    full_name, 
                    unit, 
                    email, 
                    phone, 
                    status, 
                    created_at, 
                    last_login_at 
                FROM users 
                ORDER BY created_at DESC`
            );

            console.log('Kết quả truy vấn:', {
                totalUsers: result.rows.length,
                users: result.rows.map(user => ({
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    status: user.status
                }))
            });

            res.json(result.rows);
        } catch (error) {
            console.error('=== LỖI KHI LẤY DANH SÁCH USERS ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                position: error.position,
                stack: error.stack,
                query: error.query
            });

            // Phân loại và trả về message lỗi phù hợp
            let errorMessage = 'Có lỗi xảy ra khi lấy danh sách người dùng';
            let statusCode = 500;

            if (error.code === '42P01') { // Undefined table
                errorMessage = 'Bảng users không tồn tại';
                console.error('LỖI: Bảng users không tồn tại trong database');
            } else if (error.code === '42703') { // Undefined column
                errorMessage = 'Lỗi cấu trúc dữ liệu';
                console.error('LỖI: Một hoặc nhiều cột không tồn tại trong bảng users');
            } else if (error.code === '28P01') { // Invalid password
                errorMessage = 'Lỗi xác thực database';
                statusCode = 401;
                console.error('LỖI: Không thể xác thực với database');
            } else if (error.code === '3D000') { // Invalid catalog name
                errorMessage = 'Database không tồn tại';
                console.error('LỖI: Database không tồn tại');
            } else if (error.code === '57P03') { // Cannot connect now
                errorMessage = 'Không thể kết nối đến database';
                console.error('LỖI: Không thể kết nối đến database');
            }

            res.status(statusCode).json({
                status: 'error',
                type: error.code || 'UNKNOWN_ERROR',
                message: errorMessage
            });
        } finally {
            if (client) {
                try {
                    await client.release();
                    console.log('Đã giải phóng kết nối database');
                } catch (releaseError) {
                    console.error('Lỗi khi giải phóng kết nối:', releaseError);
                }
            }
            console.log('=== KẾT THÚC LẤY DANH SÁCH USERS ===\n');
        }
    },

    async createUser(req, res) {
        const client = await pool.connect();
        try {
            const { username, password, role, department_code, full_name, unit, email, phone } = req.body;

            // Kiểm tra các trường bắt buộc
            if (!username || !password || !role || !full_name) {
                return res.status(400).json({
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc: tên đăng nhập, mật khẩu, vai trò, họ tên'
                });
            }

            // Validate username
            if (username.length < 3) {
                return res.status(400).json({
                    message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
                });
            }

            // Validate password
            if (password.length < 6) {
                return res.status(400).json({
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
            }

            // Validate email nếu có
            if (email && !isValidEmail(email)) {
                return res.status(400).json({
                    message: 'Email không hợp lệ'
                });
            }

            // Validate số điện thoại nếu có
            if (phone && !isValidPhone(phone)) {
                return res.status(400).json({
                    message: 'Số điện thoại không hợp lệ'
                });
            }

            // Kiểm tra username đã tồn tại
            const existingUser = await client.query(
                'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
                [username]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({
                    message: 'Tên đăng nhập đã tồn tại'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo user mới
            const result = await client.query(
                'INSERT INTO users (username, password, role, department_code, full_name, unit, email, phone, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username, role, department_code, full_name, unit, email, phone, status, created_at',
                [username, hashedPassword, role, department_code, full_name, unit, email, phone, 'active']
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi tạo người dùng'
            });
        } finally {
            client.release();
        }
    },

    async updateUser(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { role, department_code, full_name, unit, email, phone } = req.body;

            // Kiểm tra các trường bắt buộc
            if (!role || !full_name) {
                return res.status(400).json({
                    message: 'Vui lòng điền đầy đủ thông tin bắt buộc: vai trò, họ tên'
                });
            }

            // Validate email nếu có
            if (email && !isValidEmail(email)) {
                return res.status(400).json({
                    message: 'Email không hợp lệ'
                });
            }

            // Validate số điện thoại nếu có
            if (phone && !isValidPhone(phone)) {
                return res.status(400).json({
                    message: 'Số điện thoại không hợp lệ'
                });
            }

            // Kiểm tra user tồn tại
            const existingUser = await client.query(
                'SELECT * FROM users WHERE id = $1',
                [id]
            );

            if (existingUser.rows.length === 0) {
                return res.status(404).json({
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Không cho phép thay đổi role của admin
            if (existingUser.rows[0].username === 'admin' && role !== 'admin') {
                return res.status(403).json({
                    message: 'Không thể thay đổi vai trò của tài khoản admin'
                });
            }

            // Cập nhật thông tin user
            const result = await client.query(
                'UPDATE users SET role = $1, department_code = $2, full_name = $3, unit = $4, email = $5, phone = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, username, role, department_code, full_name, unit, email, phone, status',
                [role, department_code, full_name, unit, email, phone, id]
            );

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật thông tin người dùng'
            });
        } finally {
            client.release();
        }
    },

    async deleteUser(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Bắt đầu transaction
            
            const { id } = req.params;
            
            console.log('=== BẮT ĐẦU XÓA USER ===');
            console.log('Request params:', req.params);
            console.log('User ID cần xóa:', id);

            if (!id) {
                console.log('LỖI: ID người dùng không hợp lệ');
                return res.status(400).json({
                    message: 'ID người dùng không hợp lệ'
                });
            }

            // Kiểm tra user tồn tại
            console.log('Đang kiểm tra user tồn tại...');
            const existingUser = await client.query(
                'SELECT id, username, role FROM users WHERE id = $1',
                [id]
            );

            console.log('Kết quả tìm kiếm user:', {
                found: existingUser.rows.length > 0,
                userData: existingUser.rows[0]
            });

            if (existingUser.rows.length === 0) {
                console.log('LỖI: Không tìm thấy user với ID:', id);
                return res.status(404).json({
                    message: 'Không tìm thấy người dùng'
                });
            }

            const user = existingUser.rows[0];
            console.log('Thông tin user cần xóa:', user);

            // Không cho phép xóa tài khoản admin
            if (user.username === 'admin') {
                console.log('LỖI: Không thể xóa tài khoản admin');
                return res.status(403).json({
                    message: 'Không thể xóa tài khoản admin'
                });
            }

            // Kiểm tra các ràng buộc khóa ngoại
            console.log('Đang kiểm tra ràng buộc khóa ngoại...');
            const checkForeignKeys = await client.query(
                `SELECT 
                    c.conname AS constraint_name,
                    c.conrelid::regclass AS table_name,
                    a.attname AS column_name
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
                WHERE c.confrelid = 'users'::regclass AND c.contype = 'f'`
            );

            if (checkForeignKeys.rows.length > 0) {
                console.log('Danh sách các ràng buộc khóa ngoại:', checkForeignKeys.rows);
                
                // Kiểm tra từng bảng có khóa ngoại
                for (const fk of checkForeignKeys.rows) {
                    const checkData = await client.query(
                        `SELECT EXISTS (
                            SELECT 1 FROM ${fk.table_name} 
                            WHERE ${fk.column_name} = $1
                        )`,
                        [id]
                    );
                    
                    if (checkData.rows[0].exists) {
                        console.log(`LỖI: Tồn tại dữ liệu liên quan trong bảng ${fk.table_name}`);
                        return res.status(400).json({
                            message: `Không thể xóa người dùng vì còn dữ liệu liên quan trong ${fk.table_name}`
                        });
                    }
                }
            }

            // Thực hiện xóa user
            console.log('Bắt đầu xóa user...');
            const deleteResult = await client.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [id]
            );

            console.log('Kết quả xóa user:', {
                success: deleteResult.rows.length > 0,
                deletedId: deleteResult.rows[0]?.id
            });

            if (deleteResult.rows.length > 0) {
                await client.query('COMMIT');
                console.log('XÓA USER THÀNH CÔNG');
                res.json({
                    success: true,
                    message: 'Đã xóa người dùng thành công'
                });
            } else {
                console.log('LỖI: Không thể xóa user mặc dù đã pass tất cả điều kiện');
                throw new Error('Không thể xóa người dùng');
            }
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('=== LỖI KHI XÓA USER ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                position: error.position,
                stack: error.stack
            });

            // Phân loại và trả về message lỗi phù hợp
            let errorMessage = 'Có lỗi xảy ra khi xóa người dùng';
            if (error.code === '23503') { // Foreign key violation
                errorMessage = 'Không thể xóa người dùng vì còn dữ liệu liên quan';
            } else if (error.code === '23505') { // Unique violation
                errorMessage = 'Lỗi ràng buộc dữ liệu';
            } else if (error.code === '42P01') { // Undefined table
                errorMessage = 'Lỗi cấu trúc database';
            }

            res.status(500).json({ message: errorMessage });
        } finally {
            if (client) {
                try {
                    await client.release();
                    console.log('Đã giải phóng kết nối database');
                } catch (releaseError) {
                    console.error('Lỗi khi giải phóng kết nối:', releaseError);
                }
            }
            console.log('=== KẾT THÚC QUÁ TRÌNH XÓA USER ===');
        }
    },

    async toggleUserStatus(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            console.log('Toggle user status for ID:', id);

            // Kiểm tra user tồn tại
            const existingUser = await client.query(
                'SELECT id, username, role, status FROM users WHERE id = $1',
                [id]
            );

            if (existingUser.rows.length === 0) {
                console.log('User not found:', id);
                return res.status(404).json({
                    message: 'Không tìm thấy người dùng'
                });
            }

            const user = existingUser.rows[0];
            console.log('Found user:', user);

            // Không cho phép khóa tài khoản admin
            if (user.username === 'admin') {
                console.log('Attempted to toggle admin account');
                return res.status(403).json({
                    message: 'Không thể khóa tài khoản admin'
                });
            }

            // Đổi trạng thái
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            console.log('Changing status from', user.status, 'to', newStatus);

            // Cập nhật trạng thái
            const result = await client.query(
                `UPDATE users 
                SET 
                    status = $1, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING id, username, role, department_code, full_name, unit, email, phone, status`,
                [newStatus, id]
            );

            console.log('Update result:', result.rows[0]);

            if (result.rows.length > 0) {
                res.json({
                    message: `Đã ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản thành công`,
                    user: result.rows[0]
                });
            } else {
                throw new Error('Không thể cập nhật trạng thái tài khoản');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi thay đổi trạng thái người dùng'
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
    }
};

module.exports = userController; 