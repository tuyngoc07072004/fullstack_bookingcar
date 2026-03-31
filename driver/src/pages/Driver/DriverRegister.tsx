import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Phone, CreditCard, CheckCircle2, ArrowLeft, Car, AlertCircle, Eye, EyeOff, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { driverRegister, clearError } from '../../redux/Driver/Driver.Slice';
import { DriverRegisterPayload } from '../../types/Driver.types';

export default function DriverRegister() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.driver);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [localError, setLocalError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  };

  const validateUsername = (username: string) => {
    return username && username.length >= 4;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    // Validate
    if (!formData.name || !formData.phone || !formData.license_number || !formData.username || !formData.password || !formData.confirmPassword) {
      setLocalError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setLocalError('Số điện thoại không hợp lệ. Số điện thoại phải là 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09');
      return;
    }

    if (!validateUsername(formData.username)) {
      setLocalError('Tên đăng nhập phải có ít nhất 4 ký tự');
      return;
    }

    if (!validatePassword(formData.password)) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const registerData: DriverRegisterPayload = {
        name: formData.name,
        phone: formData.phone,
        license_number: formData.license_number,
        username: formData.username,
        password: formData.password
      };
      
      await dispatch(driverRegister(registerData)).unwrap();
      setIsSuccess(true);
      
      // Chuyển về trang đăng nhập sau 2 giây
      setTimeout(() => navigate('/driver-login'), 2000);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const displayError = localError || error;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-emerald-100"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-200">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Đăng Ký Thành Công!</h2>
          <p className="text-gray-500 font-medium">Vui lòng đăng nhập để tiếp tục. Đang chuyển hướng...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#F8F9FA] flex flex-col">
      <button 
      onClick={() => navigate('/')}
      className='absolute top-8 left-8 rounded-3xl transition bg-emerald-500 p-2.5 text-white cursor-pointer hover:bg-emerald-700'>
         <Home size={30} />
      </button>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-6 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => navigate('/driver-login')} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-all"
          >
            <ArrowLeft size={20} /> Quay Lại
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Đăng Ký Tài Xế</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl max-w-lg w-full border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <Car size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Trở Thành Đối Tác</h2>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Gia nhập đội ngũ vận tải</p>
            </div>
          </div>

          {displayError && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-600">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-sm font-medium">{displayError}</span>
            </div>
          )}

          {/* Password requirements note */}
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 mb-6">
            <p className="text-xs text-amber-700 font-medium">
              <strong>Yêu cầu mật khẩu:</strong> Ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={14} /> Họ và Tên <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="text" 
                placeholder="Nguyễn Văn A"
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} /> Số Điện Thoại <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="tel" 
                placeholder="vd: 0912345678"
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} /> Số Bằng Lái <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="text" 
                placeholder="vd: LX123456789"
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all"
                value={formData.license_number}
                onChange={e => setFormData({...formData, license_number: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Tên Đăng Nhập <span className="text-red-500">*</span>
              </label>
              <input 
                required
                type="text" 
                placeholder="tendangnhap"
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all pr-12"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Nhập Lại Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  required
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all pr-12"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Đăng Ký Ngay'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-8 text-center">
            <span className="text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <button
                onClick={() => navigate('/driver-login')}
                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                disabled={loading}
              >
                Đăng nhập ngay
              </button>
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}