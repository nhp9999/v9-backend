require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Bắt đầu chạy migration...');

        // Đọc và chạy các file migration theo thứ tự
        const migrations = [
            'drop_declarations_tables.sql',     // Xóa bảng declarations cũ
            'create_units_table.sql',           // Tạo bảng units trước
            'add_unit_column_to_users.sql',     // Thêm cột unit vào users
            'add_unit_reference_to_users.sql',  // Thêm foreign key reference
            'add_department_unit_to_users.sql', // Thêm các cột khác vào users
            'create_employee_account.sql',      // Tạo tài khoản nhân viên
            'create_batches_table.sql',         // Tạo bảng batches
            'create_declarations_table.sql',     // Tạo bảng declarations
            'add_audit_columns_to_declarations.sql', // Thêm các cột audit nếu cần
            'create_sample_declarations.sql'     // Thêm dữ liệu mẫu
        ];

        for (const migration of migrations) {
            console.log(`Đang chạy migration: ${migration}`);
            const filePath = path.join(__dirname, 'migrations', migration);
            const sql = await fs.readFile(filePath, 'utf-8');
            
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            
            console.log(`Hoàn thành migration: ${migration}`);
        }

        console.log('Migration hoàn tất!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi chạy migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Chạy migration
runMigration()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Migration thất bại:', error);
        process.exit(1);
    }); 