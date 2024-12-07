-- Xóa các bảng cũ
DROP TABLE IF EXISTS declarations;
DROP TABLE IF EXISTS declaration_batch;

-- Tạo bảng declaration_batch
CREATE TABLE IF NOT EXISTS declaration_batch (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    batch_number INTEGER NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Tạo bảng declarations
CREATE TABLE IF NOT EXISTS declarations (
    id SERIAL PRIMARY KEY,
    declaration_code CHARACTER VARYING(20),
    user_id INTEGER,
    batch_id INTEGER REFERENCES declaration_batch(id),
    object_type CHARACTER VARYING(10),
    bhxh_code CHARACTER VARYING(10),
    full_name CHARACTER VARYING(100),
    birth_date DATE,
    gender CHARACTER VARYING(5),
    cccd CHARACTER VARYING(12),
    phone_number CHARACTER VARYING(10),
    receipt_date DATE,
    receipt_number CHARACTER VARYING(7),
    old_card_expiry_date DATE,
    new_card_effective_date DATE,
    months INTEGER,
    plan CHARACTER VARYING(2),
    commune CHARACTER VARYING(50),
    hamlet CHARACTER VARYING(50),
    participant_number CHARACTER VARYING(2),
    hospital_code CHARACTER VARYING(20),
    status CHARACTER VARYING(10) DEFAULT 'pending',
    rejection_reason TEXT,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 