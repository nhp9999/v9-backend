const { Pool } = require('pg');

// Log database configuration
console.log('Database configuration:', {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bhxh_db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres'
});

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bhxh_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Kiểm tra kết nối
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database:', {
        database: process.env.DB_NAME || 'bhxh_db',
        host: process.env.DB_HOST || 'localhost'
    });
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', {
        message: err.message,
        code: err.code,
        stack: err.stack
    });
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection test failed:', err);
    } else {
        console.log('Database connection test successful');
    }
});

module.exports = pool; 