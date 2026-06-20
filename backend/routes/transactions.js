const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware'); // Gọi người gác cổng vào

// Đặt protect ở đây: TẤT CẢ các API bên dưới dòng này đều bắt buộc phải đăng nhập mới dùng được
router.use(protect);

// ==========================================
// 1. API: THÊM MỚI GIAO DỊCH (Đã bảo mật)
// ==========================================
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;

    // Lấy req.user (ID người dùng) mà middleware protect đã giải mã được để gán vào userId
    const newTransaction = new Transaction({
      userId: req.user, 
      title,
      amount,
      type,
      category,
      date,
      note
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json({ success: true, data: savedTransaction });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi: ' + error.message });
  }
});

// ==========================================
// 2. API: LẤY DANH SÁCH GIAO DỊCH (Chỉ lấy của người đang đăng nhập)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Thêm điều kiện tìm kiếm { userId: req.user } để người này không xem được ví của người khác
    const transactions = await Transaction.find({ userId: req.user }).sort({ date: -1 });

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi: ' + error.message });
  }
});

// ==========================================
// 3. API: XÓA MỘT GIAO DỊCH (Chỉ cho phép xóa đồ của mình)
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    // Tìm giao dịch theo ID
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    // Kiểm tra xem giao dịch này có đúng là của ông đang đăng nhập này không
    if (transaction.userId.toString() !== req.user) {
      return res.status(401).json({ success: false, message: 'Bạn không có quyền xóa giao dịch của người khác' });
    }

    // Nếu đúng chủ sở hữu, tiến hành xóa
    await transaction.deleteOne();
    res.status(200).json({ success: true, message: 'Đã xóa giao dịch thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi: ' + error.message });
  }
});

// ==========================================
// 4. API: CẬP NHẬT GIAO DỊCH (Chỉ cho phép sửa đồ của mình)
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    // Kiểm tra quyền sở hữu trước khi sửa
    if (transaction.userId.toString() !== req.user) {
      return res.status(401).json({ success: false, message: 'Bạn không có quyền sửa giao dịch này' });
    }

    // Tiến hành cập nhật dữ liệu mới
    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi: ' + error.message });
  }
});

module.exports = router;