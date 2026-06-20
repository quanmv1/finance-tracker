const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Giúp Express đọc được dữ liệu JSON gửi lên

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Kết nối MongoDB thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Khai báo file chứa các API giao dịch
const transactionRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');

// Cấu hình tiền tố đường dẫn: Mọi API trong file đó sẽ bắt đầu bằng /api/transactions
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

// Route test đầu tiên
app.get('/', (req, res) => {
  res.send('Server Backend đang chạy ngon lành!');
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại port: ${PORT}`);
});