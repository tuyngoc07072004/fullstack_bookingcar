import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchBookingStats } from '../../redux/StaffBooking/StaffBooking.Slice';
import { fetchAllCustomers } from '../../redux/StaffCustomer/StaffCustomer.Slice';
import { staffBookingApi } from '../../redux/StaffBooking/StaffBooking.Api';

interface StatsTabProps {
  bookings: any[];
  customers: any[];
  drivers: any[];
  vehicles: any[];
}

export default function StatsTab({ drivers, vehicles }: StatsTabProps) {
  const dispatch = useAppDispatch();

  const { stats: bookingStats, loading: bookingStatsLoading } = useAppSelector((s) => s.staffBooking);
  const { customersPagination, customersLoading } = useAppSelector((s) => s.staffCustomer);

  const [revenueSeries, setRevenueSeries] = useState<{ date: string; revenue: number }[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  useEffect(() => {
    dispatch(fetchBookingStats());
    // Chỉ cần totalItems để lấy số khách thực tế
    dispatch(fetchAllCustomers({ page: 1, limit: 1 }));
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const loadRevenueSeries = async () => {
      setRevenueLoading(true);
      try {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6); // 7 ngày bao gồm hôm nay

        const startDate = start.toISOString();
        const endDate = now.toISOString();

        // Lấy booking completed 7 ngày gần nhất để dựng chart doanh thu theo ngày
        const res = await staffBookingApi.getBookings({
          status: 'completed',
          startDate,
          endDate,
          page: 1,
          limit: 500,
        });

        const bookings = res.data?.bookings || [];

        const dayKeys: string[] = [...Array(7)].map((_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          return d.toISOString().slice(0, 10);
        }).reverse();

        const revenueMap = new Map<string, number>();
        dayKeys.forEach((k) => revenueMap.set(k, 0));

        for (const b of bookings) {
          const key = typeof b.trip_date === 'string' ? b.trip_date.slice(0, 10) : String(b.trip_date).slice(0, 10);
          if (!revenueMap.has(key)) continue;
          revenueMap.set(key, (revenueMap.get(key) || 0) + (b.price || 0));
        }

        const series = dayKeys.map((k) => {
          const label = new Date(k).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          return { date: label, revenue: revenueMap.get(k) || 0 };
        });

        if (!cancelled) setRevenueSeries(series);
      } catch (e) {
        // Nếu lỗi, giữ series rỗng để không phá UI
        if (!cancelled) setRevenueSeries([]);
      } finally {
        if (!cancelled) setRevenueLoading(false);
      }
    };

    loadRevenueSeries();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookingPieData = useMemo(() => {
    const s = bookingStats;
    if (!s) {
      return [
        { name: 'Chờ', value: 0, color: '#EAB308' },
        { name: 'Xác nhận', value: 0, color: '#3B82F6' },
        { name: 'Đang đi', value: 0, color: '#10B981' },
        { name: 'Hoàn thành', value: 0, color: '#6B7280' },
      ];
    }

    return [
      { name: 'Chờ', value: s.pending || 0, color: '#EAB308' },
      { name: 'Xác nhận', value: s.confirmed || 0, color: '#3B82F6' },
      { name: 'Đang đi', value: s.inProgress || 0, color: '#10B981' },
      { name: 'Hoàn thành', value: s.completed || 0, color: '#6B7280' },
    ];
  }, [bookingStats]);

  const customerTotal = customersPagination?.totalItems ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Doanh Thu (7 ngày qua)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            {revenueLoading && (
              <div className="text-sm text-gray-500 mt-3">Đang tải doanh thu...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Trạng Thái Booking</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingPieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {bookingPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Tổng đơn</div>
          <div className="text-3xl font-bold text-gray-900">{bookingStats?.total || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Hoàn thành</div>
          <div className="text-3xl font-bold text-gray-900">{bookingStats?.completed || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Doanh thu hôm nay</div>
          <div className="text-3xl font-bold text-emerald-600">{formatCurrency(bookingStats?.revenue?.today || 0)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Tổng khách</div>
          <div className="text-3xl font-bold text-gray-900">{customerTotal}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Tài xế</div>
          <div className="text-3xl font-bold text-gray-900">{drivers.length}</div>
          {bookingStatsLoading && <div className="text-xs text-gray-500 mt-2">Đang tải...</div>}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Phương tiện</div>
          <div className="text-3xl font-bold text-gray-900">{vehicles.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Doanh thu 7 ngày</div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(bookingStats?.revenue?.week || 0)}</div>
          {customersLoading && <div className="text-xs text-gray-500 mt-2">Đang tải khách...</div>}
        </div>
      </div>
    </div>
  );
}