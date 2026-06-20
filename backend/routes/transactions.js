const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware'); // Gọi người gác cổng vào
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
    const { month, year } = req.query;
    
    // Tạo điều kiện tìm kiếm mặc định theo userId của người đăng nhập
    let query = { userId: req.user };

    // Nếu Frontend có truyền lên month và year, ta tiến hành lọc ngày tháng
    if (month && year) {
      // Ngày bắt đầu tháng (Ví dụ: 2026-06-01T00:00:00.000Z)
      const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
      // Ngày kết thúc tháng (Tự động tính ngày đầu tiên của tháng sau)
      const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

      // Lọc các giao dịch có trường 'date' nằm trong khoảng [startDate, endDate)
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
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

// ==========================================
// 5. API: XÓA NHIỀU GIAO DỊCH CÙNG LÚC (MỚI BỔ SUNG)
// ==========================================
router.post('/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body; // Nhận mảng các ID dạng ['id1', 'id2', ...] từ Frontend gửi lên

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách ID cần xóa' });
    }

    // Thực hiện xóa tất cả các giao dịch nằm trong mảng ids VÀ phải thuộc về userId này
    const result = await Transaction.deleteMany({
      _id: { $in: ids },
      userId: req.user
    });

    res.status(200).json({
      success: true,
      message: `Đã xóa thành công ${result.deletedCount} giao dịch!`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa hàng loạt: ' + error.message });
  }
});

// ==========================================
// 6. API: TRỢ LÝ AI PHÂN TÍCH CHI TIÊU TRONG THÁNG (POST hoặc GET)
// ==========================================
router.get('/analyze-ai', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Tháng và Năm cần phân tích' });
    }

    // 1. Thu thập dữ liệu giao dịch của người dùng trong tháng đó giống hệt Ý 5
    const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const transactions = await Transaction.find({
      userId: req.user,
      date: { $gte: startDate, $lt: endDate }
    });

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        advice: 'Tháng này bạn chưa có giao dịch nào nên Trợ lý AI chưa thể đưa ra phân tích chuyên sâu được. Hãy thêm chi tiêu nhé!'
      });
    }

    // 2. Định dạng dữ liệu thô thành một chuỗi văn bản (Prompt) gọn gàng để gửi cho AI hiểu
    let totalIncome = 0;
    let totalExpense = 0;
    let expenseDetails = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (!expenseDetails[t.category]) expenseDetails[t.category] = 0;
        expenseDetails[t.category] += t.amount;
      }
    });

    let expenseBreakdownStr = Object.entries(expenseDetails)
      .map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString()} đ`)
      .join('\n');

    // Tạo cấu trúc câu hỏi (Prompt) chi tiết gửi đi
    const prompt = `
      Bạn là một chuyên gia quản lý tài chính cá nhân thông minh.
      Hãy phân tích dữ liệu chi tiêu trong tháng ${month}/${year} của người dùng sau đây và đưa ra nhận xét, lời khuyên ngắn gọn bằng tiếng Việt:
      
      - Tổng thu nhập nhận được: ${totalIncome.toLocaleString()} đ
      - Tổng chi tiêu đã tiêu: ${totalExpense.toLocaleString()} đ
      - Chi tiết các danh mục đã tiêu:
      ${expenseBreakdownStr}
      
      Yêu cầu đầu ra:
      1. Đánh giá ngắn gọn xem người dùng tiêu hoang hay tiết kiệm.
      2. Chỉ ra danh mục nào đang tiêu tốn nhiều tiền nhất một cách bất thường (nếu có).
      3. Đưa ra 2-3 gợi ý hành động thực tế để họ tối ưu hóa ngân sách tốt hơn trong tháng sau.
      Hãy viết câu trả lời thật thân thiện, định dạng rõ ràng (có thể dùng gạch đầu dòng), không dài dòng quá 150 từ.
    `;

    // 3. Khởi tạo mô hình Gemini và gửi dữ liệu đi
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Sử dụng mô hình gemini-2.5-flash tốc độ siêu nhanh và tối ưu chi phí
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const aiAdvice = result.response.text();

    // 4. Trả kết quả phân tích của AI về cho Frontend hiển thị
    res.status(200).json({
      success: true,
      advice: aiAdvice
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi trợ lý AI: ' + error.message });
  }
});

module.exports = router;