const pool = require('../config/database');

const batchController = {
    // Lấy danh sách các batch
    async getBatches(req, res) {
        const client = await pool.connect();
        try {
            const userDepartmentCode = req.user.department_code;

            // Kiểm tra department_code
            if (!userDepartmentCode) {
                return res.status(400).json({
                    message: 'Không tìm thấy thông tin đơn vị. Vui lòng liên hệ quản trị viên.'
                });
            }

            console.log('Lấy danh sách batch cho đơn vị:', userDepartmentCode);

            const result = await client.query(`
                SELECT b.*, 
                       COUNT(d.id) as total_declarations
                FROM batches b
                LEFT JOIN declarations d ON b.id = d.batch_id
                WHERE b.department_code = $1
                GROUP BY b.id
                ORDER BY b.created_at DESC
            `, [userDepartmentCode]);
            
            res.json(result.rows);
        } catch (error) {
            console.error('Get batches error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy danh sách batch',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Tạo batch mới
    async create(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { month, year, batch_number, department_code } = req.body;

            // Kiểm tra xem batch_number đã tồn tại chưa
            const existingBatch = await client.query(
                'SELECT * FROM batches WHERE month = $1 AND year = $2 AND batch_number = $3 AND department_code = $4',
                [month, year, batch_number, department_code]
            );

            if (existingBatch.rows.length > 0) {
                // Nếu đã tồn tại, tìm số batch tiếp theo
                const nextNumberResult = await client.query(
                    'SELECT COALESCE(MAX(batch_number), 0) + 1 as next_number FROM batches WHERE month = $1 AND year = $2 AND department_code = $3',
                    [month, year, department_code]
                );
                
                const suggestedNumber = nextNumberResult.rows[0].next_number;
                
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: 'Số đợt đã tồn tại',
                    suggestedNumber,
                    error: 'DUPLICATE_BATCH_NUMBER'
                });
            }

            // Tạo batch mới
            const result = await client.query(
                `INSERT INTO batches (
                    month, year, batch_number, 
                    department_code, created_by, status
                ) VALUES ($1, $2, $3, $4, $5, 'pending') 
                RETURNING *`,
                [month, year, batch_number, department_code, req.user.id]
            );

            await client.query('COMMIT');
            res.status(201).json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create batch error:', error);
            
            // Xử lý các loại lỗi khác nhau
            if (error.code === '23505') { // Unique violation
                res.status(400).json({
                    message: 'Số đợt đã tồn tại trong tháng/năm này',
                    error: 'DUPLICATE_BATCH_NUMBER'
                });
            } else {
                res.status(500).json({
                    message: 'Có lỗi xảy ra khi tạo đợt kê khai mới',
                    error: error.message
                });
            }
        } finally {
            client.release();
        }
    },

    // Cập nhật batch
    async update(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { status } = req.body;
            const result = await client.query(
                'UPDATE batches SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy batch' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Update batch error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật batch',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Xóa batch
    async delete(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const result = await client.query('DELETE FROM batches WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy batch' });
            }
            res.json({ message: 'Đã xóa batch thành công' });
        } catch (error) {
            console.error('Delete batch error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi xóa batch',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Submit batch
    async submit(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { id } = req.params;
            
            // Kiểm tra batch tồn tại
            const batchResult = await client.query(
                'SELECT * FROM batches WHERE id = $1',
                [id]
            );
            
            if (batchResult.rows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy đợt kê khai' });
            }

            const batch = batchResult.rows[0];
            
            // Kiểm tra trạng thái
            if (batch.status !== 'pending') {
                return res.status(400).json({ message: 'Đợt kê khai không ở trạng thái chờ gửi' });
            }

            // Kiểm tra có kê khai nào không
            const declarationsResult = await client.query(
                'SELECT COUNT(*) FROM declarations WHERE batch_id = $1',
                [id]
            );

            if (parseInt(declarationsResult.rows[0].count) === 0) {
                return res.status(400).json({ message: 'Đợt kê khai chưa có kê khai nào' });
            }

            // Cập nhật trạng thái batch
            const result = await client.query(`
                UPDATE batches 
                SET status = 'submitted',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [id]);

            // Cập nhật trạng thái các kê khai
            await client.query(`
                UPDATE declarations 
                SET status = 'submitted',
                    updated_at = CURRENT_TIMESTAMP
                WHERE batch_id = $1 AND status = 'pending'
            `, [id]);

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Submit batch error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi gửi đợt kê khai',
                error: error.message
            });
        } finally {
            client.release();
        }
    },

    // Lấy số batch tiếp theo
    async getNextBatchNumber(req, res) {
        const client = await pool.connect();
        try {
            const { month, year } = req.query;
            
            // Kiểm tra tham số đầu vào
            if (!month || !year) {
                return res.status(400).json({
                    message: 'Thiếu thông tin tháng/năm'
                });
            }

            const result = await client.query(
                'SELECT COALESCE(MAX(batch_number), 0) + 1 as next_number FROM batches WHERE month = $1 AND year = $2',
                [month, year]
            );
            
            res.json({ nextNumber: result.rows[0].next_number });
        } catch (error) {
            console.error('Get next batch number error:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy số đợt tiếp theo',
                error: error.message
            });
        } finally {
            client.release();
        }
    }
};

module.exports = batchController; 