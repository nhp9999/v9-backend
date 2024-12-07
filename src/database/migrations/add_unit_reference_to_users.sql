-- Thêm cột unit_id vào bảng users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id);

-- Tạo index cho unit_id
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);

-- Cập nhật unit_id cho các user hiện tại dựa vào unit name
WITH unit_lookup AS (
    SELECT id FROM units WHERE name = 'An Hảo' LIMIT 1
)
UPDATE users 
SET unit_id = (SELECT id FROM unit_lookup)
WHERE unit = 'An Hảo'; 