import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Lock, User, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // ---- 2 TRẠNG THÁI MỚI PHỤC VỤ CHO OTP ----
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false); // Đã đăng ký thành công, chờ nhập OTP
  const [otp, setOtp] = useState(''); // Lưu mã OTP người dùng nhập vào
  // ------------------------------------------

  const navigate = useNavigate();

  const checkPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const currentStrength = checkPasswordStrength(password);

  const getBarConfig = (score) => {
    if (!password) return { width: '0%', color: 'bg-gray-200', text: '' };
    switch (score) {
      case 1: return { width: '25%', color: 'bg-red-500', text: 'Yếu 🔴' };
      case 2: return { width: '50%', color: 'bg-orange-500', text: 'Trung bình ⚠️' };
      case 3: return { width: '75%', color: 'bg-blue-500', text: 'Mạnh 💪' };
      case 4: return { width: '100%', color: 'bg-emerald-500', text: 'Rất mạnh 🔥' };
      default: return { width: '10%', color: 'bg-red-500', text: 'Quá yếu' };
    }
  };

  const barConfig = getBarConfig(currentStrength);

  // Hàm xử lý Đăng ký ban đầu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    try {
      const response = await axios.post('${import.meta.env.VITE_API_URL}/api/auth/register', {
        username, email, password
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setIsRegisterSuccess(true); // Kích hoạt ẩn Form đăng ký, hiện Form OTP
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại.');
    }
  };

  // Hàm xử lý Gửi mã OTP lên để kích hoạt tài khoản
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post('${import.meta.env.VITE_API_URL}/api/auth/verify-otp', {
        email,
        otp
      });
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          navigate('/login'); // Kích hoạt xong thì đưa về trang đăng nhập
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-md text-white"><Wallet size={36} /></div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRegisterSuccess ? 'Xác thực Email của bạn' : 'Tạo tài khoản mới'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}
          {successMessage && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center font-medium">{successMessage}</div>}

          {/* NẾU ĐĂNG KÝ XONG RỒI $\rightarrow$ HIỂN THỊ FORM NHẬP MÃ OTP */}
          {isRegisterSuccess ? (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <p className="text-sm text-gray-600 text-center">
                Mã xác thực đã được gửi về email <b className="text-gray-900">{email}</b>. Vui lòng nhập mã để hoàn tất kích hoạt.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center">Nhập mã số OTP (6 chữ số)</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><ShieldCheck size={18} /></div>
                  <input
                    type="text" required maxLength="6" value={otp} onChange={e => setOtp(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg tracking-widest bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="000000"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg shadow-sm text-sm font-semibold transition-colors">
                Kích hoạt tài khoản
              </button>
            </form>
          ) : (
            /* NẾU CHƯA ĐĂNG KÝ $\rightarrow$ HIỂN THỊ FORM ĐĂNG KÝ GỐC */
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên tài khoản (Username)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><User size={18} /></div>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Mail size={18} /></div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="name@example.com"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock size={18} /></div>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${barConfig.color}`} style={{ width: barConfig.width }}></div>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 text-right">{barConfig.text}</p>
                  </div>
                )}
              </div>

              {/* Ô NHẬP LẠI MẬT KHẨU CÓ MẮT ẨN/HIỆN */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} // Thay đổi type dựa trên State showConfirmPassword
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="Nhập lại mật khẩu..."
                  />
                  {/* NÚT ICON CON MẮT CHO Ô NHẬP LẠI MẬT KHẨU */}
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg shadow-sm text-sm font-semibold transition-colors">
                Đăng ký tài khoản
              </button>
            </form>
          )}

          {!isRegisterSuccess && (
            <p className="text-center text-sm text-gray-600">Đã có tài khoản rồi? <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">Đăng nhập</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}