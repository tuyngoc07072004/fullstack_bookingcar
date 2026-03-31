import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchDriverReviews } from '../../redux/DriverReview/DriverReview.Slice';
import { Star, MessageSquare, Calendar, Loader } from 'lucide-react';

export default function DriverReviewsList() {
  const dispatch = useAppDispatch();
  const { currentDriver } = useAppSelector((state) => state.driver);
  const { driverReviews, driverReviewStats, loadingDriverReviews } = useAppSelector((state) => state.driverReview);

  useEffect(() => {
    if (currentDriver?._id) {
      dispatch(fetchDriverReviews(currentDriver._id));
    }
  }, [dispatch, currentDriver?._id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loadingDriverReviews) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thống kê đánh giá */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-black text-emerald-500 mb-2">
              {driverReviewStats.avgRating > 0 ? driverReviewStats.avgRating.toFixed(1) : '0.0'}
            </div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={20} 
                  className={star <= Math.round(driverReviewStats.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-100"} 
                />
              ))}
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {driverReviewStats.total} Đánh giá
            </div>
          </div>
          
          <div className="h-px w-full md:w-px md:h-24 bg-gray-100"></div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <h3 className="text-xl font-black text-gray-900 mb-2">Đánh giá từ khách hàng</h3>
            <p className="text-gray-500 text-sm">
              Những đánh giá này được thu thập từ những hành khách đã sử dụng dịch vụ thông qua bạn. Giữ vững phong độ để nhận được nhiều sao hơn nhé!
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      <div className="grid gap-4 md:grid-cols-2">
        {driverReviews.length > 0 ? (
          driverReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-gray-900 mb-1">{review.customer_name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    {formatDate(review.created_at)}
                  </div>
                </div>
                <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-black text-yellow-700 ml-1">{review.rating}</span>
                </div>
              </div>
              
              {review.comment ? (
                <div className="text-gray-600 text-sm italic">"{review.comment}"</div>
              ) : (
                <div className="text-gray-400 text-sm italic">Khách hàng không để lại nhận xét.</div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <MessageSquare size={24} />
            </div>
            <div className="font-bold text-gray-500">Chưa có đánh giá nào</div>
          </div>
        )}
      </div>
    </div>
  );
}
