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
    batch_id INTEGER REFERENCES declaration_batch(id),
    title VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    reject_reason TEXT
); 