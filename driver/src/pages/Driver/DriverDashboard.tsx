import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { driverLogout, resetState, updateDriverInfo } from '../../redux/Driver/Driver.Slice';
import { 
  Car, Clock, Navigation, DollarSign, Star, Briefcase, 
  CheckCircle, TrendingUp, LogOut, Home,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DriverTrip, DriverTripStats, ConfirmTripPayload, HistoryFilter } from '../../types/DriverTrip.types';
import * as driverTripApi from '../../redux/DriverTrip/DriverTrip.Api';
import DriverStatCard from './DriverStatCard';
import LogoutConfirmModal from './LogoutConfirmModal';
import ActiveTrips from './ActiveTrips';
import TripHistory from './TripHistory';
import DriverStats from './DriverStats';
import DriverStatusBadge from './DriverStatusBadge';
import DriverReviewsList from './DriverReviewsList';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDriver, token } = useAppSelector((state) => state.driver);
  const { loading: tripsLoading } = useAppSelector((state) => state.driverTrip);
  
  const [allTrips, setAllTrips] = useState<DriverTrip[]>([]);
  const [stats, setStats] = useState<DriverTripStats>({ totalTrips: 0, completedTrips: 0, earnings: 0, rating: 0 });
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'stats' | 'reviews'>('active');
  const [historySource, setHistorySource] = useState<HistoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<'active' | 'inactive' | 'busy'>('active');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch driver trips data
  const fetchDriverData = useCallback(async () => {
    if (!currentDriver?._id) return;
    
    try {
      setLoading(true);
      const [tripsData, statsData] = await Promise.all([
        driverTripApi.getDriverTrips(currentDriver._id),
        driverTripApi.getDriverTripStats(currentDriver._id)
      ]);
      
      setStats(statsData);
      setAllTrips(tripsData);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDriver?._id]);

  // Fetch driver status (polling)
  const fetchDriverStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      const statusData = await driverTripApi.getDriverStatus();
      if (statusData && currentDriver && statusData.status !== currentDriver.status) {
        console.log(`🔄 Status changed: ${currentDriver.status} → ${statusData.status}`);
        dispatch(updateDriverInfo({ ...currentDriver, status: statusData.status }));
        setOnlineStatus(statusData.status);
      } else if (statusData && !currentDriver) {
        setOnlineStatus(statusData.status);
      }
    } catch (error) {
      console.error('Error fetching driver status:', error);
      // Check if error is 401 unauthorized
      const err = error as any;
      if (err?.response?.status === 401) {
        handleLogout();
      }
    }
  }, [token, currentDriver, dispatch]);

  // Handle logout function (defined before use)
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    
    try {
      await dispatch(driverLogout()).unwrap();
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverInfo');
      setShowLogoutConfirm(false);
      navigate('/driver-login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverInfo');
      dispatch(resetState());
      setShowLogoutConfirm(false);
      navigate('/driver-login', { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  }, [dispatch, navigate]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const tokenFromStorage = localStorage.getItem('driverToken');
      const driverFromStorage = localStorage.getItem('driverInfo');
      
      if (!tokenFromStorage || !driverFromStorage) {
        console.log('⛔ No auth found, redirecting to login');
        navigate('/driver-login', { replace: true });
      } else if (!currentDriver && driverFromStorage) {
        const parsedDriver = JSON.parse(driverFromStorage);
        dispatch(updateDriverInfo(parsedDriver));
        setOnlineStatus(parsedDriver.status);
      } else if (currentDriver) {
        setOnlineStatus(currentDriver.status);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [currentDriver, navigate, dispatch]);

  // ✅ FIX #1: Fetch data when tab or driver changes - REMOVED 'loading' from dependency array
  // ❌ BEFORE (Infinite Loop):
  // useEffect(() => {
  //   if (currentDriver && !loading) {
  //     fetchDriverData();
  //   }
  // }, [currentDriver, activeTab, loading, fetchDriverData]);  // ← 'loading' causes infinite loop!

  // ✅ AFTER (Fixed):
  useEffect(() => {
    if (currentDriver) {
      fetchDriverData();
    }
  }, [currentDriver, fetchDriverData]);

  // Refresh trips periodically so payment status (momo paid) stays in sync.
  useEffect(() => {
    if (!currentDriver?._id) return;

    const interval = setInterval(() => {
      fetchDriverData();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentDriver?._id, fetchDriverData]);

  // Setup polling for driver status
  useEffect(() => {
    if (!currentDriver || !token) return;
    
    // Initial fetch
    fetchDriverStatus();
    
    // Setup interval
    pollingIntervalRef.current = setInterval(fetchDriverStatus, 10000);
    console.log('✅ Status polling started (10s interval)');
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('🧹 Status polling cleaned up');
      }
    };
  }, [currentDriver, token, fetchDriverStatus]);

  // Handle trip confirmation
  const handleConfirmTrip = async (assignmentId: string, bookingId: string, reason?: string) => {
    try {
      const payload: ConfirmTripPayload = { assignmentId, bookingId, reason };
      await driverTripApi.confirmTrip(payload);
      
      // Refresh data
      await fetchDriverData();
      
      // Show success message
      alert('Xác nhận nhận chuyến thành công!');
    } catch (error: any) {
      console.error('Error confirming trip:', error);
      alert(error?.message || 'Xác nhận chuyến thất bại');
    }
  };

  // Handle trip completion
  const handleCompleteTrip = async (bookingId: string) => {
    try {
      await driverTripApi.completeTrip(bookingId);
      
      // Refresh data
      await fetchDriverData();
      
      alert('Hoàn thành chuyến đi thành công!');
    } catch (error: any) {
      console.error('Error completing trip:', error);
      alert(error?.message || 'Hoàn thành chuyến thất bại');
    }
  };

  if (loading && !currentDriver) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!currentDriver) {
    return null;
  }

  const activeTrips = allTrips.filter(t => t.booking_status !== 'completed' && t.booking_status !== 'cancelled');
  const completedTrips = allTrips.filter(t => {
    const ended = t.booking_status === 'completed' || t.booking_status === 'cancelled';
    if (!ended) return false;
    if (historySource === 'all') return true;
    const src = t.assignment_source || 'staff';
    return historySource === src;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-12">
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        loading={logoutLoading}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      {/* Header Section */}
      <div className="bg-linear-to-r from-gray-900 via-gray-800 to-emerald-900 text-white pb-20 pt-8 shadow-xl">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Driver Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg shadow-emerald-500/30">
                  {currentDriver.name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-gray-900 ${
                  onlineStatus === 'active' ? 'bg-emerald-500 animate-pulse' :
                  onlineStatus === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{currentDriver.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Car size={14} className="text-gray-400" />
                  <p className="text-gray-300 text-sm">{currentDriver.license_number || 'Chưa có bằng lái'}</p>
                </div>
                <p className="text-gray-400 text-xs mt-1">@{currentDriver.username}</p>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-3">
              <DriverStatusBadge status={onlineStatus} size="lg" />
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl border border-red-500/30 transition-all"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl -mt-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <DriverStatCard 
            icon={<Briefcase className="text-blue-500" />} 
            label="Tổng Chuyến" 
            value={stats.totalTrips} 
          />
          <DriverStatCard 
            icon={<DollarSign className="text-emerald-500" />} 
            label="Thu Nhập" 
            value={stats.earnings.toLocaleString('vi-VN') + 'đ'} 
          />
          <DriverStatCard 
            icon={<Star className="text-yellow-500" />} 
            label="Đánh Giá" 
            value={stats.rating.toFixed(1)} 
          />
          <DriverStatCard 
            icon={<CheckCircle className="text-purple-500" />} 
            label="Hoàn Thành" 
            value={stats.completedTrips} 
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => navigate('/')}
            className="flex gap-2 items-center cursor-pointer px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:text-emerald-500"
          >   
            <Home size={20} />
            <span>Trang chủ</span>
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'active' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Navigation size={18} />
              Chuyến Hiện Tại
              {activeTrips.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                  {activeTrips.length}
                </span>
              )}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'history' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              Lịch Sử
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'stats' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={18} />
              Thống Kê
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'reviews' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star size={18} />
              Đánh Giá
            </div>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/driver/create-trip')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-gray-500 hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={18} />
            Tạo chuyến
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'stats' ? (
              <DriverStats stats={stats} trips={allTrips} />
            ) : activeTab === 'active' ? (
              <ActiveTrips
                trips={activeTrips}
                onConfirm={handleConfirmTrip}
                onComplete={handleCompleteTrip}
                loading={tripsLoading}
              />
            ) : activeTab === 'reviews' ? (
              <DriverReviewsList />
            ) : (
              <TripHistory
                trips={completedTrips}
                historySource={historySource}
                onHistorySourceChange={setHistorySource}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}