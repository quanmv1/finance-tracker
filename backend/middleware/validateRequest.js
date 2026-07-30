const { body, validationResult } = require('express-validator');

// Middleware để xử lý lỗi validation và trả về response
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }
  next();
};

// ====== VALIDATION RULES REGISTRATION ======
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Tên tài khoản phải từ 3-20 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên tài khoản chỉ được chứa chữ, số và dấu gạch dưới'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không đúng định dạng')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .isLength({ max: 50 })
    .withMessage('Mật khẩu không được vượt quá 50 ký tự')
    .matches(/[A-Z]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .matches(/[0-9]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ số'),
  
  handleValidationErrors
];

// ====== VALIDATION RULES LOGIN ======
const validateLogin = [
  body('credential')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập tài khoản hoặc email'),
  
  body('password')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu'),
  
  handleValidationErrors
];

// ====== VALIDATION RULES VERIFY OTP ======
const validateVerifyOtp = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không đúng định dạng')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải gồm 6 chữ số')
    .isNumeric()
    .withMessage('Mã OTP chỉ được chứa chữ số'),
  
  handleValidationErrors
];

// ====== VALIDATION RULES TRANSACTION ======
const validateTransaction = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tiêu đề phải từ 2-100 ký tự'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Số tiền phải lớn hơn 0'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Loại giao dịch phải là income hoặc expense'),
  
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Danh mục phải từ 1-50 ký tự'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Ngày không đúng định dạng'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateTransaction,
  handleValidationErrors
};
