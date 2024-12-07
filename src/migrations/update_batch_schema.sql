-- Xóa bảng cũ
DROP TABLE IF EXISTS declarations CASCADE;
DROP TABLE IF EXISTS declaration_batch CASCADE;

-- Tạo lại bảng declaration_batch với schema mới
CREATE TABLE declaration_batch (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    batch_number INTEGER NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    object_type VARCHAR(10) CHECK (object_type IN ('HGD', 'DTTS', 'NLNN')) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
    total_declarations INTEGER DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year, batch_number, department_code)
);

-- Tạo lại bảng declarations
CREATE TABLE declarations (
    id SERIAL PRIMARY KEY,
    declaration_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id),
    batch_id INTEGER REFERENCES declaration_batch(id),
    object_type VARCHAR(10) CHECK (object_type IN ('HGD', 'DTTS', 'NLNN')) NOT NULL,
    bhxh_code VARCHAR(10) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(5) CHECK (gender IN ('Nam', 'Nữ')) NOT NULL,
    cccd VARCHAR(12) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    receipt_date DATE NOT NULL,
    receipt_number VARCHAR(7) NOT NULL,
    old_card_expiry_date DATE,
    new_card_effective_date DATE NOT NULL,
    months VARCHAR(2) CHECK (months IN ('3', '6', '12')) NOT NULL,
    plan VARCHAR(2) CHECK (plan IN ('TM', 'ON')) NOT NULL,
    commune VARCHAR(50) NOT NULL,
    hamlet VARCHAR(50) NOT NULL,
    participant_number VARCHAR(2) CHECK (participant_number IN ('1', '2', '3', '4', '5+')) NOT NULL,
    hospital_code VARCHAR(20) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 