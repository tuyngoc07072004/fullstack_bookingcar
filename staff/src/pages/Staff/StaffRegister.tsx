import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserPlus, AlertCircle, Eye, EyeOff, Phone, Mail, Users, CheckCircle, XCircle, Home } from 'lucide-react';
import { useAppDispatch } from '../../redux/store';
import { staffRegister } from '../../redux/Staff/Staff.Slice';

export default function StaffRegister() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPasswordMatch = formData.password === formData.confirmPassword;
  
  const validatePasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 6;
    
    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    };
  };

  const passwordStrength = validatePasswordStrength(formData.password);

  // Validate form trước khi submit
  const validateForm = (): boolean => {
    // Validate phone
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ. Phải là 10 số và bắt đầu bằng 03, 05, 07, 08, 09');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không đúng định dạng');
      return false;
    }

    // Validate username
    if (formData.username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return false;
    }

    // Validate password
    if (!passwordStrength.isValid) {
      setError('Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)');
      return false;
    }

    // Check password match
    if (!isPasswordMatch) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Tạo payload không bao gồm confirmPassword
      const { confirmPassword, ...registerData } = formData;
      
      const result = await dispatch(staffRegister(registerData)).unwrap();
      
      if (result) {
        navigate('/staff-login', { 
          state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
        });
      }
    } catch (err: any) {
      setError(err || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const PasswordStrengthIndicator = () => {
    if (!formData.password) return null;
    
    const requirements = [
      { label: 'Ít nhất 6 ký tự', met: passwordStrength.isLongEnough },
      { label: 'Chữ hoa (A-Z)', met: passwordStrength.hasUpperCase },
      { label: 'Chữ thường (a-z)', met: passwordStrength.hasLowerCase },
      { label: 'Số (0-9)', met: passwordStrength.hasNumbers },
      { label: 'Ký tự đặc biệt (@$!%*?&)', met: passwordStrength.hasSpecialChar },
    ];

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-xs font-bold text-gray-500 mb-2">Yêu cầu mật khẩu:</p>
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <CheckCircle size={12} className="text-emerald-500" />
              ) : (
                <XCircle size={12} className="text-gray-300" />
              )}
              <span className={req.met ? 'text-emerald-600' : 'text-gray-400'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isSubmitDisabled = loading || (formData.confirmPassword !== '' && !isPasswordMatch);

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
       <button 
        onClick={() => navigate('/')}
        className='absolute top-8 left-8 rounded-3xl transition bg-blue-800 p-2.5 text-white cursor-pointer hover:bg-blue-900'>
            <Home size={30} />
        </button>
      <div className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
            <Users size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">
            Đăng Ký Nhân Viên
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Gia nhập đội ngũ quản lý
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-600 animate-in slide-in-from-top">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputGroup label="Họ và Tên" required>
            <input
              type="text"
              required
              className="w-full py-4 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Nhập họ và tên"
              disabled={loading}
            />
          </InputGroup>

          <InputGroup label="Số Điện Thoại" required>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                required
                className="w-full py-4 pl-12 pr-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="Nhập số điện thoại"
                disabled={loading}
                maxLength={10}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Số điện thoại phải là 10 số và bắt đầu bằng 03, 05, 07, 08, 09
            </p>
          </InputGroup>

          <InputGroup label="Email" required>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                className="w-full py-4 pl-12 pr-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="Nhập email"
                disabled={loading}
              />
            </div>
          </InputGroup>

          <InputGroup label="Tên Đăng Nhập" required>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                className="w-full py-4 pl-12 pr-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Nhập tên đăng nhập"
                disabled={loading}
                minLength={3}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tên đăng nhập phải có ít nhất 3 ký tự
            </p>
          </InputGroup>

          <InputGroup label="Mật Khẩu" required>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full py-4 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium pr-12"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Nhập mật khẩu"
                disabled={loading}
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
            
            <PasswordStrengthIndicator />
          </InputGroup>

          <InputGroup label="Xác Nhận Mật Khẩu" required>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className={`w-full py-4 px-5 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium pr-12 ${
                  formData.confirmPassword && !isPasswordMatch 
                    ? 'border-red-300 bg-red-50' 
                    : formData.confirmPassword && isPasswordMatch 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'border-gray-200'
                }`}
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              
              {/* Match indicator */}
              {formData.confirmPassword && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  {isPasswordMatch ? (
                    <CheckCircle size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {/* Match message */}
            {formData.confirmPassword && !isPasswordMatch && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <XCircle size={12} /> Mật khẩu không khớp
              </p>
            )}
            {formData.confirmPassword && isPasswordMatch && (
              <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> Mật khẩu khớp
              </p>
            )}
          </InputGroup>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-linear-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={20} />
                Đăng Ký
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/staff-login"
            className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
          >
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 font-medium text-center">
              💼 Đây là khu vực dành cho nhân viên quản lý hệ thống
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}