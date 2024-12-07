-- Xóa các index trước
DROP INDEX IF EXISTS idx_declarations_user_id;
DROP INDEX IF EXISTS idx_declarations_batch_id;
DROP INDEX IF EXISTS idx_declarations_status;
DROP INDEX IF EXISTS idx_declarations_created_by;
DROP INDEX IF EXISTS idx_declarations_updated_by;
DROP INDEX IF EXISTS idx_declarations_declaration_code;
DROP INDEX IF EXISTS idx_declarations_cccd;
DROP INDEX IF EXISTS idx_declaration_history_declaration_id;

-- Xóa bảng declaration_history trước vì nó phụ thuộc vào declarations
DROP TABLE IF EXISTS declaration_history;

-- Xóa bảng declarations
DROP TABLE IF EXISTS declarations; 