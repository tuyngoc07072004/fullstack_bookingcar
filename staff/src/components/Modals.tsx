import React, { useState } from 'react';
import { X, User, Car, CalendarClock, UserCircle } from 'lucide-react';
import { StatusBadge } from './Common';
import { useAppDispatch } from '../redux/store';
import { confirmCashPayment } from '../redux/Payment/Payment.Slice';

function safeDateLabel(value: unknown): string | null {
  if (value == null || value === '') return null;
  try {
    const d = new Date(value as string);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('vi-VN');
  } catch {
    return null;
  }
}

export function ViewBookingModal({ booking, onClose }: any) {
  const dispatch = useAppDispatch();
  const [confirmingCash, setConfirmingCash] = useState(false);

  const ta = booking.tripAssignment;
  const hasAssignment =
    ta &&
    (ta.driver || ta.driver_id || ta.vehicle || ta.vehicle_id);

  const driver = ta?.driver;
  const vehicle = ta?.vehicle;
  const staff =
    ta?.staff_id && typeof ta.staff_id === 'object'
      ? ta.staff_id
      : null;

  const paymentStatus = booking.payment_status || 'pending';
  const paymentMethod = booking.payment_method || booking.payment_method_text;

  const paymentStatusText =
    paymentStatus === 'paid_cash'
      ? 'Đã thanh toán tiền mặt'
      : paymentStatus === 'paid_transfer'
        ? 'Đã thanh toán chuyển khoản'
        : 'Chưa thanh toán';

  const allowConfirmCash = booking.payment_method === 'cash' && paymentStatus === 'pending';

  const handleConfirmCash = async () => {
    if (!booking?._id) return;
    setConfirmingCash(true);
    try {
      await dispatch(confirmCashPayment(booking._id)).unwrap();
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Xác nhận thanh toán thất bại');
    } finally {
      setConfirmingCash(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Chi Tiết Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-500">Trạng thái</label>
            <StatusBadge status={booking.status} />
            {booking.status_text && (
              <span className="text-sm text-gray-600">({booking.status_text})</span>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Khách hàng</label>
            <p className="font-medium">{booking.customer_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Số điện thoại</label>
            <p className="font-medium">{booking.customer_phone}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Điểm đón</label>
            <p className="font-medium">{booking.pickup_location}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Điểm đến</label>
            <p className="font-medium">{booking.dropoff_location}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Thời gian chuyến</label>
            <p className="font-medium">{new Date(booking.trip_date).toLocaleString('vi-VN')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Số khách</label>
              <p className="font-medium">{booking.passengers} người</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Loại xe (số chỗ)</label>
              <p className="font-medium">{booking.seats} chỗ</p>
            </div>
          </div>
          {booking.payment_method_text != null && (
            <div>
              <label className="text-sm text-gray-500">Thanh toán</label>
              <p className="font-medium">{booking.payment_method_text}</p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500">Trạng thái thanh toán</label>
            <p className="font-medium">{paymentStatusText}</p>
            {allowConfirmCash && (
              <button
                onClick={handleConfirmCash}
                disabled={confirmingCash}
                className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
              >
                {confirmingCash ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán tiền mặt'}
              </button>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Giá</label>
            <p className="font-medium">{booking.price?.toLocaleString('vi-VN')}đ</p>
          </div>

          {hasAssignment && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                <UserCircle size={18} />
                Phân công tài xế và xe
              </h4>
              {driver && (
                <div className="flex gap-2 text-sm">
                  <User size={16} className="text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">Tài xế</div>
                    <p className="font-medium text-gray-900">
                      {driver.name}
                      {driver.phone ? ` · ${driver.phone}` : ''}
                    </p>
                  </div>
                </div>
              )}
              {vehicle && (
                <div className="flex gap-2 text-sm">
                  <Car size={16} className="text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">Xe</div>
                    <p className="font-medium text-gray-900">
                      {vehicle.vehicle_name || '—'} — {vehicle.license_plate || '—'}
                      {vehicle.seats != null ? ` (${vehicle.seats} chỗ)` : ''}
                    </p>
                  </div>
                </div>
              )}
              {staff && (staff.name || staff.username) && (
                <div className="text-sm">
                  <div className="text-gray-500 text-xs">Nhân viên phân công</div>
                  <p className="font-medium text-gray-900">
                    {staff.name || staff.username}
                  </p>
                </div>
              )}
              {safeDateLabel(ta.assigned_at) && (
                <div className="flex gap-2 text-sm items-start">
                  <CalendarClock size={16} className="text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">Thời điểm phân công</div>
                    <p className="font-medium text-gray-900">{safeDateLabel(ta.assigned_at)}</p>
                  </div>
                </div>
              )}
              {safeDateLabel(ta.start_time) && (
                <div className="text-sm">
                  <div className="text-gray-500 text-xs">Bắt đầu chuyến</div>
                  <p className="font-medium text-gray-900">{safeDateLabel(ta.start_time)}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewCustomerModal({ customer, bookings, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Chi Tiết Khách Hàng</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl">
            <h4 className="font-medium mb-3">Thông tin cá nhân</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Họ tên</div>
                <div className="font-medium">{customer.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Số điện thoại</div>
                <div className="font-medium">{customer.phone}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{customer.email || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Lịch sử đặt xe ({bookings.length})</h4>
            <div className="space-y-3">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="border rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">#{booking.id}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Đón: {booking.pickup_location}</div>
                    <div>Đến: {booking.dropoff_location}</div>
                    <div>Thời gian: {new Date(booking.trip_date).toLocaleString('vi-VN')}</div>
                    <div>Giá: {booking.price?.toLocaleString('vi-VN')}đ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssignmentModal({ booking, drivers, vehicles, occupancy, assignment, setAssignment, onAssign, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Phân Công Chuyến Đi</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Tài Xế
            </label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl"
              onChange={(e) => setAssignment({...assignment, driverId: parseInt(e.target.value)})}
            >
              <option value="">-- Chọn tài xế --</option>
              {drivers.filter((d: any) => d.status === 'active').map((driver: any) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} - {driver.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Xe
            </label>
            <select
              className="w-full p-3 border border-gray-200 rounded-xl"
              onChange={(e) => setAssignment({...assignment, vehicleId: parseInt(e.target.value)})}
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map((vehicle: any) => {
                const occ = occupancy.find((o: any) => o.vehicle_id === vehicle.id);
                const currentPassengers = occ ? occ.total_passengers : 0;
                const remainingSeats = vehicle.seats - currentPassengers;
                const isFull = remainingSeats < booking.passengers;

                return (
                  <option key={vehicle.id} value={vehicle.id} disabled={isFull}>
                    {vehicle.license_plate} - {vehicle.type_name} ({currentPassengers}/{vehicle.seats} chỗ)
                    {isFull ? ' - HẾT CHỖ' : ` - Còn ${remainingSeats} chỗ`}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={onAssign}
            disabled={!assignment.driverId || !assignment.vehicleId}
            className="w-full mt-4 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Xác Nhận Phân Công
          </button>
        </div>
      </div>
    </div>
  );
}