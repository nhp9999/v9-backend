-- Thêm cột unit vào bảng users nếu chưa tồn tại
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'unit') THEN
        ALTER TABLE users ADD COLUMN unit VARCHAR(100);
    END IF;
END $$; 