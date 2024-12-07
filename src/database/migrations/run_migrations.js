const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function runMigrations() {
    try {
        // Đọc tất cả file .sql trong thư mục migrations
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sắp xếp theo tên file để đảm bảo thứ tự chạy

        console.log('Starting migrations...');

        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(__dirname, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Thực thi migration
            await pool.query(sql);
            console.log(`Completed migration: ${file}`);
        }

        console.log('All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

runMigrations(); 