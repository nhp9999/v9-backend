-- Thêm cột actual_amount vào bảng declarations
ALTER TABLE declarations
ADD COLUMN actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0; 