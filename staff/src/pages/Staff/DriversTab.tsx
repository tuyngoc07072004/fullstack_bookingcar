import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Search, Filter, 
  ChevronLeft, ChevronRight, Edit2, RefreshCw 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { 
  fetchAllDrivers, 
  fetchDriversByStatus,
  updateDriverStatusThunk,
  searchDriversThunk,
  selectDriverManagementLoading,
  selectDriverManagementError,
  selectSearchResults,
  selectDriverFilters,
  selectDisplayedDrivers,
  clearSearchResults,
  resetFilters,
  setFilters
} from '../../redux/DriverManagement/DriverManagement.Slice';
import { Driver } from '../../types/Driver.types';

interface DriversTabProps {
}

export default function DriversTab(props: DriversTabProps) {
  const dispatch = useAppDispatch();
  
  const drivers = useAppSelector(selectDisplayedDrivers);
  const loading = useAppSelector(selectDriverManagementLoading);
  const error = useAppSelector(selectDriverManagementError);
  const searchResults = useAppSelector(selectSearchResults);
  const filters = useAppSelector(selectDriverFilters);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'busy'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchAllDrivers());
    
    return () => {
      dispatch(clearSearchResults());
      dispatch(resetFilters());
    };
  }, [dispatch]);

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      dispatch(searchDriversThunk(searchKeyword.trim()));
      dispatch(setFilters({ searchKeyword: searchKeyword.trim() }));
    } else {
      dispatch(clearSearchResults());
      dispatch(setFilters({ searchKeyword: '' }));
      dispatch(fetchAllDrivers());
    }
    setCurrentPage(1);
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string) => {
    setSelectedStatus(status);
    if (status) {
      dispatch(fetchDriversByStatus(status));
      dispatch(setFilters({ status }));
    } else {
      dispatch(fetchAllDrivers());
      dispatch(setFilters({ status: null }));
    }
    setCurrentPage(1);
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!selectedDriver) return;
    
    setUpdating(true);
    try {
      
      const result = await dispatch(updateDriverStatusThunk({
        id: selectedDriver._id,
        status: { status: newStatus }
      })).unwrap();
      
      setShowStatusModal(false);
      setSelectedDriver(null);
      
      alert(`Đã cập nhật trạng thái tài xế ${result.name} thành ${getStatusText(newStatus)}`);
      
      if (filters.status) {
        dispatch(fetchDriversByStatus(filters.status));
      } else if (filters.searchKeyword) {
        dispatch(searchDriversThunk(filters.searchKeyword));
      } else {
        dispatch(fetchAllDrivers());
      }
    } catch (error: any) {
      alert(error.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Ngưng hoạt động';
      case 'busy': return 'Đang bận';
      default: return status;
    }
  };

  const totalPages = Math.ceil(drivers.length / itemsPerPage);
  const paginatedDrivers = drivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      active: {
        label: 'Đang hoạt động',
        color: 'bg-emerald-100 text-emerald-700',
        icon: <CheckCircle size={12} className="inline mr-1" />
      },
      inactive: {
        label: 'Ngưng hoạt động',
        color: 'bg-gray-100 text-gray-700',
        icon: <XCircle size={12} className="inline mr-1" />
      },
      busy: {
        label: 'Đang bận',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <AlertCircle size={12} className="inline mr-1" />
      }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải danh sách tài xế...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchAllDrivers())}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc số bằng lái..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm sm:text-base"
          />
        </div>
        
        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-4 sm:px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Search size={18} />
          <span className="hidden sm:inline">Tìm kiếm</span>
          <span className="sm:hidden">Tìm</span>
        </button>
        
        {/* Filter Dropdown */}
        <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterByStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none bg-white pr-10 text-sm sm:text-base"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
            <option value="busy">Đang bận</option>
          </select>
          <Filter size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => {
            setSearchKeyword('');
            setSelectedStatus('');
            dispatch(resetFilters());
            dispatch(fetchAllDrivers());
          }}
          className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>
      
      {/* Search Result Info */}
      {filters.searchKeyword && (
        <div className="mt-3 text-xs sm:text-sm text-gray-500">
          Kết quả tìm kiếm cho: <span className="font-medium text-gray-700">"{filters.searchKeyword}"</span>
          {searchResults.length > 0 ? (
            <span className="ml-2 text-emerald-600">({searchResults.length} tài xế)</span>
          ) : (
            <span className="ml-2 text-red-500">(Không tìm thấy)</span>
          )}
        </div>
      )}
      
      {filters.status && (
        <div className="mt-2 text-xs sm:text-sm text-gray-500">
          Đang lọc theo: <span className="font-medium text-gray-700">
            {filters.status === 'active' ? 'Đang hoạt động' : 
            filters.status === 'inactive' ? 'Ngưng hoạt động' : 'Đang bận'}
          </span>
        </div>
      )}
    </div>

      {/* Drivers Table */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
      {paginatedDrivers.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">Không tìm thấy tài xế nào</p>
        </div>
      ) : (
        <>
          <table className="min-w-[1100px] w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[60px]">STT</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[200px]">Tên Tài Xế</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[130px]">Số Điện Thoại</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[180px]">Số Bằng Lái</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[150px]">Trạng Thái</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[120px]">Ngày Đăng Ký</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-gray-600 w-[100px]">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDrivers.map((driver, index) => (
                <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{driver.name}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{driver.phone}</td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{driver.license_number}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={driver.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(driver.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setNewStatus(driver.status);
                          setShowStatusModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Thay đổi trạng thái"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, drivers.length)} trên {drivers.length} tài xế
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-emerald-500 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Cập nhật trạng thái tài xế</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2">
                  Tài xế: <span className="font-medium text-gray-900">{selectedDriver.name}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Trạng thái hiện tại: <StatusBadge status={selectedDriver.status} />
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive' | 'busy')}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                  <option value="busy">Đang bận</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedDriver(null);
                }}
                disabled={updating}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === selectedDriver.status}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}