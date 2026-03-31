import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchBookings, setFilters } from '../../redux/StaffBooking/StaffBooking.Slice';
import { Booking } from '../../types/Booking.types';

interface PaymentsTabProps {
  onViewBooking: (booking: Booking) => void;
}

export default function PaymentsTab({ onViewBooking }: PaymentsTabProps) {
  const dispatch = useAppDispatch();
  const { bookings, loading, pagination, filters } = useAppSelector(
    (state) => state.staffBooking
  );

  const [tempFilters, setTempFilters] = useState({
    search: filters.search || '',
    payment_status: 'all' 
  });

  useEffect(() => {
    dispatch(fetchBookings(filters));
  }, [dispatch, filters]);

  const handleFilterChange = () => {
    dispatch(setFilters({
      search: tempFilters.search || undefined,
      page: 1
    }));
  };

  const handleResetFilters = () => {
    setTempFilters({ search: '', payment_status: 'all' });
    dispatch(setFilters({ search: undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setFilters({ page: newPage }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch(status) {
      case 'paid_cash':
      case 'paid_transfer':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch(status) {
      case 'paid_cash': return 'Đã thanh toán (Tiền mặt)';
      case 'paid_transfer': return 'Đã thanh toán (Chuyển khoản)';
      case 'refunded': return 'Đã hoàn tiền';
      case 'failed': return 'Thất bại';
      case 'pending': return 'Chưa thanh toán (Chờ)';
      default: return 'Chưa rõ';
    }
  };

  // Áp dụng filter local cho trạng thái thanh toán
  const displayBookings = bookings.filter((b: any) => {
    if (tempFilters.payment_status === 'all') return true;
    if (tempFilters.payment_status === 'paid') return b.payment_status === 'paid_cash' || b.payment_status === 'paid_transfer';
    if (tempFilters.payment_status === 'pending') return b.payment_status === 'pending';
    return b.payment_status === tempFilters.payment_status;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc số điện thoại khách hàng..."
              value={tempFilters.search}
              onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="relative sm:w-56">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={tempFilters.payment_status}
              onChange={(e) => setTempFilters({ ...tempFilters, payment_status: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none bg-white"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chưa thanh toán</option>
            </select>
          </div>

          <button
            onClick={handleFilterChange}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Tìm</span>
          </button>
          
          <button
            onClick={handleResetFilters}
            className="px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            title="Đặt lại"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách thanh toán...</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy thông tin thanh toán nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Khách Hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Lộ Trình</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ngày đi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phương thức (Gốc)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Số Tiền</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Trạng Thái TT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayBookings.map((b: any) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-sm text-gray-900">{b.customer_name}</div>
                      <div className="text-xs text-gray-500">{b.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 max-w-40 truncate" title={`${b.pickup_location} -> ${b.dropoff_location}`}>
                        {b.pickup_location} → {b.dropoff_location}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {formatDate(b.trip_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-600">
                      {b.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                      {formatCurrency(b.price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(b.payment_status)}`}>
                        {getPaymentStatusText(b.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => onViewBooking(b)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                        title="Xem đơn hàng"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {pagination.totalItems} kết quả (Đang xem trang {pagination.currentPage}/{pagination.totalPages})
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
