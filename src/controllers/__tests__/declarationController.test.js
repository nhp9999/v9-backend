const declarationController = require('../declarationController');
const pool = require('../../config/database');

jest.mock('../../config/database');

describe('declarationController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            query: {},
            body: {},
            user: { id: 1 }
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('list', () => {
        it('should return declarations list with pagination', async () => {
            const mockDeclarations = [
                { id: 1, full_name: 'Test User' }
            ];
            
            pool.query.mockResolvedValueOnce({ rows: mockDeclarations })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] });

            await declarationController.list(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                data: mockDeclarations,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1
                }
            });
        });
    });

    // ... thêm tests cho các methods khác
}); 