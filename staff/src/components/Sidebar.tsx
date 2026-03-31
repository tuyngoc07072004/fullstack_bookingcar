import { Calendar,Home, BarChart3, UserCheck, Car, Users, LogOut, CreditCard } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isOpen: boolean;
  onClose: () => void;
  staffInfo: any;
  onLogout: () => void;
}

function SidebarButton({ icon, label, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-500 text-white' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, staffInfo, onLogout }: SidebarProps) {
  
  const handleHomeClick = () => {
    onClose();
    window.location.href = '/';
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-linear-to-b from-gray-900 to-blue-900 text-white p-6 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex gap-2 items-start mb-10">
            <h2 className="text-2xl font-bold hidden md:flex items-center gap-2">
                <nav onClick={handleHomeClick}>
                <Home size={28} className="text-emerald-500 cursor-pointer hover:text-emerald-400 transition-colors" />
                </nav>
                Staff Panel
            </h2>
          </div>
          
          <nav className="space-y-2 flex-1">
            <SidebarButton 
              onClick={() => { onTabChange('bookings'); onClose(); }} 
              icon={<Calendar size={20} />} 
              label="Đơn Hàng" 
              active={activeTab === 'bookings'} 
            />
            <SidebarButton 
              onClick={() => { onTabChange('payments'); onClose(); }} 
              icon={<CreditCard size={20} />} 
              label="Thanh Toán" 
              active={activeTab === 'payments'} 
            />
            <SidebarButton 
              onClick={() => { onTabChange('stats'); onClose(); }} 
              icon={<BarChart3 size={20} />} 
              label="Thống Kê" 
              active={activeTab === 'stats'} 
            />
            <SidebarButton 
              onClick={() => { onTabChange('drivers'); onClose(); }} 
              icon={<UserCheck size={20} />} 
              label="Tài Xế" 
              active={activeTab === 'drivers'} 
            />
            <SidebarButton 
              onClick={() => { onTabChange('vehicles'); onClose(); }} 
              icon={<Car size={20} />} 
              label="Phương Tiện" 
              active={activeTab === 'vehicles'} 
            />
            <SidebarButton 
              onClick={() => { onTabChange('customers'); onClose(); }} 
              icon={<Users size={20} />} 
              label="Khách Hàng" 
              active={activeTab === 'customers'} 
            />
          </nav>

          {staffInfo && (
            <div className="mt-auto pt-6 border-t border-gray-700">
              <div className="bg-white/10 rounded-2xl p-4 text-sm">
                <div className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Nhân viên</div>
                <div className="font-bold">{staffInfo.name}</div>
                <div className="text-xs text-gray-300 mt-1">{staffInfo.phone}</div>
                <div className="text-xs text-gray-300 mt-1">{staffInfo.email}</div>
                <button 
                  onClick={onLogout} 
                  className="w-full flex items-center justify-center gap-2 mt-2 p-2 border border-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}