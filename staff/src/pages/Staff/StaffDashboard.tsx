import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { staffLogout } from '../../redux/Staff/Staff.Slice';
import { fetchAllVehicles } from '../../redux/Vehicle/Vehicle.Slice';
import { fetchAllDrivers } from '../../redux/DriverManagement/DriverManagement.Slice';
import { Menu, LogOut, User, Calendar, Car, Users, BarChart3 } from 'lucide-react';

import Sidebar from '../../components/Sidebar';
import { ViewBookingModal, AssignmentModal } from '../../components/Modals';

import BookingsTab from './BookingsTab';
import StatsTab from './StatsTab';
import DriversTab from './DriversTab';
import VehiclesTab from './VehiclesTab';
import CustomersTab from './CustomersTab';
import PaymentsTab from './PaymentsTab';
import { Booking } from '../../types/Booking.types';
import { Customer, CustomerBooking } from '../../types/StaffCustomer.types';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentStaff, token, isAuthenticated, loading: authLoading } = useAppSelector((state) => state.staff);
  const { vehicles } = useAppSelector((state) => state.vehicle);
  const { drivers } = useAppSelector((state) => state.driverManagement);
  
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [assignment, setAssignment] = useState({ driverId: '', vehicleId: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'drivers' | 'vehicles' | 'customers' | 'stats' | 'payments'>('bookings');
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<Booking | null>(null);

  const hasCheckedAuth = useRef(false);

  // Helper: Lấy token từ Redux hoặc localStorage
  const getToken = (): string | null => {
    if (token) return token;
    const localToken = localStorage.getItem('staffToken');
    if (localToken) return localToken;
    return sessionStorage.getItem('staffToken');
  };

  // Helper: Lấy staff info từ Redux hoặc localStorage
  const getStaffInfoFromStorage = () => {
    if (currentStaff) return currentStaff;
    const stored = localStorage.getItem('staffInfo');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Check authentication
  useEffect(() => {
    if (hasCheckedAuth.current) return;

    const checkAuth = () => {
      const staffToken = getToken();
      const staff = getStaffInfoFromStorage();


      if (!staffToken || !staff) {
        handleLocalLogout();
        return false;
      }

      setStaffInfo(staff);
      setIsLoading(false);
      hasCheckedAuth.current = true;
      return true;
    };

    if (!authLoading && isAuthenticated && currentStaff && token) {
      setStaffInfo(currentStaff);
      setIsLoading(false);
      hasCheckedAuth.current = true;
    } else {
      checkAuth();
    }
  }, [navigate, authLoading, isAuthenticated, currentStaff, token]);

  // Fetch vehicles and drivers when needed
  useEffect(() => {
    if (staffInfo && !isLoading && (activeTab === 'vehicles' || activeTab === 'drivers' || activeTab === 'stats')) {
      if (activeTab === 'vehicles' || activeTab === 'stats') {
        dispatch(fetchAllVehicles());
      }
      if (activeTab === 'drivers' || activeTab === 'stats') {
        dispatch(fetchAllDrivers());
      }
    }
  }, [dispatch, staffInfo, isLoading, activeTab]);

  const fetchOccupancy = async (date: string, vehicleId?: string) => {
    try {
      const token = getToken();
      if (!token) return;

      let url = `/api/vehicle/vehicles/occupancy?date=${date}`;
      if (vehicleId) {
        url += `&vehicleId=${vehicleId}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOccupancy(data.data || data);
      }
    } catch (error) {
      setOccupancy([]);
    }
  };

  const handleLocalLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffInfo');
    sessionStorage.removeItem('staffToken');
    setStaffInfo(null);
    setIsLoading(false);
    hasCheckedAuth.current = false;
    navigate('/staff-login', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await dispatch(staffLogout()).unwrap();
      navigate('/staff-login', { replace: true });
    } catch (error) {
      handleLocalLogout();
    }
  };

  const handleViewCustomer = (customer: Customer, bookings: CustomerBooking[]) => {
    setViewingCustomer(customer);
    setCustomerBookings(bookings);
  };

  const handleAssignDriver = (booking: Booking) => {
    setBookingToAssign(booking);
    // Fetch occupancy for the booking date
    const date = new Date(booking.trip_date).toISOString().split('T')[0];
    fetchOccupancy(date);
    setShowAssignmentModal(true);
  };

  const handleAssignDriverSubmit = async () => {
    if (!bookingToAssign) return;

    try {
      const token = getToken();
      const response = await fetch('/api/staff/assign-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bookingToAssign._id,
          driverId: assignment.driverId,
          vehicleId: assignment.vehicleId,
          staffId: staffInfo?._id || staffInfo?.id
        })
      });

      if (response.status === 401) {
        handleLocalLogout();
        return;
      }

      if (response.ok) {
        setShowAssignmentModal(false);
        setBookingToAssign(null);
        setAssignment({ driverId: '', vehicleId: '' });
        setOccupancy([]);
      } else {
        const error = await response.json();
        alert(error.message || 'Phân công thất bại');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi phân công');
    }
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const staff = staffInfo || getStaffInfoFromStorage();
  if (!staff) {
    return null;
  }

  // Menu items for mobile
  const menuItems = [
    { id: 'bookings', label: 'Đơn Hàng', icon: Calendar },
    { id: 'payments', label: 'Thanh Toán', icon: BarChart3 }, // Dùng tạm icon phụ trên mobile
    { id: 'drivers', label: 'Tài Xế', icon: Users },
    { id: 'vehicles', label: 'Xe', icon: Car },
    { id: 'customers', label: 'Khách Hàng', icon: User },
    { id: 'stats', label: 'Thống Kê', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-linear-to-br from-blue-900 to-emerald-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-emerald-500">Staff</span> Panel
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        staffInfo={staff}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
            {activeTab === 'bookings' && 'Quản Lý Đơn Hàng'}
            {activeTab === 'payments' && 'Quản Lý Thanh Toán'}
            {activeTab === 'drivers' && 'Quản Lý Tài Xế'}
            {activeTab === 'vehicles' && 'Quản Lý Phương Tiện'}
            {activeTab === 'customers' && 'Quản Lý Khách Hàng'}
            {activeTab === 'stats' && 'Thống Kê Hệ Thống'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <User size={16} />
              <span>{staff?.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile Menu - Show when sidebar is closed on mobile */}
        {!isSidebarOpen && (
          <div className="md:hidden mb-6">
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs Content */}
        {activeTab === 'bookings' && (
          <BookingsTab
            onViewBooking={setViewingBooking}
            onAssignDriver={handleAssignDriver}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab onViewBooking={setViewingBooking} />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            bookings={[]}
            customers={[]}
            drivers={drivers}
            vehicles={vehicles}
          />
        )}
        
        {activeTab === 'drivers' && <DriversTab />}
        
        {activeTab === 'vehicles' && <VehiclesTab />}
        
        {activeTab === 'customers' && (
          <CustomersTab 
            onViewCustomer={handleViewCustomer}
          />
        )}
      </main>

      {/* Modals */}
      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
        />
      )}

      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
                <p className="text-sm text-gray-500 mt-1">Lịch sử đặt xe và thông tin chi tiết</p>
              </div>
              <button
                onClick={() => {
                  setViewingCustomer(null);
                  setCustomerBookings([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 text-xl font-bold">
                      {viewingCustomer.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{viewingCustomer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{viewingCustomer.phone}</span>
                    </div>
                    {viewingCustomer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{viewingCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Tổng chuyến</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingCustomer.total_bookings || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingCustomer.total_spent || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Lịch sử đặt xe</h3>
              
              {customerBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Khách hàng chưa có đơn đặt xe nào
                </div>
              ) : (
                <div className="space-y-3">
                  {customerBookings.map((booking: any) => {
                    const getStatusColor = (status: string) => {
                      const colors: Record<string, string> = {
                        pending: 'bg-yellow-100 text-yellow-800',
                        confirmed: 'bg-blue-100 text-blue-800',
                        assigned: 'bg-purple-100 text-purple-800',
                        'in-progress': 'bg-emerald-100 text-emerald-800',
                        completed: 'bg-green-100 text-green-800',
                        cancelled: 'bg-red-100 text-red-800'
                      };
                      return colors[status] || 'bg-gray-100 text-gray-800';
                    };

                    const getStatusText = (status: string) => {
                      const texts: Record<string, string> = {
                        pending: 'Chờ xác nhận',
                        confirmed: 'Đã xác nhận',
                        assigned: 'Đã phân công',
                        'in-progress': 'Đang thực hiện',
                        completed: 'Hoàn thành',
                        cancelled: 'Đã hủy'
                      };
                      return texts[status] || status;
                    };

                    const formatDate = (dateString: string) => {
                      try {
                        return new Date(dateString).toLocaleString('vi-VN');
                      } catch {
                        return dateString;
                      }
                    };

                    const formatCurrency = (amount: number) => {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(amount);
                    };

                    return (
                      <div key={booking._id || booking.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {booking.formatted_date || formatDate(booking.trip_date)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <p className="text-gray-700">
                                <span className="font-medium">Điểm đón:</span> {booking.pickup_location}
                              </p>
                              <p className="text-gray-700 mt-1">
                                <span className="font-medium">Điểm đến:</span> {booking.dropoff_location}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                              <span>{booking.seats} chỗ</span>
                              <span>{booking.passengers} khách</span>
                              <span className="font-medium text-emerald-600">{formatCurrency(booking.price)}</span>
                            </div>
                            {booking.driver && (
                              <div className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
                                <span>Tài xế: {booking.driver.name} - {booking.driver.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && bookingToAssign && (
        <AssignmentModal
          booking={bookingToAssign}
          drivers={drivers}
          vehicles={vehicles}
          occupancy={occupancy}
          assignment={assignment}
          setAssignment={setAssignment}
          onAssign={handleAssignDriverSubmit}
          onClose={() => {
            setShowAssignmentModal(false);
            setBookingToAssign(null);
            setAssignment({ driverId: '', vehicleId: '' });
            setOccupancy([]);
          }}
        />
      )}
    </div>
  );
}