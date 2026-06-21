import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Lock, User, Eye, EyeOff } from 'lucide-react'; // Thêm icon Eye để làm ẩn/hiện ẩn/hiện mật khẩu
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  // 1. Khai báo các State quản lý dữ liệu nhập vào và trạng thái ẩn/hiện
  const [credential, setCredential] = useState(''); // Lưu Username hoặc Email linh hoạt
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // true: hiện chữ, false: ẩn dạng chấm ••
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext); // Lấy hàm kích hoạt đăng nhập từ Context

  // 2. Hàm xử lý khi nhấn nút Đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Gửi request lên API mới của Backend (Chấp nhận cả email/username qua trường credential)
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        credential,
        password
      });

      if (response.data.success) {
        // Nếu thành công, nạp thông tin user và token vào hệ thống để nhảy sang Dashboard
        login(response.data.user, response.data.token);
      }
    } catch (err) {
      // Nhặt thông báo lỗi từ Backend trả về để hiển thị lên Form
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      // Gửi cái Token mã hóa mà Google cấp lên cho Backend NodeJS xử lý
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
        googleToken: credentialResponse.credential
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập bằng Google thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-md text-white">
            <Wallet size={36} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Chào mừng quay trở lại</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 space-y-4">
          
          {/* Ô báo lỗi màu đỏ nếu thông tin sai */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Ô NHẬP CREDENTIAL (USERNAME HOẶC EMAIL) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tài khoản hoặc Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text" required value={credential} onChange={(e) => setCredential(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                  placeholder="Nhập username hoặc email..."
                />
              </div>
            </div>

            {/* Ô NHẬP MẬT KHẨU CÓ MẮT ẨN/HIỆN */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} // Thay đổi type dựa trên State showPassword
                  required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                  placeholder="••••••••"
                />
                {/* NÚT ICON CON MẮT ĐỂ UPDATE TRẠNG THÁI SHOW/HIDE */}
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                Đăng nhập
              </button>
            </div>
          </form>

          {/* ---- ĐOẠN ĐƯỜNG KẺ NGĂN CÁCH ---- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Hoặc đăng nhập bằng</span></div>
          </div>

          {/* ---- NÚT BẤM CỦA GOOGLE ĐƯỢC THƯ VIỆN VẼ TỰ ĐỘNG ---- */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Lỗi kết nối với hệ thống Google')}
              theme="outline"
              size="large"
              width="100%"
              type="standard"
              text="signin_with"
              useOneTap={false}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}