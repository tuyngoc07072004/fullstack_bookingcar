import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DriverTrip, BOOKING_STATUS_TEXT, BOOKING_STATUS_COLORS } from '../../types/DriverTrip.types';
import { Calendar, MapPin, Users, Car, CheckCircle, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { useAppDispatch } from '../../redux/store';
import { confirmCashPayment, createTransferPaymentForBooking, fetchPaymentStatus } from '../../redux/Payment/Payment.Slice';

interface TripCardProps {
  trip: DriverTrip;
  onConfirm: () => void;
  onComplete: () => void;
  isConfirming?: boolean;
  showReasonModal?: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  onConfirmWithReason?: () => void;
  onCancelReason?: () => void;
}

export default function TripCard({ 
  trip, 
  onConfirm, 
  onComplete,
  isConfirming = false,
  showReasonModal = false,
  reason = '',
  onReasonChange,
  onConfirmWithReason,
  onCancelReason
}: TripCardProps) {
  const dispatch = useAppDispatch();

  const [localPaymentStatus, setLocalPaymentStatus] = useState(trip.payment_status || 'pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'cash' | 'transfer' | null>(null);
  const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
  const [paymentPayUrl, setPaymentPayUrl] = useState<string | null>(null);
  const [paymentCreating, setPaymentCreating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentPollingCleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    setLocalPaymentStatus(trip.payment_status || 'pending');
  }, [trip.booking_id, trip.payment_status]);

  const paymentStatusText = useMemo(() => {
    const s = localPaymentStatus || 'pending';
    if (s === 'paid_cash') return 'Đã thanh toán tiền mặt';
    if (s === 'paid_transfer') return 'Đã thanh toán chuyển khoản';
    return 'Chưa thanh toán';
  }, [localPaymentStatus]);

  const getStatusBadge = () => {
    const baseClass = "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider";
    const colorClass = BOOKING_STATUS_COLORS[trip.booking_status] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`${baseClass} ${colorClass}`}>
        {BOOKING_STATUS_TEXT[trip.booking_status]}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa xác định';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAssigned = trip.booking_status === 'assigned' && trip.driver_confirm === 0;
  const isInProgress = trip.booking_status === 'in-progress';
  const isCompleted = trip.booking_status === 'completed';
  const occupancyRate = (trip.total_occupancy / trip.vehicle_seats) * 100;

  const canConfirmPayment = trip.booking_status !== 'cancelled' && localPaymentStatus === 'pending';
  const hasPaid = localPaymentStatus === 'paid_cash' || localPaymentStatus === 'paid_transfer';

  const stopAndClosePaymentModal = () => {
    if (paymentPollingCleanupRef.current) {
      paymentPollingCleanupRef.current();
      paymentPollingCleanupRef.current = null;
    }
    setShowPaymentModal(false);
    setPaymentOption(null);
    setPaymentQrCode(null);
    setPaymentPayUrl(null);
    setPaymentCreating(false);
    setPaymentError(null);
  };

  const startPollingPaymentPaid = (bookingId: string) => {
    if (paymentPollingCleanupRef.current) {
      paymentPollingCleanupRef.current();
      paymentPollingCleanupRef.current = null;
    }

    const interval = setInterval(async () => {
      try {
        const res = await dispatch(fetchPaymentStatus(bookingId)).unwrap();
        if (res?.payment_status && res.payment_status !== 'pending') {
          setLocalPaymentStatus(res.payment_status);
          clearInterval(interval);
          stopAndClosePaymentModal();
        }
      } catch (e) {
        // keep polling
      }
    }, 3000);

    paymentPollingCleanupRef.current = () => clearInterval(interval);
    return () => clearInterval(interval);
  };

  const handleChooseCash = async () => {
    if (!trip.booking_id) return;
    setPaymentError(null);
    try {
      await dispatch(confirmCashPayment(trip.booking_id)).unwrap();
      // optimistic update
      setLocalPaymentStatus('paid_cash');
      stopAndClosePaymentModal();
    } catch (e: any) {
      setPaymentError(e?.message || 'Xác nhận tiền mặt thất bại');
    }
  };

  const handleChooseTransfer = async () => {
    if (!trip.booking_id) return;
    setPaymentError(null);
    setPaymentCreating(true);
    setPaymentOption('transfer');

    try {
      const qrRes = await dispatch(createTransferPaymentForBooking(trip.booking_id)).unwrap();
      setPaymentCreating(false);
      setPaymentError(null);

      // Ưu tiên đi thẳng tới cổng MoMo (giống BookRide)
      if (qrRes.payUrl) {
        stopAndClosePaymentModal();
        window.location.href = qrRes.payUrl;
        return;
      }

      // Fallback: nếu không có payUrl thì hiển thị QR (nếu có)
      if (qrRes.qrCode) {
        setPaymentQrCode(qrRes.qrCode);
        setPaymentPayUrl(qrRes.payUrl);
        return;
      }

      setPaymentError('Không tạo được link thanh toán MoMo. Vui lòng thử lại.');
    } catch (e: any) {
      setPaymentCreating(false);
      setPaymentError(e?.message || 'Không tạo được QR chuyển khoản');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-emerald-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Thời gian đón</div>
              <div className="font-bold text-gray-800">{formatDate(trip.trip_date)}</div>
              {(trip.customer_name || trip.customer_phone) && (
                <div className="text-sm text-gray-600 mt-1">
                  {trip.customer_name ? trip.customer_name : 'Khách'}{' '}
                  {trip.customer_phone ? `(${trip.customer_phone})` : ''}
                </div>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Body */}
      <div className="p-6">
        {/* Route */}
        <div className="flex gap-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
            <div className="w-0.5 h-16 bg-linear-to-b from-emerald-300 to-red-300"></div>
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
          </div>
          <div className="flex-1 space-y-5">
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Điểm đón</div>
              <div className="font-semibold text-gray-800 flex items-start gap-2">
                <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{trip.pickup_location}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Điểm đến</div>
              <div className="font-semibold text-gray-800 flex items-start gap-2">
                <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{trip.dropoff_location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
              <Users size={14} /> Số khách
            </div>
            <div className="font-bold text-gray-800">
              {trip.total_occupancy} / {trip.vehicle_seats}
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyRate >= 80 ? 'bg-emerald-500' : occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Danh sách khách (booking)
              </div>
              <div className="space-y-2">
                <div className="text-sm font-bold text-gray-900">
                  {trip.customer_name || 'Khách'}{' '}
                  {trip.customer_phone ? (
                    <span className="text-xs font-semibold text-gray-500">
                      ({trip.customer_phone})
                    </span>
                  ) : null}
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-bold">Đón:</span> {trip.pickup_location}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-bold">Đến:</span> {trip.dropoff_location}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-xs font-bold text-gray-500">Thanh toán</div>
                  <div className="text-sm font-bold text-gray-900">{paymentStatusText}</div>
                </div>

                {canConfirmPayment && (
                  <button
                    onClick={() => {
                      setShowPaymentModal(true);
                      setPaymentOption(null);
                      setPaymentError(null);
                    }}
                    className="w-full mt-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Xác nhận thanh toán
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
              <Car size={14} /> Phương tiện
            </div>
            <div className="font-bold text-gray-800">
              {trip.vehicle_name || `Xe ${trip.vehicle_seats} chỗ`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isAssigned && !showReasonModal && (
            <button 
              onClick={onConfirm}
              disabled={isConfirming || !hasPaid}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold uppercase tracking-wide text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Xác Nhận Nhận Chuyến
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          )}

          {showReasonModal && (
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
                <AlertCircle size={18} />
                Công suất dưới 80% ({Math.round(occupancyRate)}%)
              </div>
              <p className="text-sm text-amber-600 mb-3">Vui lòng nhập lý do khởi hành khi chưa đủ khách:</p>
              <textarea 
                className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all mb-3"
                placeholder="Ví dụ: Khách yêu cầu đi gấp, xe hỏng..."
                value={reason}
                onChange={(e) => onReasonChange?.(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <button 
                  onClick={onCancelReason}
                  className="flex-1 bg-white border border-amber-200 text-amber-700 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={onConfirmWithReason}
                  disabled={!reason.trim() || !hasPaid}
                  className="flex-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed"
                >
                  Gửi & Khởi Hành
                </button>
              </div>
            </div>
          )}

          {isInProgress && (
            <button 
              onClick={onComplete}
              className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl font-bold uppercase tracking-wide text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Hoàn Thành Chuyến Đi
            </button>
          )}

          {isCompleted && (
            <div className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 text-sm">
              <Clock size={18} />
              Chuyến đã hoàn thành
            </div>
          )}
        </div>

        {/* Payment status line */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 border-l-4 border-emerald-300">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-gray-800">Thanh toán:</div>
            <div className="font-semibold">{paymentStatusText}</div>
          </div>
        </div>

        {/* Notes (if any) */}
        {trip.driver_notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border-l-4 border-emerald-400">
            "{trip.driver_notes}"
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Xác nhận thanh toán</h3>
              <button
                onClick={stopAndClosePaymentModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                  Khách cho chuyến này hiện đang: <span className="font-bold text-gray-900">{paymentStatusText}</span>
            </div>

            {!paymentOption && (
              <div className="space-y-2">
                <button
                  onClick={handleChooseCash}
                  className="w-full px-4 py-3 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl text-emerald-700 font-bold"
                >
                  Thanh toán tiền mặt
                </button>
                <button
                  onClick={handleChooseTransfer}
                  disabled={paymentCreating}
                  className="w-full px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl font-bold"
                >
                  {paymentCreating ? 'Đang tạo QR...' : 'Chuyển khoản (MoMo QR)'}
                </button>
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {paymentError}
                  </div>
                )}
              </div>
            )}

            {paymentOption === 'transfer' && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700">
                  Quét QR để thanh toán. Hệ thống sẽ tự cập nhật khi thanh toán thành công.
                </div>

                {paymentCreating ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                  </div>
                ) : paymentQrCode || paymentPayUrl ? (
                  <div className="flex flex-col items-center">
                    {paymentQrCode && (
                      <img
                        alt="QR MoMo"
                        className="w-44 h-44 rounded-xl border border-gray-100 bg-gray-50"
                        src={
                          paymentQrCode.startsWith('http')
                            ? paymentQrCode
                            : `data:image/png;base64,${paymentQrCode}`
                        }
                      />
                    )}
                    {paymentPayUrl && (
                      <a
                        href={paymentPayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-bold"
                      >
                        Mở trang thanh toán
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    Không có QR để hiển thị. Vui lòng thử lại.
                  </div>
                )}

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {paymentError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}