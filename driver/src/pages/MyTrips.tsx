import React, { useEffect, useState } from 'react';
import { 
  Car, Clock, Search, 
  Ticket, ArrowLeft, Navigation, Phone,
  CheckCircle2, AlertCircle, History, Loader, Star, Send
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { fetchReviewByBooking, submitReview } from '../redux/DriverReview/DriverReview.Slice';
import { Link } from 'react-router-dom';

import { Booking } from '../types/Booking.types';

export default function MyTrips() {
  const [phone, setPhone] = useState('');
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { reviewsByBooking, submitting } = useAppSelector((state) => state.driverReview);

  const [reviewForm, setReviewForm] = useState<Record<string, { rating: number, comment: string }>>({});

  const handleRatingChange = (bookingId: string, rating: number) => {
    setReviewForm(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], rating, comment: prev[bookingId]?.comment || '' } }));
  };

  const handleCommentChange = (bookingId: string, comment: string) => {
    setReviewForm(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], rating: prev[bookingId]?.rating || 0, comment } }));
  };

  const handleSubmitReview = async (bookingId: string) => {
    const form = reviewForm[bookingId];
    if (!form || form.rating === 0) {
      alert('Vui lòng chọn số sao để đánh giá');
      return;
    }
    try {
      await dispatch(submitReview({ bookingId, rating: form.rating, comment: form.comment })).unwrap();
      alert('Cảm ơn bạn đã đánh giá tài xế!');
    } catch (err: any) {
      alert(err || 'Có lỗi xảy ra khi gửi đánh giá');
    }
  };

  const handleSearch = async () => {
    if (!phone || phone.trim() === '') {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 số');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);
    
    try {
      // Gọi API đúng endpoint
      const response = await fetch(`http://localhost:5000/api/bookings/phone/${phone}`);
      const result = await response.json();
      
      console.log('API Response:', result); // Debug log
      
      if (result.success) {
        setTrips(result.data || []);
        if (result.data.length === 0) {
          setError('Không tìm thấy chuyến đi nào cho số điện thoại này');
        } else {
          // Fetch review state cho các chuyến hoàn thành
          result.data.forEach((trip: Booking) => {
            if (trip.status === 'completed') {
              dispatch(fetchReviewByBooking(trip._id));
            }
          });
        }
      } else {
        setError(result.message || 'Không thể tải danh sách chuyến đi');
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'assigned': 'Đã phân công',
      'in-progress': 'Đang thực hiện',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getVehicleTypeName = (booking: Booking): string => {
    if (booking.vehicleType) {
      return booking.vehicleType.type_name;
    }
    // Fallback based on seats
    const typeMap: Record<number, string> = {
      4: 'Xe 4 chỗ',
      7: 'Xe 7 chỗ',
      9: 'Xe 9 chỗ',
      16: 'Xe 16 chỗ',
      29: 'Xe 29 chỗ',
      45: 'Xe 45 chỗ'
    };
    return typeMap[booking.seats] || `Xe ${booking.seats} chỗ`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Banner Section */}
      <div className="relative bg-gray-900 text-white pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1920" 
            alt="Banner Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-8 font-bold">
            <ArrowLeft size={20} /> Quay Lại Trang Chủ
          </Link>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Hành Trình <br />
              Của Bạn
            </h1>
            <p className="text-gray-400 text-lg">
              Tra cứu lịch sử di chuyển, thông tin tài xế và trạng thái thanh toán của các chuyến đi đã đặt.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-3xl -mt-16 relative z-20">
        {/* Search Bar Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500">
                <Phone size={20} />
              </div>
              <input 
                type="tel" 
                placeholder="Nhập số điện thoại tra cứu..."
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-gray-900"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading || !phone}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 min-w-140"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
              {loading ? 'Đang tìm...' : 'Tra Cứu'}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">
            * Hệ thống sẽ hiển thị tất cả các chuyến đi liên kết với số điện thoại này.
          </p>
          {error && !loading && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-8 pb-20">
          {!hasSearched ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <History className="text-gray-200" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-400">Vui lòng nhập số điện thoại để bắt đầu</h3>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white h-64 rounded-4xl animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : trips.length > 0 ? (
            trips.map(trip => (
              <div key={trip._id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
                {/* Card Header */}
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4 bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Ticket className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Mã Chuyến Đi</div>
                      <div className="font-black text-gray-900">#CB-{trip._id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                  <StatusBadge status={trip.status} statusText={getStatusText(trip.status)} />
                </div>
                
                <div className="p-8 md:p-10">
                  <div className="flex gap-6 mb-10">
                    <div className="flex flex-col items-center gap-2 py-1">
                      <div className="w-4 h-4 rounded-full border-4 border-emerald-500 bg-white"></div>
                      <div className="w-0.5 flex-1 border-l-2 border-dashed border-gray-200"></div>
                      <div className="w-4 h-4 rounded-full border-4 border-red-500 bg-white"></div>
                    </div>
                    <div className="flex-1 space-y-10">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Điểm Đón</div>
                        <div className="font-bold text-lg text-gray-900">{trip.pickup_location}</div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={14} /> {formatDate(trip.trip_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Điểm Đến</div>
                        <div className="font-bold text-lg text-gray-900">{trip.dropoff_location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 border-t border-gray-50">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-gray-400 uppercase font-black mb-1">Loại Xe</div>
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        <Car size={16} className="text-emerald-500" />
                        {getVehicleTypeName(trip)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-gray-400 uppercase font-black mb-1">Số Khách</div>
                      <div className="font-bold text-gray-700">{trip.passengers} Người</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl col-span-2 md:col-span-1 border border-emerald-100">
                      <div className="text-[10px] text-emerald-600/60 uppercase font-black mb-1">Tổng Cước</div>
                      <div className="text-xl font-black text-emerald-600">
                        {trip.price.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {trip.tripAssignment?.driver && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <Car size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Tài xế</div>
                          <div className="font-bold text-blue-900">{trip.tripAssignment.driver.name}</div>
                          <div className="text-sm text-blue-600 flex items-center gap-1">
                            <Phone size={12} /> {trip.tripAssignment.driver.phone}
                          </div>
                        </div>
                        {trip.tripAssignment.vehicle && (
                          <div className="text-right">
                            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Biển số xe</div>
                            <div className="font-bold text-blue-900">{trip.tripAssignment.vehicle.license_plate}</div>
                          </div>
                        )}
                      </div>

                      {trip.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          {reviewsByBooking[trip._id] ? (
                            <div className="bg-white/60 p-3 rounded-xl">
                              <div className="text-xs font-bold text-gray-500 uppercase mb-1">Đánh giá của bạn:</div>
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star 
                                    key={star} 
                                    size={16} 
                                    className={star <= reviewsByBooking[trip._id]!.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                                  />
                                ))}
                              </div>
                              {reviewsByBooking[trip._id]!.comment && (
                                <p className="text-sm text-gray-700 italic">"{reviewsByBooking[trip._id]!.comment}"</p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                              <div className="text-sm font-bold text-gray-800 mb-2">Đánh giá tài xế</div>
                              <div className="flex gap-2 mb-3">
                                {[1, 2, 3, 4, 5].map(star => {
                                  const currentRating = reviewForm[trip._id]?.rating || 0;
                                  return (
                                    <button 
                                      key={star}
                                      onClick={() => handleRatingChange(trip._id, star)}
                                      className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                      <Star 
                                        size={24} 
                                        className={star <= currentRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"} 
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Nhận xét của bạn (không bắt buộc)..." 
                                  value={reviewForm[trip._id]?.comment || ''}
                                  onChange={(e) => handleCommentChange(trip._id, e.target.value)}
                                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                                />
                                <button 
                                  onClick={() => handleSubmitReview(trip._id)}
                                  disabled={submitting || !(reviewForm[trip._id]?.rating > 0)}
                                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 transition-colors"
                                >
                                  {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                                  Gửi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {trip.status === 'pending' && (
                    <div className="mt-8 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center gap-3 text-yellow-800 text-sm font-medium">
                      <AlertCircle size={18} />
                      Chuyến đi đang chờ nhân viên xác nhận. Chúng tôi sẽ gọi cho bạn sớm nhất.
                    </div>
                  )}
                  {trip.status === 'assigned' && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 text-blue-800 text-sm font-medium">
                      <CheckCircle2 size={18} />
                      Tài xế đã được phân công. Vui lòng chuẩn bị hành lý.
                    </div>
                  )}
                  {trip.status === 'in-progress' && (
                    <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-800 text-sm font-medium">
                      <Car size={18} />
                      Tài xế đang trên đường đến đón bạn.
                    </div>
                  )}
                  {trip.status === 'completed' && (
                    <div className="mt-8 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3 text-green-800 text-sm font-medium">
                      <CheckCircle2 size={18} />
                      Chuyến đi đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!
                    </div>
                  )}
                  {trip.status === 'cancelled' && (
                    <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-800 text-sm font-medium">
                      <AlertCircle size={18} />
                      {trip.low_occupancy_reason || 'Chuyến đi đã bị hủy'}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Navigation className="text-gray-200" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy chuyến đi</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Chúng tôi không tìm thấy lịch sử chuyến đi nào liên kết với số điện thoại này.</p>
              <Link to="/book-ride" className="inline-block mt-8 text-emerald-500 font-bold hover:underline">
                Đặt chuyến đi đầu tiên ngay &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, statusText }: { status: string; statusText: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    assigned: 'bg-purple-100 text-purple-700 border-purple-200',
    'in-progress': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {statusText}
    </span>
  );
}