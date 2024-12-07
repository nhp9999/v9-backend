const pool = require('../config/database');
const bcrypt = require('bcrypt');

const userService = {
    async getUsers() {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, username, email, role, full_name, created_at, updated_at 
                 FROM users 
                 WHERE deleted_at IS NULL
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } finally {
            client.release();
        }
    },

    async createUser(userData) {
        const client = await pool.connect();
        try {
            const { username, email, password, role, fullName } = userData;

            // Kiểm tra username đã tồn tại
            const existingUser = await client.query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );

            if (existingUser.rows.length > 0) {
                throw new Error('Tên đăng nhập đã tồn tại');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const result = await client.query(
                `INSERT INTO users (username, email, password, role, full_name)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, username, email, role, full_name, created_at`,
                [username, email, hashedPassword, role, fullName]
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async updateUser(id, userData) {
        const client = await pool.connect();
        try {
            const { username, email, password, role, fullName } = userData;
            
            // Nếu có password mới thì hash
            let hashedPassword;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                hashedPassword = await bcrypt.hash(password, salt);
            }

            const result = await client.query(
                `UPDATE users 
                 SET username = $1, 
                     email = $2,
                     ${password ? 'password = $3,' : ''} 
                     role = $4,
                     full_name = $5,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6 AND deleted_at IS NULL
                 RETURNING id, username, email, role, full_name, updated_at`,
                password 
                    ? [username, email, hashedPassword, role, fullName, id]
                    : [username, email, role, fullName, id]
            );

            if (result.rows.length === 0) {
                throw new Error('Không tìm thấy người dùng');
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async deleteUser(id) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE users 
                 SET deleted_at = CURRENT_TIMESTAMP 
                 WHERE id = $1 AND deleted_at IS NULL
                 RETURNING id`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('Không tìm thấy người dùng');
            }
        } finally {
            client.release();
        }
    }
};

module.exports = userService; 