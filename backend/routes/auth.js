const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Gọi thư viện gửi mail
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { validateRegister, validateLogin, validateVerifyOtp } = require('../middleware/validateRequest');

// Khởi tạo client hỗ trợ cả Client Secret để đổi mã code lấy thông tin user
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET, 
  'postmessage' 
); 

// Cấu hình "Trạm gửi thư" Nodemailer (Đã tối ưu chống lỗi Connection timeout trên Render)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true cho cổng 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // Thiết lập timeout 10 giây để không bị treo tiến trình
});

// 1. API ĐĂNG KÝ (TỰ ĐỘNG BẮN EMAIL OTP & XỬ LÝ TÀI KHOẢN CHƯA VERIFY)
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Tìm xem có user nào trùng username hoặc email không
    let user = await User.findOne({ $or: [{ username }, { email }] });

    // Sinh mã OTP và thời hạn mới (5 phút)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    
    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (user) {
      // TRƯỜNG HỢP 1: User đã tồn tại và ĐÃ XÁC THỰC -> Chặn lại
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Tên tài khoản hoặc Email đã được sử dụng.' });
      } 
      // TRƯỜNG HỢP 2: User tồn tại nhưng CHƯA XÁC THỰC -> Cập nhật lại data & cấp OTP mới (Tái chế)
      else {
        user.username = username; // Cập nhật nhỡ họ đổi username
        user.email = email;
        user.password = hashedPassword; // Cập nhật nhỡ họ gõ pass mới
        user.otpCode = otp;
        user.otpExpires = otpExpires;
        await user.save();
      }
    } else {
      // TRƯỜNG HỢP 3: User hoàn toàn mới -> Tạo mới tinh
      user = new User({
        username,
        email,
        password: hashedPassword,
        otpCode: otp,
        otpExpires,
        isVerified: false
      });
      await user.save();
    }

    // Tiến hành gửi Email chứa OTP về cho người dùng
    const mailOptions = {
      from: '"Finance Tracker" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Mã xác thực OTP kích hoạt tài khoản FinanceTracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
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

// 2. API XÁC MINH MÃ OTP 
router.post('/verify-otp', validateVerifyOtp, async (req, res) => {
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
router.post('/login', validateLogin, async (req, res) => {
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
        isNotVerified: true, 
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

// API: Nhận 'code' từ Frontend và đổi lấy Token của Google (Luồng Redirect)
router.post('/google-redirect', async (req, res) => {
  try {
    const { code } = req.body;
    
    // 1. Khởi tạo Client với Secret và Link Redirect
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL}/login` 
    );

    // 2. Đổi code lấy tokens từ Google
    const { tokens } = await client.getToken(code);
    
    // 3. Lấy thông tin user từ tokens
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name } = ticket.getPayload();

    // 4. Logic tìm hoặc tạo User trong MongoDB
    let user = await User.findOne({ email });
    
    if (!user) {
      const baseUsername = email.split('@')[0] + '_gg';
      const salt = await bcrypt.genSalt(10);
      const hashedRandomPassword = await bcrypt.hash(Math.random().toString(36), salt);

      user = new User({ 
        username: baseUsername, 
        email: email, 
        password: hashedRandomPassword, 
        isVerified: true 
      });
      await user.save();
    }

    // 5. Tạo JWT của ứng dụng
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ 
      success: true,
      token, 
      user: { id: user._id, username: user.username, email: user.email } 
    });

  } catch (error) {
    console.error('Lỗi xác thực Google Redirect:', error);
    res.status(500).json({ success: false, message: 'Lỗi xác thực Google' });
  }
});

module.exports = router;