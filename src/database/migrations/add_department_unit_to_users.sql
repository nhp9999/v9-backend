-- Thêm các cột mới vào bảng users nếu chưa tồn tại
DO $$ 
BEGIN
    -- Thêm cột department_code nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department_code') THEN
        ALTER TABLE users ADD COLUMN department_code VARCHAR(50);
    END IF;

    -- Thêm cột unit nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unit') THEN
        ALTER TABLE users ADD COLUMN unit VARCHAR(100);
    END IF;
END $$; 