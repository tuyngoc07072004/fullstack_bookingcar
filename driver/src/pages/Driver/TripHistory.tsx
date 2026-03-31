import { DriverTrip, BOOKING_STATUS_TEXT, BOOKING_STATUS_COLORS, HistoryFilter } from '../../types/DriverTrip.types';
import { Calendar, MapPin, Users, Car, CheckCircle, Clock, Filter } from 'lucide-react';

interface TripHistoryProps {
  trips: DriverTrip[];
  loading?: boolean;
  historySource?: HistoryFilter;
  onHistorySourceChange?: (v: HistoryFilter) => void;
}

export default function TripHistory({ trips, loading, historySource = 'all', onHistorySourceChange }: TripHistoryProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa xác định';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        {onHistorySourceChange && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-600">Lọc:</span>
            {(['all', 'staff', 'driver'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onHistorySourceChange(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  historySource === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {key === 'all' ? 'Tất cả' : key === 'staff' ? 'NV phân công' : 'Tự tạo'}
              </button>
            ))}
          </div>
        )}
        <div className="bg-white p-16 rounded-3xl text-center border border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-gray-300" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lịch sử phù hợp</h3>
          <p className="text-gray-500">Thử đổi bộ lọc hoặc hoàn thành thêm chuyến.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onHistorySourceChange && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Lọc:</span>
          {(['all', 'staff', 'driver'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onHistorySourceChange(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                historySource === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {key === 'all' ? 'Tất cả' : key === 'staff' ? 'NV phân công' : 'Tự tạo'}
            </button>
          ))}
        </div>
      )}
      {trips.map(trip => (
        <div key={trip.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={18} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Thời gian</div>
                  <div className="font-semibold text-gray-800 text-sm">{formatDate(trip.trip_date)}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${BOOKING_STATUS_COLORS[trip.booking_status]}`}>
                  {BOOKING_STATUS_TEXT[trip.booking_status]}
                </span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  {trip.assignment_source === 'driver' ? 'Tự tạo' : 'NV phân công'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex gap-3 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <div className="w-0.5 h-12 bg-gray-200"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Điểm đón</div>
                  <div className="font-medium text-gray-700 text-sm line-clamp-1">{trip.pickup_location}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Điểm đến</div>
                  <div className="font-medium text-gray-700 text-sm line-clamp-1">{trip.dropoff_location}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} className="text-gray-400" />
                <span>{trip.total_occupancy}/{trip.vehicle_seats} khách</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Car size={14} className="text-gray-400" />
                <span>{trip.vehicle_name || `Xe ${trip.vehicle_seats} chỗ`}</span>
              </div>
            </div>

            {trip.end_time && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle size={12} className="text-emerald-500" />
                <span>Hoàn thành lúc: {formatDate(trip.end_time)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}