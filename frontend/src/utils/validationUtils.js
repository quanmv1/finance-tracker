/**
 * Validation Utilities cho Frontend
 */

// Validation cho Username
export const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return 'Vui lòng nhập tên tài khoản';
  }
  if (username.length < 3) {
    return 'Tên tài khoản phải có ít nhất 3 ký tự';
  }
  if (username.length > 20) {
    return 'Tên tài khoản không được vượt quá 20 ký tự';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Tên tài khoản chỉ được chứa chữ, số và dấu gạch dưới';
  }
  return '';
};

// Validation cho Email
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return 'Vui lòng nhập email';
  }
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return 'Email không đúng định dạng';
  }
  return '';
};

// Validation cho Password
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return 'Vui lòng nhập mật khẩu';
  }
  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  if (password.length > 50) {
    return 'Mật khẩu không được vượt quá 50 ký tự';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ số';
  }
  return '';
};

// Validation cho Confirm Password
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Vui lòng nhập lại mật khẩu';
  }
  if (password !== confirmPassword) {
    return 'Mật khẩu nhập lại không khớp!';
  }
  return '';
};

// Validation cho OTP
export const validateOtp = (otp) => {
  if (!otp || otp.trim().length === 0) {
    return 'Vui lòng nhập mã OTP';
  }
  if (otp.length !== 6) {
    return 'Mã OTP phải gồm 6 chữ số';
  }
  if (!/^\d+$/.test(otp)) {
    return 'Mã OTP chỉ được chứa chữ số';
  }
  return '';
};

// Check độ mạnh mật khẩu
export const checkPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

// Format độ mạnh mật khẩu
export const getPasswordStrengthConfig = (score) => {
  if (score === 0) return { width: '0%', color: 'bg-gray-200', text: '' };
  switch (score) {
    case 1: return { width: '25%', color: 'bg-red-500', text: 'Yếu 🔴' };
    case 2: return { width: '50%', color: 'bg-orange-500', text: 'Trung bình ⚠️' };
    case 3: return { width: '75%', color: 'bg-blue-500', text: 'Mạnh 💪' };
    case 4: return { width: '100%', color: 'bg-emerald-500', text: 'Rất mạnh 🔥' };
    default: return { width: '10%', color: 'bg-red-500', text: 'Quá yếu' };
  }
};

// Validation cho Credential (username hoặc email)
export const validateCredential = (credential) => {
  if (!credential || credential.trim().length === 0) {
    return 'Vui lòng nhập tài khoản hoặc email';
  }
  return '';
};

// Validation cho Login Password
export const validateLoginPassword = (password) => {
  if (!password || password.length === 0) {
    return 'Vui lòng nhập mật khẩu';
  }
  return '';
};
