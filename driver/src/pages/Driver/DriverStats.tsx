import { DriverTrip, DriverTripStats } from '../../types/DriverTrip.types';
import { TrendingUp, Star, Award, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface DriverStatsProps {
  stats: DriverTripStats;
  trips: DriverTrip[];
}

export default function DriverStats({ stats, trips }: DriverStatsProps) {
  const completionRate = stats.totalTrips > 0 
    ? Math.round((stats.completedTrips / stats.totalTrips) * 100) 
    : 0;

  // Tính thu nhập theo từng ngày trong tuần hiện tại từ dữ liệu thực tế
  const DAY_LABELS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const DAY_ORDER  = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  // Lấy đầu tuần (Thứ 2) và cuối tuần (CN) của tuần hiện tại
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=CN, 1=T2, ..., 6=T7
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Khởi tạo map tổng thu nhập từng ngày = 0
  const earningsMap: Record<string, number> = {};
  DAY_ORDER.forEach(d => { earningsMap[d] = 0; });

  // Cộng dồn thu nhập từ chuyến đã hoàn thành trong tuần này
  trips.forEach(trip => {
    if (trip.booking_status !== 'completed') return;
    const dateStr = trip.end_time || trip.trip_date;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d < monday || d > sunday) return;
    const label = DAY_LABELS[d.getDay()];
    earningsMap[label] = (earningsMap[label] || 0) + (trip.price || 0);
  });

  const earningsData = DAY_ORDER.map(date => ({ date, earnings: earningsMap[date] }));

  const ratingData = [
    { name: '5 sao', value: 42, color: '#10B981' },
    { name: '4 sao', value: 28, color: '#34D399' },
    { name: '3 sao', value: 12, color: '#F59E0B' },
    { name: '2 sao', value: 5, color: '#F97316' },
    { name: '1 sao', value: 3, color: '#EF4444' },
  ];

  // ✅ FIX #1: Format currency for tooltip - proper typing with 'as any'
  const formatCurrencyTooltip = (value: any): string => {
    if (typeof value === 'number') {
      return `${value.toLocaleString('vi-VN')}đ`;
    }
    return '0đ';
  };

  // ✅ FIX #2: Format Y axis ticks
  const formatYAxisTick = (value: number): string => {
    return `${(value / 1000).toFixed(0)}k`;
  };

  // ✅ FIX #3: Format rating tooltip - proper typing with 'as any'
  const formatRatingTooltip = (value: any): string => {
    if (typeof value === 'number') {
      return `${value} đánh giá`;
    }
    return '0 đánh giá';
  };

  return (
    <div className="space-y-6">
      {/* Completion Rate Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            Hiệu Suất Làm Việc
          </h3>
          <div className="text-3xl font-black text-emerald-600">{completionRate}%</div>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-linear-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-emerald-500" />
            Hoàn thành: {stats.completedTrips}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-gray-400" />
            Tổng: {stats.totalTrips}
          </span>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <DollarSign className="text-emerald-500" size={20} />
          Thu Nhập Tuần Này
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
                formatter={formatCurrencyTooltip as any}
              />
              <Bar 
                dataKey="earnings" 
                fill="#10B981" 
                radius={[8, 8, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Tổng tuần</span>
          <span className="text-2xl font-bold text-gray-800">
            {earningsData.reduce((sum, d) => sum + d.earnings, 0).toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* Rating and Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Star className="text-yellow-500" size={20} />
            Đánh Giá
          </h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-4xl font-black text-gray-800">
                {stats.rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">/ 5.0</div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={24} 
                  className={star <= Math.floor(stats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={formatRatingTooltip as any}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Award className="text-emerald-500" size={20} />
            Thống Kê Nhanh
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
              <span className="text-gray-600 font-medium">Tổng thu nhập</span>
              <span className="text-xl font-bold text-emerald-600">
                {stats.earnings.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
              <span className="text-gray-600 font-medium">Tổng số chuyến</span>
              <span className="text-xl font-bold text-gray-800">
                {stats.totalTrips}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
              <span className="text-gray-600 font-medium">Chuyến hoàn thành</span>
              <span className="text-xl font-bold text-emerald-600">
                {stats.completedTrips}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
              <span className="text-gray-600 font-medium">Đánh giá trung bình</span>
              <span className="text-xl font-bold text-yellow-600">
                {stats.rating.toFixed(1)} / 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}