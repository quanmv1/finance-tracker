const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Lấy token từ header của request gửi lên (Bearer Token)
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Chuỗi header có dạng: "Bearer abcxyz123...", ta tách lấy phần mã token phía sau
      const token = authHeader.split(' ')[1];

      // Giải mã token bằng chuỗi bí mật JWT_SECRET trong file .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Trích xuất ID người dùng từ token ra và đính kèm nó vào request (req.user)
      // Nhờ vậy, các hàm xử lý API phía sau sẽ biết ai đang gọi tới
      req.user = decoded.id;

      // Cho phép request đi tiếp vào hàm xử lý API chính
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ, từ chối truy cập' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Không tìm thấy Token, quyền truy cập bị từ chối' });
  }
};

module.exports = { protect };