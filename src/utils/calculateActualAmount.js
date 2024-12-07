/**
 * Tính số tiền phải đóng dựa trên loại đối tượng và số người tham gia
 * @param {string} objectType - Loại đối tượng (HGD, DTTS, NLNN)
 * @param {string} participantNumber - Số người tham gia (1, 2, 3, 4, 5+)
 * @param {string} months - Số tháng đóng (3, 6, 12)
 * @returns {number} Số tiền phải đóng
 */
const calculateActualAmount = (objectType, participantNumber, months) => {
    const baseAmount = 2340000;
    const baseRate = 0.045;
    
    // Chuyển đổi months từ string sang number
    const numMonths = parseInt(months);
    
    // Tính toán theo đối tượng và số người tham gia
    switch(objectType) {
        case 'HGD':
            switch(participantNumber) {
                case '1':
                    return baseAmount * baseRate * numMonths;
                case '2':
                    return baseAmount * baseRate * 0.7 * numMonths; // Giảm 30%
                case '3':
                    return baseAmount * baseRate * 0.6 * numMonths; // Giảm 40%
                case '4':
                    return baseAmount * baseRate * 0.5 * numMonths; // Giảm 50%
                default: // '5+'
                    return baseAmount * baseRate * 0.4 * numMonths; // Giảm 60%
            }
        case 'DTTS':
            // Mặc định người thứ 1: 2.340.000×4,5%×(100%-70%)
            return baseAmount * baseRate * 0.3 * numMonths;
        case 'NLNN':
            // Mặc định người thứ 1: 2.340.000×4,5%×(100%-30%)
            return baseAmount * baseRate * 0.7 * numMonths;
        default:
            return 0;
    }
};

module.exports = calculateActualAmount; 