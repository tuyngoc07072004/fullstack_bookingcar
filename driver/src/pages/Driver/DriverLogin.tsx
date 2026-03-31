import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, LogIn, AlertCircle, Eye, EyeOff, Home } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { driverLogin, clearError } from '../../redux/Driver/Driver.Slice';
import { motion } from 'motion/react';

export default function DriverLogin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, currentDriver, token } = useAppSelector((state) => state.driver);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (token && currentDriver) {
      navigate('/driver-dashboard', { replace: true });
    }
  }, [token, currentDriver, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (!formData.username || !formData.password) {
      setLocalError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      await dispatch(driverLogin({
        username: formData.username,
        password: formData.password
      })).unwrap();
      navigate('/driver-dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center p-4">
      <button 
      onClick={() => navigate('/')}
      className='absolute top-8 left-8 rounded-3xl transition bg-emerald-500 p-2.5 text-white cursor-pointer hover:bg-emerald-700'>
         <Home size={30} />
      </button>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Car size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Đăng Nhập Tài Xế</h2>
          <p className="text-gray-500 mt-2">Chào mừng bạn trở lại!</p>
        </div>

        {displayError && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-600">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Tên Đăng Nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full py-3.5 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Mật Khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full py-3.5 px-5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium pr-12"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Nhập mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/driver-register')}
            className="text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors"
          >
            Đăng ký tài khoản mới
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="text-emerald-600 hover:underline">Điều khoản dịch vụ</a>{' '}
            và{' '}
            <a href="#" className="text-emerald-600 hover:underline">Chính sách bảo mật</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}