-- Xóa tài khoản nhân viên cũ nếu tồn tại
DELETE FROM users WHERE username = 'NV089186001207';

-- Tạo tài khoản nhân viên mới với password đã được hash (password: 123456)
INSERT INTO users (
    username,
    password,
    full_name,
    role,
    department_code,
    unit,
    status
) VALUES (
    'NV089186001207',
    '$2b$10$FA6X2HQ4L.kFa4OYLg8vE.GAWhtACvTH.aAEdbcZOeX0P2IFh/zvy',
    'Nhân viên Demo',
    'employee',
    'NV089186001207',
    'An Hảo',
    'active'
);