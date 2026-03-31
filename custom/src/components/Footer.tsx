import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Car size={24} className="text-white" />
              </div>
              <span className="text-xl font-black text-white">
                Car<span className="text-emerald-500">Booking</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Dịch vụ vận tải hành khách hàng đầu Việt Nam. Cam kết an toàn, đúng giờ và chất lượng dịch vụ tốt nhất.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Dịch Vụ</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/book-ride" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Đặt xe sân bay
                </Link>
              </li>
              <li>
                <Link to="/book-ride" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Thuê xe du lịch
                </Link>
              </li>
              <li>
                <Link to="/book-ride" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Vận chuyển liên tỉnh
                </Link>
              </li>
              <li>
                <Link to="/driver-register" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Đăng ký tài xế
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Hỗ Trợ</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/my-trips" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Tra cứu chuyến đi
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6">Liên Hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <a href="tel:19001234" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium">
                  1900 1234 <br />
                  <span className="text-xs text-gray-500">(Miễn phí 24/7)</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <a href="mailto:support@carbooking.com" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm font-medium break-all">
                  support@carbooking.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  123 Đường Láng, Đống Đa, Hà Nội
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} CarBooking System. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/staff-login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Nhân viên
              </Link>
              <Link to="/driver-login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Tài xế
              </Link>
              <Link to="/driver-register" className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors font-bold">
                Đăng ký tài xế
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}