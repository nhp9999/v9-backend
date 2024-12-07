const { body } = require('express-validator');

const declarationValidation = [
    body('object_type')
        .isIn(['HGD', 'DTTS', 'NLNN'])
        .withMessage('Loại đối tượng không hợp lệ'),
        
    body('bhxh_code')
        .matches(/^\d{10}$/)
        .withMessage('Mã BHXH không hợp lệ'),
        
    body('full_name')
        .trim()
        .notEmpty()
        .withMessage('Họ tên không được để trống')
        .isLength({ max: 100 })
        .withMessage('Họ tên không được quá 100 ký tự'),
        
    body('birth_date')
        .isISO8601()
        .withMessage('Ngày sinh không hợp lệ'),
        
    body('gender')
        .isIn(['Nam', 'Nữ'])
        .withMessage('Giới tính không hợp lệ'),
        
    body('cccd')
        .matches(/^\d{12}$/)
        .withMessage('CCCD không hợp lệ'),
        
    body('phone_number')
        .matches(/^0\d{9}$/)
        .withMessage('Số điện thoại không hợp lệ'),
        
    // ... thêm validation cho các trường khác
];

module.exports = {
    declarationValidation
}; 