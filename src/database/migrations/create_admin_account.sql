-- Xóa tài khoản admin cũ nếu tồn tại
DELETE FROM users WHERE username = 'admin';

-- Tạo tài khoản admin mới với password đã được hash (password: admin123)
INSERT INTO users (
    username,
    password,
    full_name,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    'admin',
    '$2b$10$5J5Cmf/Tn6Qj7x7YF4YtPO5jFB8Gg2M7TTt0LUGGVxZwqSgU2Rime',
    'Administrator',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 