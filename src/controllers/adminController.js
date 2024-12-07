const pool = require('../config/database');

const adminController = {
    async getPendingDeclarations(req, res) {
        const client = await pool.connect();
        console.log('=== BẮT ĐẦU LẤY DANH SÁCH DECLARATIONS CHỜ DUYỆT ===');
        try {
            console.log('Đang thực hiện truy vấn...');
            const result = await client.query(
                `SELECT 
                    d.id,
                    d.declaration_code,
                    d.batch_id,
                    d.object_type,
                    d.bhxh_code,
                    d.full_name,
                    d.birth_date,
                    d.gender,
                    d.cccd,
                    d.phone_number,
                    d.receipt_date,
                    d.receipt_number,
                    d.old_card_expiry_date,
                    d.new_card_effective_date,
                    d.months,
                    d.plan,
                    d.commune,
                    d.hamlet,
                    d.participant_number,
                    d.hospital_code,
                    d.status,
                    d.created_at,
                    d.created_by,
                    d.updated_at,
                    d.updated_by,
                    u.username as creator_name,
                    b.name as batch_name,
                    b.start_date,
                    b.end_date
                FROM declarations d
                JOIN users u ON d.created_by = u.id
                JOIN declaration_batch b ON d.batch_id = b.id
                WHERE d.status = 'pending'
                ORDER BY d.created_at DESC`
            );

            console.log('Kết quả truy vấn:', {
                totalDeclarations: result.rows.length,
                declarations: result.rows.map(d => ({
                    id: d.id,
                    declaration_code: d.declaration_code,
                    full_name: d.full_name,
                    status: d.status,
                    creator: d.creator_name,
                    batch: d.batch_name
                }))
            });

            res.json(result.rows);
        } catch (error) {
            console.error('=== LỖI KHI LẤY DANH SÁCH DECLARATIONS ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                position: error.position,
                stack: error.stack,
                query: error.query
            });

            let errorMessage = 'Có lỗi xảy ra khi lấy danh sách declarations';
            let statusCode = 500;

            if (error.code === '42P01') { // Undefined table
                errorMessage = 'Bảng declarations không tồn tại';
                console.error('LỖI: Bảng declarations không tồn tại trong database');
            } else if (error.code === '42703') { // Undefined column
                errorMessage = 'Lỗi cấu trúc dữ liệu';
                console.error('LỖI: Một hoặc nhiều cột không tồn tại trong bảng');
            }

            res.status(statusCode).json({
                status: 'error',
                type: error.code || 'UNKNOWN_ERROR',
                message: errorMessage
            });
        } finally {
            console.log('=== KẾT THÚC LẤY DANH SÁCH DECLARATIONS ===\n');
            client.release();
        }
    },

    async approveDeclaration(req, res) {
        const client = await pool.connect();
        console.log('=== BẮT ĐẦU DUYỆT DECLARATION ===');
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const userId = req.user.id;

            console.log('Thông tin duyệt:', {
                declarationId: id,
                approverId: userId
            });

            // Kiểm tra declaration tồn tại và đang ở trạng thái pending
            const declaration = await client.query(
                'SELECT * FROM declarations WHERE id = $1 AND status = $2',
                [id, 'pending']
            );

            if (declaration.rows.length === 0) {
                console.log('Declaration không tồn tại hoặc không ở trạng thái chờ duyệt');
                return res.status(404).json({
                    message: 'Không tìm thấy declaration hoặc declaration không ở trạng thái chờ duyệt'
                });
            }

            // Cập nhật trạng thái
            const result = await client.query(
                `UPDATE declarations 
                SET 
                    status = 'approved',
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $1
                WHERE id = $2
                RETURNING *`,
                [userId, id]
            );

            await client.query('COMMIT');
            console.log('Declaration đã được duyệt thành công:', result.rows[0]);

            res.json({
                success: true,
                message: 'Đã duyệt declaration thành công',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('=== LỖI KHI DUYỆT DECLARATION ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                stack: error.stack
            });

            res.status(500).json({
                status: 'error',
                type: error.code || 'UNKNOWN_ERROR',
                message: 'Có lỗi xảy ra khi duyệt declaration'
            });
        } finally {
            if (client) {
                try {
                    await client.release();
                    console.log('Đã giải phóng kết nối database');
                } catch (releaseError) {
                    console.error('Lỗi khi giải phóng kết nối:', releaseError);
                }
            }
            console.log('=== KẾT THÚC DUYỆT DECLARATION ===\n');
        }
    },

    async rejectDeclaration(req, res) {
        const client = await pool.connect();
        console.log('=== BẮT ĐẦU TỪ CHỐI DECLARATION ===');
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.id;

            console.log('Thông tin từ chối:', {
                declarationId: id,
                rejecterId: userId,
                reason: reason
            });

            if (!reason) {
                console.log('Thiếu lý do từ chối');
                return res.status(400).json({
                    message: 'Vui lòng cung cấp lý do từ chối'
                });
            }

            // Kiểm tra declaration tồn tại và đang ở trạng thái pending
            const declaration = await client.query(
                'SELECT * FROM declarations WHERE id = $1 AND status = $2',
                [id, 'pending']
            );

            if (declaration.rows.length === 0) {
                console.log('Declaration không tồn tại hoặc không ở trạng thái chờ duyệt');
                return res.status(404).json({
                    message: 'Không tìm thấy declaration hoặc declaration không ở trạng thái chờ duyệt'
                });
            }

            // Cập nhật trạng thái
            const result = await client.query(
                `UPDATE declarations 
                SET 
                    status = 'rejected',
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $1,
                    rejection_reason = $2
                WHERE id = $3
                RETURNING *`,
                [userId, reason, id]
            );

            await client.query('COMMIT');
            console.log('Declaration đã bị từ chối:', result.rows[0]);

            res.json({
                success: true,
                message: 'Đã từ chối declaration',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('=== LỖI KHI TỪ CHỐI DECLARATION ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                stack: error.stack
            });

            res.status(500).json({
                status: 'error',
                type: error.code || 'UNKNOWN_ERROR',
                message: 'Có lỗi xảy ra khi từ chối declaration'
            });
        } finally {
            if (client) {
                try {
                    await client.release();
                    console.log('Đã giải phóng kết nối database');
                } catch (releaseError) {
                    console.error('Lỗi khi giải phóng kết nối:', releaseError);
                }
            }
            console.log('=== KẾT THÚC TỪ CHỐI DECLARATION ===\n');
        }
    },

    getDashboardStats: async (req, res) => {
        const client = await pool.connect();
        console.log('=== BẮT ĐẦU LẤY THỐNG KÊ DASHBOARD ===');
        try {
            console.log('Đang lấy tổng số người dùng...');
            const userCountResult = await client.query('SELECT COUNT(*) as total FROM users');
            console.log('Kết quả tổng số người dùng:', userCountResult.rows[0]);
            
            console.log('Đang lấy thống kê kê khai...');
            const declarationStatsResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
                FROM declarations
            `);
            console.log('Kết quả thống kê kê khai:', declarationStatsResult.rows[0]);

            console.log('Đang lấy thống kê theo tháng...');
            const monthlyStatsResult = await client.query(`
                SELECT 
                    EXTRACT(MONTH FROM created_at) as month,
                    COUNT(*) as count
                FROM declarations
                WHERE created_at >= NOW() - INTERVAL '6 months'
                GROUP BY EXTRACT(MONTH FROM created_at)
                ORDER BY month ASC
            `);
            console.log('Kết quả thống kê theo tháng:', monthlyStatsResult.rows);

            const stats = {
                totalUsers: parseInt(userCountResult.rows[0].total),
                totalDeclarations: parseInt(declarationStatsResult.rows[0].total),
                pendingDeclarations: parseInt(declarationStatsResult.rows[0].pending),
                approvedDeclarations: parseInt(declarationStatsResult.rows[0].approved),
                rejectedDeclarations: parseInt(declarationStatsResult.rows[0].rejected),
                monthlyStats: monthlyStatsResult.rows.map(row => ({
                    month: parseInt(row.month),
                    declarations: parseInt(row.count)
                }))
            };

            console.log('Dữ liệu thống kê cuối cùng:', stats);
            res.json(stats);
        } catch (error) {
            console.error('=== LỖI KHI LẤY THỐNG KÊ DASHBOARD ===');
            console.error('Chi tiết lỗi:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                position: error.position,
                stack: error.stack,
                query: error.query
            });

            let errorMessage = 'Có lỗi xảy ra khi lấy thống kê dashboard';
            let statusCode = 500;

            if (error.code === '42P01') { // Undefined table
                errorMessage = 'Bảng không tồn tại trong database';
                console.error('LỖI: Một hoặc nhiều bảng không tồn tại trong database');
            } else if (error.code === '42703') { // Undefined column
                errorMessage = 'Lỗi cấu trúc dữ liệu';
                console.error('LỖI: Một hoặc nhiều cột không tồn tại trong bảng');
            }

            res.status(statusCode).json({
                status: 'error',
                type: error.code || 'UNKNOWN_ERROR',
                message: errorMessage
            });
        } finally {
            console.log('=== KẾT THÚC LẤY THỐNG KÊ DASHBOARD ===\n');
            client.release();
        }
    },

    async getDashboardStats(req, res) {
        const client = await pool.connect();
        try {
            const stats = await client.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
                    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
                    COUNT(*) as total_count
                FROM declarations
                WHERE deleted_at IS NULL
            `);

            res.json(stats.rows[0]);
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            res.status(500).json({
                message: 'Có lỗi xảy ra khi lấy thống kê'
            });
        } finally {
            client.release();
        }
    }
};

module.exports = adminController; 