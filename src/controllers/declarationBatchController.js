const pool = require('../config/database');

const declarationBatchController = {
    async getAllBatches(req, res) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM declaration_batch ORDER BY created_at DESC'
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting batches:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy danh sách đợt kê khai'
            });
        } finally {
            client.release();
        }
    },

    async getBatchById(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const result = await client.query(
                'SELECT * FROM declaration_batch WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Không tìm thấy đợt kê khai'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error getting batch:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy thông tin đợt kê khai'
            });
        } finally {
            client.release();
        }
    },

    async createBatch(req, res) {
        const client = await pool.connect();
        try {
            const { name, month, year, batch_number, department_code, start_date, end_date } = req.body;
            const userId = req.user.id;

            // Kiểm tra dữ liệu đầu vào
            if (!name || !month || !year || !batch_number || !department_code || !start_date || !end_date) {
                return res.status(400).json({
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
            }

            // Kiểm tra đợt kê khai đã tồn tại
            const existingBatch = await client.query(
                'SELECT * FROM declaration_batch WHERE month = $1 AND year = $2 AND batch_number = $3 AND department_code = $4',
                [month, year, batch_number, department_code]
            );

            if (existingBatch.rows.length > 0) {
                return res.status(400).json({
                    message: 'Đợt kê khai này đã tồn tại'
                });
            }

            const result = await client.query(
                `INSERT INTO declaration_batch (
                    name, month, year, batch_number, department_code,
                    start_date, end_date, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) 
                RETURNING *`,
                [name, month, year, batch_number, department_code, start_date, end_date, userId]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating batch:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi tạo đợt kê khai'
            });
        } finally {
            client.release();
        }
    },

    async updateBatch(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { name, start_date, end_date, status } = req.body;
            const userId = req.user.id;

            const result = await client.query(
                `UPDATE declaration_batch 
                SET name = $1, start_date = $2, end_date = $3, 
                    status = $4, updated_at = CURRENT_TIMESTAMP, 
                    updated_by = $5
                WHERE id = $6 
                RETURNING *`,
                [name, start_date, end_date, status, userId, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Không tìm thấy đợt kê khai'
                });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating batch:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi cập nhật đợt kê khai'
            });
        } finally {
            client.release();
        }
    },

    async deleteBatch(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;

            // Kiểm tra xem có declarations nào không
            const declarations = await client.query(
                'SELECT COUNT(*) FROM declarations WHERE batch_id = $1',
                [id]
            );

            if (parseInt(declarations.rows[0].count) > 0) {
                return res.status(400).json({
                    message: 'Không thể xóa đợt kê khai đã có dữ liệu'
                });
            }

            const result = await client.query(
                'DELETE FROM declaration_batch WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Không tìm thấy đợt kê khai'
                });
            }

            res.json({
                message: 'Đã xóa đợt kê khai thành công'
            });
        } catch (error) {
            console.error('Error deleting batch:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi xóa đợt kê khai'
            });
        } finally {
            client.release();
        }
    }
};

module.exports = declarationBatchController; 