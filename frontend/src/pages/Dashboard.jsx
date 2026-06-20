import { useState, useEffect, useContext } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, Trash2, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
const CATEGORY_MAP = {
  Food: 'Ăn uống',
  Rent: 'Tiền nhà',
  Shopping: 'Mua sắm',
  Salary: 'Tiền lương',
  Bonus: 'Tiền thưởng',
  Other: 'Khác'
};

export default function Dashboard() {
  const { user, token, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]); // Mảng lưu giao dịch thật từ DB
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');

  // Cấu hình Header chứa token Bearer gửi lên NodeJS
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 1. Hàm gọi API lấy danh sách giao dịch từ Backend
  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions', config);
      setTransactions(res.data.data);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 2. Hàm xử lý Thêm giao dịch mới
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/transactions', {
        title, amount: Number(amount), type, category
      }, config);
      
      // Reset form và load lại danh sách mới
      setTitle('');
      setAmount('');
      fetchTransactions();
    } catch (err) {
      alert('Lỗi thêm giao dịch: ' + err.response?.data?.message);
    }
  };

  // 3. Hàm xử lý Xóa giao dịch
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoản chi tiêu này?')) {
      try {
        await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
        fetchTransactions(); // Load lại danh sách sau khi xóa
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.response?.data?.message);
      }
    }
  };

  // Logic tính toán số liệu (Giữ nguyên cấu trúc tính toán của Tuần 3)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const chartData = Object.values(
    transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { 
          name: CATEGORY_MAP[t.category] || t.category, // Đổi tên hiển thị trên biểu đồ sang Tiếng Việt luôn
          value: 0 
        };
      }
      acc[t.category].value += t.amount;
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500 p-2 rounded-xl text-white"><Wallet size={20} /></div>
              <span className="font-bold text-xl text-gray-900">FinanceTracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">Xin chào, {user?.username}</span>
              <button onClick={logout} className="flex items-center space-x-1 text-sm font-semibold text-red-600 hover:text-red-500 transition-colors">
                <LogOut size={16} /> <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* NỘI DUNG CHÍNH (Giữ nguyên toàn bộ cấu trúc giao diện HTML/JSX của Tuần 3) */}
      <main translate="no" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-500">Số dư hiện tại</p><h3 className="text-2xl font-bold mt-1">{balance.toLocaleString()} đ</h3></div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-500">Tổng thu nhập</p><h3 className="text-2xl font-bold mt-1 text-emerald-600">+{totalIncome.toLocaleString()} đ</h3></div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-500">Tổng chi tiêu</p><h3 className="text-2xl font-bold mt-1 text-red-600">-{totalExpense.toLocaleString()} đ</h3></div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ArrowDownRight size={24} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-lg text-gray-900 flex items-center space-x-2"><PlusCircle size={20} className="text-emerald-500" /><span>Thêm giao dịch mới</span></h4>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Tiêu đề</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Số tiền (đ)</label>
                <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Loại</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all">
                    <option value="expense">Chi tiêu 🔴</option>
                    <option value="income">Thu nhập 🟢</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Danh mục</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all">
                    <option value="Food" translate="no">Ăn uống</option>
                    <option value="Rent" translate="no">Tiền nhà</option>
                    <option value="Shopping" translate="no">Mua sắm</option>
                    <option value="Salary" translate="no">Tiền lương</option>
                    <option value="Bonus" translate="no">Tiền thưởng</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold p-2.5 rounded-lg shadow-sm transition-colors mt-2">Lưu giao dịch</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <h4 className="font-bold text-lg text-gray-900">Phân tích chi tiêu theo danh mục</h4>
            <div className="h-64 w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} đ`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu chi tiêu để vẽ biểu đồ</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h4 className="font-bold text-lg text-gray-900">Lịch sử giao dịch gần đây</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase border-b border-gray-100">
                  <th className="p-4">Nội dung</th><th className="p-4">Danh mục</th><th className="p-4">Ngày tạo</th><th className="p-4 text-right">Số tiền</th><th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900">{t.title}</td>
                    <td className="p-4"><span translate="no" className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{CATEGORY_MAP[t.category] || t.category}</span></td>
                    <td className="p-4 text-gray-500">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className={`p-4 font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} đ
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(t._id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}