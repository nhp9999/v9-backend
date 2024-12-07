-- Tạo bảng declaration_batch
CREATE TABLE IF NOT EXISTS declaration_batch (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    batch_number INTEGER NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    object_type VARCHAR(10),
    notes TEXT,
    status VARCHAR(10) DEFAULT 'pending',
    total_declarations INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_declaration_batch_created_by ON declaration_batch(created_by);
CREATE INDEX IF NOT EXISTS idx_declaration_batch_status ON declaration_batch(status);
CREATE INDEX IF NOT EXISTS idx_declaration_batch_month_year ON declaration_batch(month, year);
CREATE INDEX IF NOT EXISTS idx_declaration_batch_object_type ON declaration_batch(object_type);
CREATE INDEX IF NOT EXISTS idx_declaration_batch_department ON declaration_batch(department_code);