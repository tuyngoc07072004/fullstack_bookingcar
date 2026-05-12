import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogIn, AlertCircle, Eye, EyeOff, Users, Home } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { staffLogin, clearError } from '../../redux/Staff/Staff.Slice';
import { InputGroup } from '../../components/InputGroup';

export default function StaffLogin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.staff);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/staff-dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Clear error khi unmount
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setLocalError('Vui lòng nhập tên đăng nhập hoặc email');
      return false;
    }

    if (!formData.password.trim()) {
      setLocalError('Vui lòng nhập mật khẩu');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(staffLogin(formData)).unwrap();
      navigate('/staff-dashboard');

    } catch (err: any) {
      // Error đã được lưu trong state staff.error
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear local error khi user bắt đầu nhập lại
    if (localError) setLocalError('');
  };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className='absolute top-8 left-8 rounded-3xl transition bg-blue-800 p-2.5 text-white cursor-pointer hover:bg-blue-900'>
        <Home size={30} />
      </button>
      <div className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
            <Users size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">
            Đăng Nhập Nhân Viên
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Chào mừng quay lại!
          </p>
        </div>

        {(localError || error) && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-600 animate-in slide-in-from-top">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputGroup label="Tên Đăng Nhập / Email" required>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="username"
                required
                className="w-full py-4 pl-12 pr-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nhập tên đăng nhập hoặc email"
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Có thể đăng nhập bằng tên đăng nhập hoặc email
            </p>
          </InputGroup>

          <InputGroup label="Mật Khẩu" required>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full py-4 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium pr-12"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                autoComplete="current-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </InputGroup>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center">
          <Link
            to="/staff-register"
            className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
          >
            Chưa có tài khoản? Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}