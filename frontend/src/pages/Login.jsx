import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Lock, User, Eye, EyeOff } from 'lucide-react'; 
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  // 1. Khai báo các State quản lý dữ liệu nhập vào và trạng thái ẩn/hiện
  const [credential, setCredential] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext); 

  // 2. Hàm xử lý khi nhấn nút Đăng nhập thông thường
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        credential,
        password
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    }
  };

  // 3. HÀM Tự tạo cửa sổ Popup chủ động vượt qua mọi loại Adblock
  const handleGoogleLoginPopup = () => {
    setError('');

    // Cấu hình các thông số bắt buộc của Google OAuth2
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: window.location.origin + '/login', // Trả kết quả về chính trang login này
      client_id: import.meta.env.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',             // Yêu cầu lấy mã code (khớp với xử lý Backend mới)
      prompt: 'select_account',          // 🛑 Bắt buộc luôn hiện bảng chọn tài khoản, KHÔNG tự nhảy tên cố định
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options);
    const googleAuthUrl = `${rootUrl}?${qs.toString()}`;

    // Tính toán kích thước để căn cửa sổ popup nằm chính giữa màn hình máy tính
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Mở popup thủ công bằng mã JavaScript trực tiếp (Trình duyệt tính là do User click nên Adblock sẽ bỏ qua)
    const popup = window.open(
      googleAuthUrl,
      'Google Login',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Lập một trạm kiểm tra ngầm (mỗi 0.5 giây quét một lần) xem người dùng chọn tài khoản xong chưa
    const checkPopupUri = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkPopupUri);
          return;
        }

        // Nếu popup đổi hướng chạy về trang ứng dụng của mình thành công
        if (popup.location.pathname.includes('/login')) {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get('code'); // Rút mã code từ thanh địa chỉ ra

          if (code) {
            popup.close(); // Đóng popup lại ngay cho đẹp giao diện
            clearInterval(checkPopupUri);

            // Bắn trực tiếp mã 'code' này lên API Backend
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, { 
              code 
            });
            
            if (response.data.success) {
              login(response.data.user, response.data.token);
            }
          }
        }
      } catch (e) {
        // Bỏ qua lỗi bất đồng bộ Cross-Origin trong lúc popup đang tải dữ liệu trên domain của Google
      }
    }, 500);
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
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                  placeholder="••••••••"
                />
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Hoặc đăng nhập bằng</span></div>
          </div>

          {/* ---- NÚT BẤM CỦA GOOGLE (ĐÃ CẬP NHẬT GỌI HÀM POPUP CHỦ ĐỘNG) ---- */}
          <div className="flex justify-center w-full">
            <button 
              type="button"
              onClick={handleGoogleLoginPopup} // 🔥 Đổi từ () => handleGoogleSuccess() sang gọi hàm popup chủ động mới
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.65 0 3.13.57 4.3 1.69l3.21-3.2C17.56 1.77 14.97 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.31 7.55 8.94 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.62l3.78 2.93c2.21-2.04 3.67-5.04 3.67-8.7z"/>
                <path fill="#FBBC05" d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 6.9C.54 8.81 0 10.95 0 12s.54 3.19 1.5 5.1l3.86-3z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.78-2.93c-1.05.7-2.4 1.13-4.18 1.13-3.06 0-5.69-2.51-6.64-5.46L1.48 15.8C3.37 19.65 7.33 23 12 23z"/>
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>
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