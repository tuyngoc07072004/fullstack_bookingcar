import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { 
  fetchAllCustomers, 
  fetchCustomerBookings,
  setSearchQuery,
  clearSelectedCustomer
} from '../../redux/StaffCustomer/StaffCustomer.Slice';
import { Customer, CustomerBooking } from '../../types/StaffCustomer.types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Eye, Phone, Mail, X } from 'lucide-react';

interface CustomersTabProps {
  onViewCustomer: (customer: Customer, bookings: CustomerBooking[]) => void;
}

export default function CustomersTab({ onViewCustomer }: CustomersTabProps) {
  const dispatch = useAppDispatch();
  const {
    customers,
    customersPagination,
    customersLoading,
    customersError,
    searchQuery,
    selectedCustomer,
    customerStats,
    customerBookings,
    customerBookingsLoading,
    customerBookingsError
  } = useAppSelector((state) => state.staffCustomer);

  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchQuery) {
        dispatch(setSearchQuery(debouncedSearch));
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [debouncedSearch, dispatch, searchQuery]);

  // Fetch customers when page or search changes
  useEffect(() => {
    dispatch(fetchAllCustomers({
      search: searchQuery || undefined,
      page: currentPage,
      limit: 20
    }));
  }, [dispatch, currentPage, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedSearch(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewCustomer = async (customer: Customer) => {
    try {
      // Fetch bookings for this customer
      await dispatch(fetchCustomerBookings({
        customerId: customer._id,
        params: { page: 1, limit: 50, status: 'all' }
      })).unwrap();
      
      setShowCustomerModal(true);
    } catch (error) {
      alert('Không thể tải lịch sử đặt xe của khách hàng');
    }
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    dispatch(clearSelectedCustomer());
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

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

  if (customersLoading && customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-2 text-gray-600">Đang tải danh sách khách hàng...</span>
        </div>
      </div>
    );
  }

  if (customersError && customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center text-red-600">
          <p>Lỗi: {customersError}</p>
          <button
            onClick={() => dispatch(fetchAllCustomers({ page: currentPage, limit: 20 }))}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={debouncedSearch}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg text-left whitespace-nowrap">
            Tổng số: {customersPagination.totalItems} khách hàng
          </div>
      </div>
        {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-[1000px] w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[60px]">STT</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[150px]">Tên Khách Hàng</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[120px]">Số Điện Thoại</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[150px]">Email</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[100px]">Tổng Chuyến</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[120px]">Tổng Chi Tiêu</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[100px]">Ngày Đăng Ký</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600 w-[80px]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Không tìm thấy khách hàng nào
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {(currentPage - 1) * customersPagination.itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {customer.name}
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                    {customer.phone}
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                    {customer.email || 'không có mail'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.total_bookings || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-emerald-600 font-medium whitespace-nowrap">
                    {customer.total_spent ? formatCurrency(customer.total_spent) : '0₫'}
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-sm whitespace-nowrap">
                    {formatDate(customer.created_at)}
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        {/* Pagination */}
        {customersPagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Hiển thị {(customersPagination.currentPage - 1) * customersPagination.itemsPerPage + 1} 
              {' - '}
              {Math.min(
                customersPagination.currentPage * customersPagination.itemsPerPage,
                customersPagination.totalItems
              )} 
              {' trên '} {customersPagination.totalItems} khách hàng
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, customersPagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (customersPagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= customersPagination.totalPages - 2) {
                    pageNum = customersPagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === customersPagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
                <p className="text-sm text-gray-500 mt-1">Lịch sử đặt xe và thông tin chi tiết</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 text-xl font-bold">
                      {selectedCustomer.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Phone size={14} />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Mail size={14} />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Tổng chuyến</p>
                    <p className="text-2xl font-bold text-gray-900">{customerStats?.total_bookings || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customerStats?.total_spent || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Lịch sử đặt xe</h3>
              
              {customerBookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Đang tải lịch sử đặt xe...</p>
                </div>
              ) : customerBookingsError ? (
                <div className="text-center py-8 text-red-500">
                  <p>Lỗi: {customerBookingsError}</p>
                </div>
              ) : customerBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Khách hàng chưa có đơn đặt xe nào
                </div>
              ) : (
                <div className="space-y-3">
                  {customerBookings.map((booking: any) => (
                    <div key={booking._id || booking.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}