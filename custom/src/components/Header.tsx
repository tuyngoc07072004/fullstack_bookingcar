import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, Phone, User } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Đóng menu khi chuyển route
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const menuItems = [
    { label: 'Trang Chủ', path: '/' },
    { label: 'Đặt Xe', path: '/book-ride' },
    { label: 'Tra Cứu Chuyến Đi', path: '/my-trips' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 bg-white">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <Car size={20} className="text-white md:w-6 md:h-6" />
            </div>
            <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
              Car<span className="text-emerald-500">Booking</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-bold text-gray-600 hover:text-emerald-500 transition-colors uppercase tracking-wider"
              >
                {item.label}
              </Link>
            ))}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <a
              href="tel:19001234"
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-100 transition-colors"
            >
              <Phone size={16} />
              1900 1234
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-emerald-500 transition-colors"
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div 
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${isMenuOpen ? 'max-h-400 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <nav className="py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm font-bold text-gray-600 hover:text-emerald-500 transition-colors uppercase tracking-wider py-2"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-2"></div>
              <a
                href="tel:19001234"
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
              >
                <Phone size={16} />
                Gọi Ngay: 1900 1234
              </a>
            </div>
          </nav>
        </div>
      </div>

      {/* Overlay cho mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[-1] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}