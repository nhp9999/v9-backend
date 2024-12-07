const pool = require('../config/database');
const calculateActualAmount = require('../utils/calculateActualAmount');

// Get employee batches
const getEmployeeBatches = async (req, res) => {
    try {
        // Set headers để tránh cache
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const user = req.user;
        const batches = await pool.query(
            `SELECT * FROM declaration_batch 
             WHERE created_by = $1 
             ORDER BY created_at DESC`,
            [user.id]
        );

        res.json(batches.rows);
    } catch (error) {
        console.error('Error getting employee batches:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách đợt kê khai'
        });
    }
};

// Get batch by id
const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await pool.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );

        if (batch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        res.json(batch.rows[0]);
    } catch (error) {
        console.error('Error getting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thông tin đợt kê khai'
        });
    }
};

// Get declarations by batch id
const getDeclarationsByBatchId = async (req, res) => {
    try {
        // Set headers để tránh cache
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const { id } = req.params;
        const declarations = await pool.query(
            `SELECT * FROM declarations 
             WHERE batch_id = $1 
             ORDER BY created_at DESC`,
            [id]
        );

        res.json(declarations.rows);
    } catch (error) {
        console.error('Error getting declarations:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách kê khai'
        });
    }
};

// Create new batch
const createEmployeeBatch = async (req, res) => {
    try {
        const { name, month, year, object_type, service_type, department_code, notes } = req.body;
        const user = req.user;

        // Validate required fields
        if (!month || !year || !department_code || !object_type || !service_type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Validate month and year
        if (month < 1 || month > 12 || year < 2000) {
            return res.status(400).json({
                success: false, 
                message: 'Tháng hoặc năm không hợp lệ'
            });
        }

        // Validate service_type
        if (!['BHYT', 'BHXH'].includes(service_type)) {
            return res.status(400).json({
                success: false,
                message: 'Loại dịch vụ kê khai không hợp lệ'
            });
        }

        // Kiểm tra user có thuộc phòng ban không
        const userDeptCheck = await pool.query(
            'SELECT department_code FROM users WHERE id = $1 AND department_code = $2',
            [user.id, department_code]
        );

        if (!userDeptCheck.rows.length) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền tạo đợt kê khai cho phòng ban này'
            });
        }

        // Lấy số đợt cao nhất trong tháng của nhân viên theo loại đối tượng và dịch vụ
        const maxBatchResult = await pool.query(
            `SELECT MAX(batch_number) as max_batch 
             FROM declaration_batch 
             WHERE month = $1 AND year = $2 
             AND created_by = $3 
             AND object_type = $4
             AND service_type = $5`,
            [month, year, user.id, object_type, service_type]
        );

        // Tự động tăng số đợt
        const nextBatchNumber = (maxBatchResult.rows[0].max_batch || 0) + 1;

        // Tạo tên đợt tự động nếu không có
        const batchName = name || `Đợt ${nextBatchNumber} tháng ${month}/${year} - ${object_type} - ${service_type}`;

        // Tạo đợt mới trong transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Kiểm tra lại số đợt trước khi insert để tránh race condition
            const checkBatch = await client.query(
                `SELECT id FROM declaration_batch 
                 WHERE month = $1 AND year = $2 
                 AND created_by = $3 
                 AND object_type = $4 
                 AND service_type = $5
                 AND batch_number = $6`,
                [month, year, user.id, object_type, service_type, nextBatchNumber]
            );

            if (checkBatch.rows.length > 0) {
                throw new Error('Số đợt đã tồn tại, vui lòng thử lại');
            }

            const result = await client.query(
                `INSERT INTO declaration_batch 
                 (name, month, year, batch_number, department_code, object_type, service_type, notes, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [batchName, month, year, nextBatchNumber, department_code, object_type, service_type, notes, user.id]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Tạo đợt kê khai thành công',
                data: result.rows[0]
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo đợt kê khai',
            error: error.message
        });
    }
};

// Update batch
const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, month, year, batch_number, department_code, object_type, notes } = req.body;
        const user = req.user;

        // Kiểm tra đợt tồn tại
        const existingBatch = await pool.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );

        if (existingBatch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        // Cập nhật đợt
        const result = await pool.query(
            `UPDATE declaration_batch 
             SET name = $1, month = $2, year = $3, batch_number = $4, 
                 department_code = $5, object_type = $6, notes = $7, 
                 updated_by = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [name, month, year, batch_number, department_code, object_type, notes, user.id, id]
        );

        res.json({
            success: true,
            message: 'Cập nhật đợt kê khai thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật đợt kê khai'
        });
    }
};

// Delete batch
const deleteEmployeeBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        // Kiểm tra đợt tồn tại
        const batch = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );

        if (batch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        // Soft delete tất cả declarations của batch này
        await client.query(
            'UPDATE declarations SET deleted_at = CURRENT_TIMESTAMP WHERE batch_id = $1',
            [id]
        );

        // Xóa batch
        await client.query('DELETE FROM declaration_batch WHERE id = $1', [id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Xóa đợt kê khai thành công'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa đợt kê khai'
        });
    } finally {
        client.release();
    }
};

// Create declaration
const createDeclaration = async (req, res) => {
    const client = await pool.connect();
    let result;
    let isIdentityChanged = false;
    
    try {
        await client.query('BEGIN');

        const {
            batch_id, object_type, bhxh_code, full_name, birth_date,
            gender, cccd, phone_number, receipt_date, receipt_number,
            old_card_expiry_date, new_card_effective_date, months,
            plan, commune, hamlet, participant_number, hospital_code,
            isEdit, originalBhxhCode, originalCccd
        } = req.body;
        const user = req.user;

        // Validate dữ liệu đầu vào
        if (!batch_id || !bhxh_code || !full_name || !cccd || !phone_number || 
            !receipt_date || !months || !plan || !commune || !participant_number) {
            throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }

        // Validate format dữ liệu
        if (!/^\d{10}$/.test(bhxh_code)) {
            throw new Error('Mã BHXH phải có 10 chữ số');
        }

        if (!/^\d{12}$/.test(cccd)) {
            throw new Error('CCCD phải có 12 chữ số');
        }

        if (!/^\d{10}$/.test(phone_number)) {
            throw new Error('Số điện thoại phải có 10 chữ số');
        }

        // Kiểm tra đợt kê khai có tồn tại và đang mở không
        const batchCheck = await client.query(
            'SELECT status FROM declaration_batch WHERE id = $1 FOR UPDATE',
            [batch_id]
        );

        if (batchCheck.rows.length === 0) {
            throw new Error('Không tìm thấy đợt kê khai');
        }

        if (batchCheck.rows[0].status !== 'pending') {
            throw new Error('Đợt kê khai đã đóng');
        }

        const declarationCode = `${bhxh_code}-${batch_id}`;

        // Tính actual_amount
        const actual_amount = calculateActualAmount(
            object_type,
            participant_number,
            months
        );

        if (isEdit) {
            // Kiểm tra xem mã BHXH có thay đổi không
            const isBHXHChanged = bhxh_code !== originalBhxhCode;
            
            // Nếu mã BHXH thay đổi, kiểm tra trùng
            if (isBHXHChanged) {
                const existingBHXH = await client.query(
                    `SELECT id, full_name FROM declarations 
                    WHERE bhxh_code = $1 
                    AND batch_id = $2`,
                    [bhxh_code, batch_id]
                );

                if (existingBHXH.rows.length > 0) {
                    throw new Error(`Mã BHXH ${bhxh_code} đã được kê khai cho người tham gia ${existingBHXH.rows[0].full_name} trong đợt này`);
                }
            }

            // Kiểm tra trùng CCCD với các bản ghi khác
            const existingCCCD = await client.query(
                `SELECT id, full_name FROM declarations 
                WHERE cccd = $1 
                AND batch_id = $2 
                AND bhxh_code != $3`,
                [cccd, batch_id, originalBhxhCode]
            );

            if (existingCCCD.rows.length > 0) {
                throw new Error(`CCCD ${cccd} đã được kê khai cho người tham gia ${existingCCCD.rows[0].full_name} trong đợt này`);
            }

            // Nếu mã BHXH thay đổi, tạạạạạạạạạo bản ghi mới
            if (isBHXHChanged) {
                result = await client.query(
                    `INSERT INTO declarations (
                        declaration_code, user_id, batch_id, object_type,
                        bhxh_code, full_name, birth_date, gender, cccd,
                        phone_number, receipt_date, receipt_number,
                        old_card_expiry_date, new_card_effective_date,
                        months, plan, commune, hamlet,
                        participant_number, hospital_code, actual_amount,
                        status, created_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending', $22)
                    RETURNING *`,
                    [
                        declarationCode, user.id, batch_id, object_type,
                        bhxh_code.trim(), full_name.trim(), birth_date, gender, cccd,
                        phone_number, receipt_date, receipt_number?.trim(),
                        old_card_expiry_date, new_card_effective_date,
                        months, plan, commune, hamlet?.trim(),
                        participant_number, hospital_code, actual_amount,
                        user.id
                    ]
                );
            } else {
                // Cập nhật bản ghi hiện tại nếu không thay đổi mã BHXH
                result = await client.query(
                    `UPDATE declarations 
                    SET 
                        object_type = $1,
                        full_name = $2,
                        birth_date = $3,
                        gender = $4,
                        phone_number = $5,
                        receipt_date = $6,
                        receipt_number = $7,
                        old_card_expiry_date = $8,
                        new_card_effective_date = $9,
                        months = $10,
                        plan = $11,
                        commune = $12,
                        hamlet = $13,
                        participant_number = $14,
                        hospital_code = $15,
                        actual_amount = $16,
                        cccd = $17,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = $18
                    WHERE bhxh_code = $19 AND batch_id = $20
                    RETURNING *`,
                    [
                        object_type,
                        full_name.trim(),
                        birth_date,
                        gender,
                        phone_number,
                        receipt_date,
                        receipt_number?.trim(),
                        old_card_expiry_date,
                        new_card_effective_date,
                        months,
                        plan,
                        commune,
                        hamlet?.trim(),
                        participant_number,
                        hospital_code,
                        actual_amount,
                        cccd,
                        user.id,
                        originalBhxhCode,
                        batch_id
                    ]
                );
            }
        } else {
            // Kiểm tra trùng mã BHXH
            const existingBHXH = await client.query(
                `SELECT id, full_name FROM declarations 
                WHERE bhxh_code = $1 
                AND batch_id = $2`,
                [bhxh_code, batch_id]
            );

            if (existingBHXH.rows.length > 0) {
                throw new Error(`Mã BHXH ${bhxh_code} đã được kê khai cho người tham gia ${existingBHXH.rows[0].full_name} trong đợt này`);
            }

            // Kiểm tra trùng CCCD
            const existingCCCD = await client.query(
                `SELECT id, full_name FROM declarations 
                WHERE cccd = $1 
                AND batch_id = $2`,
                [cccd, batch_id]
            );

            if (existingCCCD.rows.length > 0) {
                throw new Error(`CCCD ${cccd} đã được kê khai cho người tham gia ${existingCCCD.rows[0].full_name} trong đợt này`);
            }

            // Tạo bản ghi mới
            result = await client.query(
                `INSERT INTO declarations (
                    declaration_code, user_id, batch_id, object_type,
                    bhxh_code, full_name, birth_date, gender, cccd,
                    phone_number, receipt_date, receipt_number,
                    old_card_expiry_date, new_card_effective_date,
                    months, plan, commune, hamlet,
                    participant_number, hospital_code, actual_amount,
                    status, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending', $22)
                RETURNING *`,
                [
                    declarationCode, user.id, batch_id, object_type,
                    bhxh_code.trim(), full_name.trim(), birth_date, gender, cccd,
                    phone_number, receipt_date, receipt_number?.trim(),
                    old_card_expiry_date, new_card_effective_date,
                    months, plan, commune, hamlet?.trim(),
                    participant_number, hospital_code, actual_amount,
                    user.id
                ]
            );

            // Cập nhật số lượng kê khai trong đợt
            await client.query(
                `UPDATE declaration_batch 
                SET total_declarations = total_declarations + 1,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = $1`,
                [batch_id]
            );
        }

        await client.query('COMMIT');

        let message = '';
        if (isEdit) {
            if (isIdentityChanged) {
                if (bhxh_code !== originalBhxhCode && cccd !== originalCccd) {
                    message = `Đã tạo kê khai mới với mã BHXH ${bhxh_code} và CCCD ${cccd}`;
                } else if (bhxh_code !== originalBhxhCode) {
                    message = `Đã tạo kê khai mới với mã BHXH ${bhxh_code}`;
                } else {
                    message = `Đã tạo kê khai mới với CCCD ${cccd}`;
                }
            } else {
                message = `Đã cập nhật thông tin kê khai cho mã BHXH ${bhxh_code}`;
            }
        } else {
            message = `Đã tạo kê khai mới với mã BHXH ${bhxh_code} và CCCD ${cccd}`;
        }

        res.json({
            success: true,
            message: message,
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create declaration error:', error);

        if (error.code === '23505') { // Unique violation
            res.status(400).json({
                success: false,
                message: 'Dữ liệu bị trùng lặp',
                error: error.detail
            });
        } else if (error.code === '23503') { // Foreign key violation
            res.status(400).json({
                success: false,
                message: 'Dữ liệu tham chiếu không tồn tại',
                error: error.detail
            });
        } else {
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi tạo kê khai',
                error: error.message
            });
        }
    } finally {
        client.release();
    }
};

// Delete declaration
const deleteDeclaration = async (req, res) => {
    try {
        const { id } = req.params;

        // Ly batch_id trước khi xóa
        const declaration = await pool.query(
            'SELECT batch_id FROM declarations WHERE id = $1',
            [id]
        );

        if (declaration.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kê khai'
            });
        }

        const batch_id = declaration.rows[0].batch_id;

        // Soft delete kê khai
        await pool.query(
            'UPDATE declarations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        // Cập nhật số lượng kê khai trong đợt
        await pool.query(
            `UPDATE declaration_batch 
             SET total_declarations = total_declarations - 1
             WHERE id = $1`,
            [batch_id]
        );

        res.json({
            success: true,
            message: 'Xóa kê khai thành công'
        });
    } catch (error) {
        console.error('Error deleting declaration:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa kê khai'
        });
    }
};

// Search BHXH information
const searchBHXH = async (req, res) => {
    try {
        const { bhxh_code, full_name, cccd, phone_number } = req.query;

        // Xây dựng câu query động
        let queryConditions = [];
        let queryParams = [];
        let paramCount = 1;

        if (bhxh_code) {
            queryConditions.push(`bhxh_code = $${paramCount}`);
            queryParams.push(bhxh_code);
            paramCount++;
        }

        if (full_name) {
            queryConditions.push(`LOWER(full_name) LIKE LOWER($${paramCount})`);
            queryParams.push(`%${full_name}%`);
            paramCount++;
        }

        if (cccd) {
            queryConditions.push(`cccd = $${paramCount}`);
            queryParams.push(cccd);
            paramCount++;
        }

        if (phone_number) {
            queryConditions.push(`phone_number = $${paramCount}`);
            queryParams.push(phone_number);
            paramCount++;
        }

        // Nếu không có điều kiện tìm kiếm
        if (queryConditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập ít nhất một điều kiện tìm kiếm'
            });
        }

        // Tìm thông tin mới nhất từ bảng declarations
        const result = await pool.query(
            `SELECT DISTINCT ON (bhxh_code)
                bhxh_code, full_name, birth_date, gender, cccd,
                phone_number, old_card_expiry_date, new_card_effective_date,
                months, plan, commune, hamlet, participant_number, hospital_code,
                object_type, receipt_date, receipt_number
             FROM declarations
             WHERE (${queryConditions.join(' OR ')})
             AND deleted_at IS NULL
             ORDER BY bhxh_code, created_at DESC`,
            queryParams
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin BHYT'
            });
        }

        // Format dates
        const data = result.rows[0];
        if (data.birth_date) {
            data.birth_date = data.birth_date.toISOString().split('T')[0];
        }
        if (data.old_card_expiry_date) {
            data.old_card_expiry_date = data.old_card_expiry_date.toISOString().split('T')[0];
        }
        if (data.new_card_effective_date) {
            data.new_card_effective_date = data.new_card_effective_date.toISOString().split('T')[0];
        }
        if (data.receipt_date) {
            data.receipt_date = data.receipt_date.toISOString().split('T')[0];
        }

        res.json({
            success: true,
            message: 'Tìm thấy thông tin BHYT',
            data: data
        });
    } catch (error) {
        console.error('Error searching BHXH:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tm kiếm thông tin BHYT'
        });
    }
};

module.exports = {
    getEmployeeBatches,
    getBatchById,
    getDeclarationsByBatchId,
    createEmployeeBatch,
    updateBatch,
    deleteEmployeeBatch,
    createDeclaration,
    deleteDeclaration,
    searchBHXH
}; 