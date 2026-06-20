const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên tài khoản'],
    unique: true, // Không cho phép trùng tên tài khoản trong database
    trim: true,
    lowercase: true // Tự động chuyển về chữ thường để tránh nhầm lẫn
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không đúng định dạng']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  isVerified: {
    type: Boolean,
    default: false // Mặc định đăng ký xong phải xác thực mới được xài
  },
  otpCode: {
    type: String
  },
  otpExpires: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);