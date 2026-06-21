const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép các request không có origin (như Postman hoặc các công cụ test)
    if (!origin) return callback(null, true);
    
    // Nếu origin nằm trong danh sách allowedOrigins hoặc là một subdomain của vercel.app
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      return callback(null, true);
    } else {
      return callback(new Error('Chặn bởi cấu hình bảo mật CORS'));
    }
  },
  credentials: true
}));
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