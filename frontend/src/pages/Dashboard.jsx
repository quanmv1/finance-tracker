import { useState, useEffect, useContext } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, PlusCircle, Trash2, LogOut, Clock, CheckSquare, Square, X, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5555', '#00E4FF', '#FF00AA', '#99FF00'];

// Bộ từ điển hiển thị danh mục gốc
const categoryLabels = {
  Food: 'Ăn uống',
  Rent: 'Tiền nhà',
  Shopping: 'Mua sắm',
  Salary: 'Tiền lương',
  Bonus: 'Tiền thưởng',
  Other: 'Khác'
};

// Bộ từ điển màu sắc pastel cho các danh mục gốc
const categoryColors = {
  Food: 'bg-orange-100 text-orange-700 border-orange-200',
  Rent: 'bg-blue-100 text-blue-700 border-blue-200',
  Shopping: 'bg-purple-100 text-purple-700 border-purple-200',
  Salary: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Bonus: 'bg-teal-100 text-teal-700 border-teal-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200'
};

// Bộ màu dự phòng cho các danh mục tự nhập
const dynamicColors = [
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-lime-100 text-lime-700 border-lime-200'
];

// Hàm hỗ trợ tự động cấp màu: Nếu là danh mục gốc thì lấy màu gốc, nếu tự nhập thì tự động gán ngẫu nhiên 1 màu cố định dựa trên tên
const getCategoryColor = (cat) => {
  if (categoryColors[cat]) return categoryColors[cat];
  
  // Thuật toán Hash để chuỗi ký tự luôn sinh ra một số cố định
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Chọn màu từ mảng dynamicColors dựa trên số hash
  const index = Math.abs(hash) % dynamicColors.length;
  return dynamicColors[index];
};

export default function Dashboard() {
  const { user, token, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  
  // Các State quản lý Form nhập liệu
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState(''); 

  // ------------------------------------------
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  // ------------------------------------------
  const [aiAdvice, setAiAdvice] = useState(''); 
  const [isAiLoading, setIsAiLoading] = useState(false); 
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions?month=${filterMonth}&year=${filterYear}`, config);
      setTransactions(res.data.data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    setAiAdvice('');
  }, [filterMonth, filterYear]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Khác') : category;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        title, 
        amount: Number(amount), 
        type, 
        category: finalCategory 
      }, config);
      
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory('Food');
      setCustomCategory('');
      setIsModalOpen(false); 
      
      fetchTransactions(); 
    } catch (err) {
      alert('Lỗi thêm giao dịch: ' + err.response?.data?.message);
    }
  };

  const handleDeleteOne = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoản chi tiêu này?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, config);
        fetchTransactions();
      } catch (err) {
        alert('Lỗi khi xóa: ' + err.response?.data?.message);
      }
    }
  };

  const handleUrlDeleteMultiple = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} giao dịch đã chọn?`)) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions/delete-multiple`, { ids: selectedIds }, config);
        alert(res.data.message);
        fetchTransactions();
      } catch (err) {
        alert('Lỗi khi xóa hàng loạt: ' + err.response?.data?.message);
      }
    }
  };

  const handleSelectId = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t._id));
    }
  };

  const handleGetAiAdvice = async () => {
    setIsAiLoading(true);
    setAiAdvice('');
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/transactions/analyze-ai?month=${filterMonth}&year=${filterYear}`, 
        config
      );
      setAiAdvice(res.data.advice);
      setIsAiOpen(true);
    } catch (err) {
      console.error('Lỗi AI:', err);
      setAiAdvice('Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng thử lại sau!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const chartData = Object.values(
    transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      const displayName = categoryLabels[t.category] || t.category;
      if (!acc[t.category]) acc[t.category] = { name: displayName, value: 0 };
      acc[t.category].value += Number(t.amount);
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-500 p-2 rounded-xl text-white"><Wallet size={20} /></div>
              <span className="font-bold text-lg sm:text-xl text-gray-900">FinanceTracker</span>
            </div>
            <div className="flex items-center gap-x-4 sm:gap-x-6 pl-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-30 sm:max-w-none">Xin chào, {user?.username}</span>
              <button onClick={logout} className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-500 transition-colors shrink-0">
                <LogOut size={14} className="sm:size-4"/> <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* THANH BỘ LỌC THỜI GIAN & NÚT MỞ MODAL THÊM GIAO DỊCH */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center space-x-3 w-full sm:w-auto">
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Báo cáo của:</span>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {Array.from({ length: new Date().getFullYear() - 2026 + 1 }, (_, index) => 2026 + index).map(y => (
                <option key={y} value={String(y)}>Năm {y}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle size={16} />
            <span>Thêm giao dịch</span>
          </button>
        </div>

        {/* THẺ THỐNG KÊ MỚI: BỚT CHÓI VÀ HIỆN ĐẠI HƠN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Thẻ Số dư */}
          <div className="bg-indigo-50/60 border border-indigo-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-indigo-400/80 uppercase tracking-wider">Số dư trong tháng</p>
              <h3 className="text-2xl font-black mt-1 text-indigo-800/70">
                {balance.toLocaleString()} đ
              </h3>
            </div>
            <div className="p-3 bg-indigo-100/50 text-indigo-500/80 rounded-xl group-hover:scale-105 transition-transform duration-300">
              <Wallet size={24} />
            </div>
          </div>

          {/* Thẻ Thu nhập */}
          <div className="bg-emerald-50/60 border border-emerald-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">Thu nhập tháng này</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-800/70">
                +{totalIncome.toLocaleString()} đ
              </h3>
            </div>
            <div className="p-3 bg-emerald-100/50 text-emerald-500/80 rounded-xl group-hover:scale-105 transition-transform duration-300">
              <ArrowUpRight size={24} />
            </div>
          </div>

          {/* Thẻ Chi tiêu */}
          <div className="bg-rose-50/60 border border-rose-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-rose-400/80 uppercase tracking-wider">Chi tiêu tháng này</p>
              <h3 className="text-2xl font-black mt-1 text-rose-800/70">
                -{totalExpense.toLocaleString()} đ
              </h3>
            </div>
            <div className="p-3 bg-rose-100/50 text-rose-500/80 rounded-xl group-hover:scale-105 transition-transform duration-300">
              <ArrowDownRight size={24} />
            </div>
          </div>

        </div>      

        {/* BIỂU ĐỒ TRÒN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between w-full">
          <h4 className="font-bold text-lg text-gray-900">Phân tích chi tiêu theo danh mục</h4>
          <div className="h-72 w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString()} đ`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Không có dữ liệu chi tiêu trong tháng này</div>
            )}
          </div>
        </div>

        {/* KHU VỰC TRỢ LÝ TÀI CHÍNH THÔNG MINH AI */}
        <div 
          onClick={() => aiAdvice && setIsAiOpen(!isAiOpen)} 
          className={`p-6 rounded-2xl border border-purple-400 shadow-sm space-y-4 transition-all duration-300 ${
            aiAdvice ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
          } ${
            isAiOpen ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-xl text-white transition-all ${isAiLoading ? 'bg-purple-400 animate-spin' : 'bg-purple-600 animate-bounce'}`}>
                <PlusCircle size={20} /> 
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-lg text-purple-900 flex items-center flex-wrap gap-2">
                  <span>Trợ lý Phân tích Tài chính AI</span>
                  {aiAdvice && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${isAiOpen ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                      {isAiOpen ? 'Click để thu gọn ↩' : 'Có lời khuyên! Click để xem 👁️'}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-purple-600">Đưa ra lời khuyên chi tiêu thông minh dựa trên dữ liệu tháng {filterMonth}</p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                handleGetAiAdvice();
              }}
              disabled={isAiLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center space-x-1"
            >
              {isAiLoading ? (
                <span className="flex items-center space-x-1">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI đang phân tích...</span>
                </span>
              ) : (
                <span>Phân tích ngay bằng AI ✨</span>
              )}
            </button>
          </div>

          {aiAdvice && isAiOpen && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white/90 border border-purple-100 rounded-xl p-4 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-inner font-medium text-justify select-text whitespace-pre-line animate-slide-down"
            >
              {aiAdvice} 
            </div>
          )}
        </div>

        {/* BẢNG LỊCH SỬ GIAO DỊCH UI MỚI */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4 bg-white">
            <h4 className="font-bold text-lg text-slate-800">Lịch sử giao dịch gần đây</h4>
            {selectedIds.length > 0 && (
              <button onClick={handleUrlDeleteMultiple} className="flex items-center space-x-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-rose-100">
                <Trash2 size={14} /> <span>Xóa {selectedIds.length} mục đã chọn</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-900 text-slate-100 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <button type="button" onClick={handleSelectAll} className="text-slate-400 hover:text-white transition-colors">
                      {selectedIds.length === transactions.length && transactions.length > 0 ? (
                        <CheckSquare size={16} className="text-emerald-400" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Tên giao dịch</th>
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Giá (VNĐ)</th>
                  <th className="p-4">
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Thời gian</span>
                    </span>
                  </th>
                  <th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr 
                      key={t._id} 
                      className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(t._id) ? 'bg-emerald-50/30' : 'bg-white'}`}
                    >
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => handleSelectId(t._id)} className="text-gray-300 hover:text-emerald-600 transition-colors">
                          {selectedIds.includes(t._id) ? (
                            <CheckSquare size={16} className="text-emerald-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="p-4 font-bold text-slate-800 wrap-break-word">
                        {t.title}
                      </td>

                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap shadow-sm ${getCategoryColor(t.category)}`}>
                          {categoryLabels[t.category] || t.category}
                        </span>
                      </td>

                      <td className={`p-4 font-extrabold whitespace-nowrap tracking-wide ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+ ' : '- '}{t.amount.toLocaleString()}đ
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Clock size={10}/> {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => handleDeleteOne(t._id)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-transparent hover:border-rose-200 rounded-lg text-xs font-bold transition-all"
                          >
                            <Trash2 size={14} /> <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 text-sm font-medium bg-slate-50/50">
                      Không tìm thấy dữ liệu giao dịch trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* POPUP THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 p-6 relative space-y-4">
            
            <button 
              onClick={() => { setIsModalOpen(false); setCategory('Food'); setCustomCategory(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            <h4 className="font-bold text-xl text-gray-900 flex items-center space-x-2">
              <PlusCircle size={22} className="text-emerald-500" />
              <span>Thêm giao dịch mới</span>
            </h4>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Tiêu đề</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="Ví dụ: Mua bánh mì, Đóng tiền mạng..."/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Số tiền (đ)</label>
                <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="Nhập số tiền..."/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Loại</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="expense">Chi tiêu 🔴</option>
                    <option value="income">Thu nhập 🟢</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Danh mục</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg bg-gray-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="Food">🍔 Ăn uống</option>
                    <option value="Rent">🏠 Tiền nhà</option>
                    <option value="Shopping">🛍️ Mua sắm</option>
                    <option value="Salary">💵 Tiền lương</option>
                    <option value="Bonus">🎁 Tiền thưởng</option>
                    <option value="Other">✨ Khác (Tự nhập)</option>
                  </select>
                </div>
              </div>

              {category === 'Other' && (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 animate-slide-down">
                  <label className="block text-xs font-bold text-emerald-700 uppercase">Nhập tên danh mục mới của bạn</label>
                  <input 
                    type="text" required value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                    className="mt-1 w-full border border-emerald-200 rounded-lg bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ví dụ: Nuôi mèo, Cưới xin, Sửa xe..."
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setCategory('Food'); setCustomCategory(''); }}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold py-2.5 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-lg shadow-sm transition-colors">
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}