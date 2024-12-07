-- Add updated_by column to declarations table
ALTER TABLE declarations
ADD COLUMN updated_by INTEGER REFERENCES users(id),
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_by and updated_at columns to batches table
ALTER TABLE batches
ADD COLUMN updated_by INTEGER REFERENCES users(id),
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; 