import React, { useState, useEffect } from 'react'; 
import { 
  CheckCircle, AlertCircle, Search, Filter, 
  ChevronLeft, ChevronRight, Edit2, RefreshCw, 
  Plus, Trash2, Car, Settings, Eye, X 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { 
  fetchAllVehicles,
  fetchVehiclesByStatus,
  fetchVehiclesBySeats,
  searchVehicles,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
  fetchVehicleStats,
  addVehicle,  
  clearError,
  clearMessage
} from '../../redux/Vehicle/Vehicle.Slice';
import { 
  Vehicle, 
  VehicleStatus, 
  VehicleSeatCount,
  VEHICLE_SEAT_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
  getStatusText,
} from '../../types/Vehicle.types';

export default function VehiclesTab() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { vehicles, loading, error, success, message, stats } = useAppSelector(
    (state) => state.vehicle
  );
  const staffToken = useAppSelector((state) => state.staff.token);
  
  // Local state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateVehicle, setStatusUpdateVehicle] = useState<Vehicle | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleStatus>('ready');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_name: '',
    license_plate: '',
    seats: 9 as VehicleSeatCount,
    status: 'ready' as VehicleStatus
  });
  
  const itemsPerPage = 10;

  // Helper: Lấy token từ Redux hoặc localStorage
  const getToken = (): string | null => {
    if (staffToken) return staffToken;
    const localToken = localStorage.getItem('staffToken');
    if (localToken) return localToken;
    const sessionToken = sessionStorage.getItem('staffToken');
    return sessionToken;
  };

  // Fetch data khi component mount
  useEffect(() => {
    dispatch(fetchAllVehicles());
    dispatch(fetchVehicleStats());
    
    return () => {
      dispatch(clearError());
      dispatch(clearMessage());
    };
  }, [dispatch]);

  // Hiển thị toast message
  useEffect(() => {
    if (success && message) {
      setToastMessage({ type: 'success', text: message });
      setTimeout(() => setToastMessage(null), 3000);
      dispatch(clearMessage());
    }
    if (error) {
      setToastMessage({ type: 'error', text: error });
      setTimeout(() => setToastMessage(null), 3000);
      dispatch(clearError());
    }
  }, [success, error, message, dispatch]);

  // Handle search
  const handleSearch = () => {
    if (searchKeyword.trim()) {
      dispatch(searchVehicles({ keyword: searchKeyword.trim(), page: currentPage, limit: itemsPerPage }));
    } else {
      if (selectedStatus) {
        dispatch(fetchVehiclesByStatus(selectedStatus as VehicleStatus));
      } else if (selectedSeats) {
        dispatch(fetchVehiclesBySeats(parseInt(selectedSeats) as VehicleSeatCount));
      } else {
        dispatch(fetchAllVehicles());
      }
    }
    setCurrentPage(1);
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string) => {
    setSelectedStatus(status);
    setSelectedSeats('');
    setSearchKeyword('');
    if (status) {
      dispatch(fetchVehiclesByStatus(status as VehicleStatus));
    } else {
      dispatch(fetchAllVehicles());
    }
    setCurrentPage(1);
  };

  // Handle filter by seats
  const handleFilterBySeats = (seats: string) => {
    setSelectedSeats(seats);
    setSelectedStatus('');
    setSearchKeyword('');
    if (seats) {
      dispatch(fetchVehiclesBySeats(parseInt(seats) as VehicleSeatCount));
    } else {
      dispatch(fetchAllVehicles());
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedStatus('');
    setSelectedSeats('');
    dispatch(fetchAllVehicles());
    setCurrentPage(1);
  };

  // Open add modal
  const handleAddVehicle = () => {
    const token = getToken();
    if (!token) {
      setToastMessage({ type: 'error', text: 'Vui lòng đăng nhập lại để thêm xe' });
      return;
    }
    setModalMode('add');
    setFormData({
      vehicle_name: '',
      license_plate: '',
      seats: 9,
      status: 'ready'
    });
    setSelectedVehicle(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEditVehicle = (vehicle: Vehicle) => {
    setModalMode('edit');
    setSelectedVehicle(vehicle);
    setFormData({
      vehicle_name: vehicle.vehicle_name,
      license_plate: vehicle.license_plate,
      seats: vehicle.seats,
      status: vehicle.status
    });
    setShowModal(true);
  };

  // Open view modal
  const handleViewVehicle = (vehicle: Vehicle) => {
    setModalMode('view');
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  // Open status update modal
  const handleOpenStatusModal = (vehicle: Vehicle) => {
    setStatusUpdateVehicle(vehicle);
    setNewStatus(vehicle.status);
    setShowStatusModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  };

  // Submit form (add or edit)
  const handleSubmitForm = async () => {
    if (!formData.vehicle_name.trim()) {
      setToastMessage({ type: 'error', text: 'Vui lòng nhập tên xe' });
      return;
    }
    
    if (!formData.license_plate.trim()) {
      setToastMessage({ type: 'error', text: 'Vui lòng nhập biển số xe' });
      return;
    }
    
    const token = getToken();
    if (!token) {
      setToastMessage({ type: 'error', text: 'Vui lòng đăng nhập lại để thực hiện thao tác này' });
      return;
    }
    
    setUpdating(true);
    
    try {
      if (modalMode === 'add') {
        await dispatch(addVehicle(formData)).unwrap();
        setToastMessage({ type: 'success', text: 'Thêm xe thành công' });
      } else if (modalMode === 'edit' && selectedVehicle) {
        await dispatch(updateVehicle({
          id: selectedVehicle._id,
          payload: {
            vehicle_name: formData.vehicle_name,
            license_plate: formData.license_plate,
            seats: formData.seats,
            status: formData.status
          }
        })).unwrap();
        setToastMessage({ type: 'success', text: 'Cập nhật xe thành công' });
      }
      
      setShowModal(false);
      refreshData();
    } catch (err: any) {
      // Submit form error occurred flock
      setToastMessage({ type: 'error', text: err?.message || 'Thao tác thất bại' });
    } finally {
      setUpdating(false);
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!statusUpdateVehicle) return;
    
    const token = getToken();
    if (!token) {
      setToastMessage({ type: 'error', text: 'Vui lòng đăng nhập lại' });
      return;
    }
    
    setUpdating(true);
    try {
      await dispatch(updateVehicleStatus({
        id: statusUpdateVehicle._id,
        payload: { status: newStatus }
      })).unwrap();
      
      setToastMessage({ type: 'success', text: `Đã cập nhật trạng thái xe thành ${getStatusText(newStatus)}` });
      setShowStatusModal(false);
      setStatusUpdateVehicle(null);
      refreshData();
    } catch (err: any) {
      // Update status error occurred flock flock
      setToastMessage({ type: 'error', text: err?.message || 'Cập nhật trạng thái thất bại' });
    } finally {
      setUpdating(false);
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    const token = getToken();
    if (!token) {
      setToastMessage({ type: 'error', text: 'Vui lòng đăng nhập lại' });
      return;
    }
    
    setUpdating(true);
    try {
      await dispatch(deleteVehicle(vehicleToDelete._id)).unwrap();
      setToastMessage({ type: 'success', text: `Đã xóa xe ${vehicleToDelete.vehicle_name}` });
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
      refreshData();
    } catch (err: any) {
      // Delete vehicle error occurred flock flock flock
      setToastMessage({ type: 'error', text: err?.message || 'Xóa xe thất bại' });
    } finally {
      setUpdating(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    if (selectedStatus) {
      dispatch(fetchVehiclesByStatus(selectedStatus as VehicleStatus));
    } else if (selectedSeats) {
      dispatch(fetchVehiclesBySeats(parseInt(selectedSeats) as VehicleSeatCount));
    } else if (searchKeyword) {
      dispatch(searchVehicles({ keyword: searchKeyword, page: currentPage, limit: itemsPerPage }));
    } else {
      dispatch(fetchAllVehicles());
    }
    dispatch(fetchVehicleStats());
  };

  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const paginatedVehicles = vehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status badge component
  const StatusBadge = ({ status }: { status: VehicleStatus }) => {
    const statusConfig: Record<VehicleStatus, { label: string; color: string; icon: React.ReactElement }> = {
      ready: {
        label: 'Chuẩn bị khởi hành',
        color: 'bg-emerald-100 text-emerald-700',
        icon: <CheckCircle size={12} className="inline mr-1" />
      },
      not_started: {
        label: 'Chưa khởi hành',
        color: 'bg-yellow-100 text-yellow-700',
        icon: <AlertCircle size={12} className="inline mr-1" />
      },
      completed: {
        label: 'Đã hoàn thành',
        color: 'bg-blue-100 text-blue-700',
        icon: <CheckCircle size={12} className="inline mr-1" />
      }
    };

    const config = statusConfig[status];
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải danh sách xe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng số xe</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Car size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chuẩn bị khởi hành</p>
                <p className="text-2xl font-bold text-green-600">{stats.by_status['Chuẩn bị khởi hành'] || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chưa khởi hành</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.by_status['Chưa khởi hành'] || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-blue-600">{stats.by_status['Đã hoàn thành chuyến đi'] || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Search Input and Search Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên xe hoặc biển số..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm sm:text-base"
            />
          </div>
          
          <button
            onClick={handleSearch}
            className="px-4 sm:px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Search size={18} />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <span className="sm:hidden">Tìm</span>
          </button>
        </div>

        {/* Row 2: Filters and Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter by Status */}
          <div className="flex-1 relative">
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterByStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none bg-white pr-10 text-sm sm:text-base"
            >
              <option value="">Tất cả trạng thái</option>
              {VEHICLE_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Filter size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Filter by Seats */}
          <div className="flex-1 relative">
            <select
              value={selectedSeats}
              onChange={(e) => handleFilterBySeats(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none bg-white pr-10 text-sm sm:text-base"
            >
              <option value="">Tất cả số chỗ</option>
              {VEHICLE_SEAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Settings size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Action Buttons Group */}
          <div className="flex gap-3">
            {/* Add Vehicle Button */}
            <button
              onClick={handleAddVehicle}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Thêm xe</span>
              <span className="sm:hidden">Thêm</span>
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={handleResetFilters}
              className="px-3 sm:px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Search Result Info */}
      {searchKeyword && (
        <div className="mt-3 text-xs sm:text-sm text-gray-500">
          Kết quả tìm kiếm cho: <span className="font-medium text-gray-700">"{searchKeyword}"</span>
          {vehicles.length > 0 ? (
            <span className="ml-2 text-emerald-600">({vehicles.length} xe)</span>
          ) : (
            <span className="ml-2 text-red-500">(Không tìm thấy)</span>
          )}
        </div>
      )}
      
      {/* Filter Info */}
      {(selectedStatus || selectedSeats) && (
        <div className="mt-2 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <span>Đang lọc theo:</span>
          {selectedStatus && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-gray-700">
                {VEHICLE_STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.label}
              </span>
              <button
                onClick={() => handleFilterByStatus('')}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Bỏ lọc"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {selectedStatus && selectedSeats && <span>•</span>}
          {selectedSeats && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-gray-700">
                {VEHICLE_SEAT_OPTIONS.find(opt => opt.value.toString() === selectedSeats)?.label}
              </span>
              <button
                onClick={() => handleFilterBySeats('')}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Bỏ lọc"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {paginatedVehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Không tìm thấy xe nào</p>
            <button
              onClick={handleAddVehicle}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
            >
              Thêm xe mới
            </button>
          </div>
        ) : (
          <>
            <table className="min-w-[1200px] w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[60px]">STT</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[200px]">Tên Xe</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[150px]">Biển Số</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[100px]">Số Chỗ</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[150px]">Loại Xe</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[180px]">Trạng Thái</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600 w-[120px]">Ngày Tạo</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-600 w-[180px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedVehicles.map((vehicle, index) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{vehicle.vehicle_name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-gray-600">{vehicle.license_plate}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">
                        {vehicle.seats} chỗ
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{vehicle.vehicle_type}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(vehicle.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewVehicle(vehicle)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(vehicle)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Đổi trạng thái"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehicle)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa xe"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, vehicles.length)} trên {vehicles.length} xe
                </div>
                <div className="flex gap-2">
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
      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === 'add' && 'Thêm xe mới'}
              {modalMode === 'edit' && 'Chỉnh sửa thông tin xe'}
              {modalMode === 'view' && 'Chi tiết xe'}
            </h3>
            
            {modalMode === 'view' && selectedVehicle ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Tên xe</label>
                    <p className="font-medium text-gray-900">{selectedVehicle.vehicle_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Biển số</label>
                    <p className="font-mono font-medium text-gray-900">{selectedVehicle.license_plate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Số chỗ</label>
                    <p className="font-medium text-gray-900">{selectedVehicle.seats} chỗ</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Loại xe</label>
                    <p className="font-medium text-gray-900">{selectedVehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Trạng thái</label>
                    <div className="mt-1">
                      <StatusBadge status={selectedVehicle.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Ngày tạo</label>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedVehicle.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle_name}
                    onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="Nhập tên xe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biển số xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                    placeholder="VD: 51A-12345"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số chỗ ngồi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) as VehicleSeatCount })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {VEHICLE_SEAT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {VEHICLE_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {modalMode === 'view' ? 'Đóng' : 'Hủy'}
              </button>
              {modalMode !== 'view' && (
                <button
                  onClick={handleSubmitForm}
                  disabled={updating}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Đang xử lý...' : (modalMode === 'add' ? 'Thêm xe' : 'Cập nhật')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && statusUpdateVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Cập nhật trạng thái xe</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 mb-2">
                  Xe: <span className="font-medium text-gray-900">{statusUpdateVehicle.vehicle_name}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Biển số: <span className="font-mono text-gray-900">{statusUpdateVehicle.license_plate}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Trạng thái hiện tại: <StatusBadge status={statusUpdateVehicle.status} />
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as VehicleStatus)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  {VEHICLE_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdateVehicle(null);
                }}
                disabled={updating}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === statusUpdateVehicle.status}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && vehicleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Xác nhận xóa xe</h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa xe <span className="font-bold text-gray-900">{vehicleToDelete.vehicle_name}</span>?
                <br />
                <span className="text-sm text-red-500">Hành động này không thể hoàn tác!</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setVehicleToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  disabled={updating}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Đang xóa...' : 'Xóa xe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}