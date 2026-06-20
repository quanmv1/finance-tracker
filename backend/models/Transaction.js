const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu ID của MongoDB
    ref: 'User', // Liên kết tới bảng User
    required: true
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề giao dịch'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền']
  },
  type: {
    type: String,
    enum: ['income', 'expense'], // Chỉ cho phép nhập 1 trong 2 giá trị này
    required: [true, 'Vui lòng chọn loại giao dịch (thu nhập hoặc chi tiêu)']
  },
  category: {
    type: String,
    required: [true, 'Vui lòng chọn danh mục'],
    default: 'Other'
  },
  date: {
    type: Date,
    default: Date.now // Nếu không nhập, mặc định lấy ngày giờ hiện tại
  },
  note: {
    type: String,
    trim: true
  }
}, { timestamps: true }); // Tự động thêm ngày tạo (createdAt) và ngày cập nhật (updatedAt)

module.exports = mongoose.model('Transaction', TransactionSchema);