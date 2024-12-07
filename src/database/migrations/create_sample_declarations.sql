-- Tạo batch mẫu
INSERT INTO batches (month, year, batch_number, status, department_code)
VALUES 
    (1, 2024, 1, 'active', 'NV089186001207'),
    (1, 2024, 2, 'active', 'NV089186001207'),
    (1, 2024, 3, 'active', 'NV089186001207')
ON CONFLICT DO NOTHING;

-- Tạo declarations mẫu
WITH batch_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn 
    FROM batches 
    WHERE department_code = 'NV089186001207'
    LIMIT 3
),
user_id AS (
    SELECT id FROM users WHERE username = 'NV089186001207' LIMIT 1
)
INSERT INTO declarations (
    declaration_code,
    user_id,
    batch_id,
    object_type,
    bhxh_code,
    full_name,
    birth_date,
    gender,
    cccd,
    phone_number,
    receipt_date,
    receipt_number,
    old_card_expiry_date,
    new_card_effective_date,
    months,
    plan,
    commune,
    hamlet,
    participant_number,
    hospital_code,
    status,
    created_by,
    updated_by
)
SELECT 
    CASE 
        WHEN b.rn = 1 THEN 'DK630779'
        WHEN b.rn = 2 THEN 'DK276881'
        WHEN b.rn = 3 THEN 'DK498787'
    END,
    (SELECT id FROM user_id),
    b.id,
    'DTTS',
    CASE 
        WHEN b.rn = 1 THEN '444444444'
        WHEN b.rn = 2 THEN '444444444'
        WHEN b.rn = 3 THEN '444444444'
    END,
    CASE 
        WHEN b.rn = 1 THEN 'dsadsad5'
        WHEN b.rn = 2 THEN 'dsadsadsa'
        WHEN b.rn = 3 THEN 'dsadsad5'
    END,
    CASE 
        WHEN b.rn = 1 THEN '2024-12-05'
        WHEN b.rn = 2 THEN '2024-12-07'
        WHEN b.rn = 3 THEN '2024-12-06'
    END,
    'Nữ',
    CASE 
        WHEN b.rn = 1 THEN '444444444444'
        WHEN b.rn = 2 THEN '777777777777'
        WHEN b.rn = 3 THEN '777777777777'
    END,
    '0834697548',
    CASE 
        WHEN b.rn = 1 THEN '2024-12-28'
        WHEN b.rn = 2 THEN '2024-12-19'
        WHEN b.rn = 3 THEN '2024-12-03'
    END,
    CASE 
        WHEN b.rn = 1 THEN 'ggdgdg'
        WHEN b.rn = 2 THEN '432432'
        WHEN b.rn = 3 THEN '4564645'
    END,
    CASE 
        WHEN b.rn = 1 THEN '2024-12-06'
        WHEN b.rn = 2 THEN '2024-12-14'
        WHEN b.rn = 3 THEN '2024-12-05'
    END,
    CASE 
        WHEN b.rn = 1 THEN '2024-12-06'
        WHEN b.rn = 2 THEN '2024-12-14'
        WHEN b.rn = 3 THEN '2024-12-05'
    END,
    CASE 
        WHEN b.rn = 1 THEN 3
        WHEN b.rn = 2 THEN 6
        WHEN b.rn = 3 THEN 6
    END,
    'TM',
    'dsfdsfsfs',
    CASE 
        WHEN b.rn = 1 THEN 'dsdsfsds'
        WHEN b.rn = 2 THEN '4323423'
        WHEN b.rn = 3 THEN 'dsdsfsds'
    END,
    '1',
    CASE 
        WHEN b.rn = 1 THEN 'ffffffffff'
        WHEN b.rn = 2 THEN 'ffffffff'
        WHEN b.rn = 3 THEN 'dsfsdsds'
    END,
    'approved',
    (SELECT id FROM user_id),
    (SELECT id FROM user_id)
FROM batch_ids b
WHERE EXISTS (SELECT 1 FROM user_id); 