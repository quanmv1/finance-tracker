import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext'; // Gọi Context vào
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { isAuthenticated } = useContext(AuthContext); // Lấy trạng thái đăng nhập thật

  return (
    <BrowserRouter>
      <Routes>
        {/* Nếu đã đăng nhập mà cố vào login/register thì đá thẳng về trang chủ Dashboard */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

        {/* Nếu chưa đăng nhập, đá về trang login */}
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}