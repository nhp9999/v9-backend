-- Tạo bảng declarations
CREATE TABLE IF NOT EXISTS declarations (
    id SERIAL PRIMARY KEY,
    declaration_code VARCHAR(20),
    user_id INTEGER NOT NULL REFERENCES users(id),
    batch_id INTEGER NOT NULL REFERENCES batches(id),
    object_type VARCHAR(10),
    bhxh_code VARCHAR(10),
    full_name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(5),
    cccd VARCHAR(12),
    phone_number VARCHAR(10),
    receipt_date DATE,
    receipt_number VARCHAR(7),
    old_card_expiry_date DATE,
    new_card_effective_date DATE,
    months INTEGER,
    plan VARCHAR(2),
    commune VARCHAR(50),
    hamlet VARCHAR(50),
    participant_number VARCHAR(2),
    hospital_code VARCHAR(20),
    status VARCHAR(10) DEFAULT 'pending',
    rejection_reason TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng declaration_history
CREATE TABLE IF NOT EXISTS declaration_history (
    id SERIAL PRIMARY KEY,
    declaration_id INTEGER NOT NULL REFERENCES declarations(id),
    action VARCHAR(50) NOT NULL,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_declarations_user_id ON declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_batch_id ON declarations(batch_id);
CREATE INDEX IF NOT EXISTS idx_declarations_status ON declarations(status);
CREATE INDEX IF NOT EXISTS idx_declarations_created_by ON declarations(created_by);
CREATE INDEX IF NOT EXISTS idx_declarations_updated_by ON declarations(updated_by);
CREATE INDEX IF NOT EXISTS idx_declarations_declaration_code ON declarations(declaration_code);
CREATE INDEX IF NOT EXISTS idx_declarations_cccd ON declarations(cccd);
CREATE INDEX IF NOT EXISTS idx_declaration_history_declaration_id ON declaration_history(declaration_id); 