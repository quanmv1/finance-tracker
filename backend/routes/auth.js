const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Gọi thư viện gửi mail
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

// Khởi tạo client hỗ trợ cả Client Secret để đổi mã code lấy thông tin user
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET, 
  'postmessage' 
); 

// Cấu hình "Trạm gửi thư" Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. API ĐĂNG KÝ (TỰ ĐỘNG BẮN EMAIL OTP)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản hoặc Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tự động sinh mã OTP ngẫu nhiên gồm 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Cài đặt thời gian hết hạn cho OTP (Ví dụ: 5 phút tính từ bây giờ)
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpires
    });

    await newUser.save();

    // Tiến hành gửi Email chứa OTP về cho người dùng
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mã xác thực OTP kích hoạt tài khoản FinanceTracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px border-gray-200 rounded-xl">
          <h2 style="color: #10b981; text-align: center">Xác Thực Tài Khoản</h2>
          <p>Chào bạn <b>${username}</b>,</p>
          <p>Cảm ơn bạn đã đăng ký FinanceTracker. Mã OTP để kích hoạt tài khoản của bạn là:</p>
          <div style="background: #f3f4f6; text-align: center; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; margin: 20px 0; border-radius: 8px">
            ${otp}
          </div>
          <p style="color: #ef4444; font-size: 12px">* Mã OTP này có hiệu lực trong vòng 5 phút.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      success: true, 
      message: 'Đăng ký thành công! Vui lòng kiểm tra Email để nhận mã OTP.' 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
  }
});

// 2. API XÁC MINH MÃ OTP (MỚI BỔ SUNG)
// Đường dẫn: POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy người dùng này' });
    }

    // Kiểm tra xem OTP nhập vào có đúng không hoặc đã hết hạn chưa
    if (user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn' });
    }

    // Nếu đúng: Kích hoạt trạng thái verify, đồng thời xóa code OTP đi để bảo mật
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
  }
});

// 3. API ĐĂNG NHẬP (BỔ SUNG CHẶN USER CHƯA VERIFY)
router.post('/login', async (req, res) => {
  try {
    const { credential, password } = req.body;

    const user = await User.findOne({ $or: [{ username: credential }, { email: credential }] });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // ---- ĐOẠN CHECK CHẶN CHƯA VERIFY ----
    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        isNotVerified: true, // Trả thêm cờ này để Frontend biết mà mở hộp nhập OTP
        email: user.email,
        message: 'Tài khoản của bạn chưa được xác thực Email.' 
      });
    }
    // ------------------------------------

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server: ' + error.message });
  }
});

// API: ĐĂNG NHẬP / ĐĂNG KÝ NHANH BẰNG GOOGLE (POST)
router.post('/google-login', async (req, res) => {
  try {
    // 1. Thay vì googleToken, bây giờ chúng ta nhận mã 'code' từ Frontend gửi lên
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy mã xác thực từ Google' });
    }
    
    // 2. Sử dụng mã 'code' này để thực hiện đổi lấy các Token quyền hạn từ máy chủ Google
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // 3. Giải mã ID Token lấy được từ cục tokens để bóc tách thông tin cá nhân của User
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    // Lấy ra các thông tin cá nhân thật của người dùng từ hệ thống Google
    const { email, name, picture } = ticket.getPayload();

    // 4. Kiểm tra xem Email Google này đã tồn tại trong database chưa
    let user = await User.findOne({ email });

    // 5. Nếu chưa có tài khoản, hệ thống tự động đăng ký luôn một tài khoản mới tinh
    if (!user) {
      // Tự sinh username ngẫu nhiên từ email (ví dụ nguyenvana@gmail.com -> nguyenvana_gg)
      const baseUsername = email.split('@')[0] + '_gg';
      
      // Tạo mật khẩu ngẫu nhiên ngầm vì họ đăng nhập bằng Google, không xài pass này
      const salt = await bcrypt.genSalt(10);
      const hashedRandomPassword = await bcrypt.hash(Math.random().toString(36), salt);

      user = new User({
        username: baseUsername,
        email: email,
        password: hashedRandomPassword,
        isVerified: true // Đã xác thực bằng Google nên mặc định là true luôn, không cần gửi OTP nữa
      });

      await user.save();
    }

    // 6. Nếu tài khoản đã tồn tại hoặc vừa tạo xong -> Tiến hành cấp Token cá nhân (JWT) của dự án để đăng nhập
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Lỗi xử lý Google Login Backend:', error);
    res.status(500).json({ success: false, message: 'Lỗi xác thực Google: ' + error.message });
  }
});

module.exports = router;