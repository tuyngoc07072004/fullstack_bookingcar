import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DriverTrip, BOOKING_STATUS_TEXT, BOOKING_STATUS_COLORS } from '../../types/DriverTrip.types';
import { Calendar, MapPin, Users, Car, CheckCircle, AlertCircle, ChevronRight, Clock, XCircle } from 'lucide-react';
import { useAppDispatch } from '../../redux/store';
import { confirmCashPayment, createTransferPaymentForBooking, fetchPaymentStatus } from '../../redux/Payment/Payment.Slice';

interface TripCardProps {
  trip: DriverTrip;
  onConfirm: () => void;
  onDecline: (bookingId: string, assignmentId: string, reason?: string) => void;
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
  onDecline,
  onComplete,
  isConfirming = false,
  showReasonModal = false,
  reason = '',
  onReasonChange,
  onConfirmWithReason,
  onCancelReason
}: TripCardProps) {
  const dispatch = useAppDispatch();

  const [localPaymentStatuses, setLocalPaymentStatuses] = useState<Record<string, 'pending' | 'paid_cash' | 'paid_transfer'>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentBookingId, setSelectedPaymentBookingId] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<'cash' | 'transfer' | null>(null);
  const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
  const [paymentPayUrl, setPaymentPayUrl] = useState<string | null>(null);
  const [paymentCreating, setPaymentCreating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentPollingCleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    const customers = trip.customers && trip.customers.length > 0
      ? trip.customers
      : [{
          booking_id: trip.booking_id,
          payment_status: trip.payment_status || 'pending'
        }];

    const statusMap: Record<string, 'pending' | 'paid_cash' | 'paid_transfer'> = {};
    customers.forEach((c: any) => {
      statusMap[c.booking_id] = (c.payment_status || 'pending') as 'pending' | 'paid_cash' | 'paid_transfer';
    });
    setLocalPaymentStatuses(statusMap);
  }, [trip.booking_id, trip.customers, trip.payment_status]);

  const paymentStatusText = useMemo(() => {
    return (status?: string) => {
      const s = status || 'pending';
      if (s === 'paid_cash') return 'Đã thanh toán tiền mặt';
      if (s === 'paid_transfer') return 'Đã thanh toán chuyển khoản';
      return 'Chưa thanh toán';
    };
  }, []);

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
  const allPaid = Object.values(localPaymentStatuses).every(s => s !== 'pending');
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const occupancyRate = (trip.total_occupancy / trip.vehicle_seats) * 100;

  const hasPaid = Object.values(localPaymentStatuses).some((s) => s === 'paid_cash' || s === 'paid_transfer');

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedDeclineCustomer, setSelectedDeclineCustomer] = useState<{ booking_id: string; assignment_id?: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const stopAndClosePaymentModal = () => {
    if (paymentPollingCleanupRef.current) {
      paymentPollingCleanupRef.current();
      paymentPollingCleanupRef.current = null;
    }
    setShowPaymentModal(false);
    setSelectedPaymentBookingId(null);
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
          setLocalPaymentStatuses((prev) => ({
            ...prev,
            [bookingId]: res.payment_status
          }));
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
    if (!selectedPaymentBookingId) return;
    setPaymentError(null);
    try {
      await dispatch(confirmCashPayment(selectedPaymentBookingId)).unwrap();
      setLocalPaymentStatuses((prev) => ({
        ...prev,
        [selectedPaymentBookingId]: 'paid_cash'
      }));
      stopAndClosePaymentModal();
    } catch (e: any) {
      setPaymentError(e?.message || 'Xác nhận tiền mặt thất bại');
    }
  };

  const handleChooseTransfer = async () => {
    if (!selectedPaymentBookingId) return;
    setPaymentError(null);
    setPaymentCreating(true);
    setPaymentOption('transfer');

    try {
      const qrRes = await dispatch(createTransferPaymentForBooking(selectedPaymentBookingId)).unwrap();
      setPaymentCreating(false);
      setPaymentError(null);

      // Ưu tiên đi thẳng tới cổng MoMo (giống BookRide)
      if (qrRes.payUrl) {
        startPollingPaymentPaid(selectedPaymentBookingId);
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

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Phần Số khách */}
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
                {(trip.customers && trip.customers.length > 0 ? trip.customers : [{
                  booking_id: trip.booking_id,
                  assignment_id: trip.id,
                  customer_name: trip.customer_name || 'Khách',
                  customer_phone: trip.customer_phone,
                  pickup_location: trip.pickup_location,
                  dropoff_location: trip.dropoff_location,
                  passengers: trip.total_occupancy || 1,
                  driver_confirm: trip.driver_confirm,
                  start_time: trip.start_time || null,
                  payment_status: trip.payment_status
                }]).map((c) => (
                  <div key={c.booking_id} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="text-sm font-bold text-gray-900">
                      {c.customer_name || 'Khách'}{' '}
                      {c.customer_phone ? (
                        <span className="text-xs font-semibold text-gray-500">
                          ({c.customer_phone})
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-500 ml-2">- {c.passengers} khách</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      <span className="font-bold">Đón:</span> {c.pickup_location || '—'}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-bold">Đến:</span> {c.dropoff_location || '—'}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-gray-500">Thanh toán</div>
                      <div className="text-sm font-bold text-gray-900">
                        {paymentStatusText(localPaymentStatuses[c.booking_id] || c.payment_status)}
                      </div>
                    </div>
                    {(localPaymentStatuses[c.booking_id] || c.payment_status || 'pending') === 'pending' ? (
                      <button
                        onClick={() => {
                          setSelectedPaymentBookingId(c.booking_id);
                          setShowPaymentModal(true);
                          setPaymentOption(null);
                          setPaymentError(null);
                        }}
                        className="w-full mt-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        Xác nhận thanh toán
                      </button>
                    ) : (
                      <div className="w-full mt-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs text-center">
                        Đã thanh toán
                      </div>
                    )}

                    {trip.booking_status !== 'completed' &&
                      trip.booking_status !== 'cancelled' &&
                      c.assignment_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeclineCustomer({ booking_id: c.booking_id, assignment_id: c.assignment_id });
                            setShowDeclineModal(true);
                          }}
                          className="w-full mt-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} />
                          Hủy nhận khách
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phần Phương tiện - sẽ nhảy xuống dưới trên mobile */}
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
              disabled={isConfirming}
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
                  disabled={!reason.trim()}
                  className="flex-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:cursor-not-allowed"
                >
                  Gửi & Khởi Hành
                </button>
              </div>
            </div>
          )}

          {isInProgress && (
            <button 
              onClick={() => {
                if (allPaid) {
                  onComplete();
                } else {
                  setShowUnpaidModal(true);
                }
              }}
              disabled={!allPaid}
              className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl font-bold uppercase tracking-wide text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="font-semibold">
              {Object.values(localPaymentStatuses).filter((s) => s !== 'pending').length}/
              {Object.keys(localPaymentStatuses).length} khách đã thanh toán
            </div>
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
              <button onClick={stopAndClosePaymentModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Booking hiện đang: <span className="font-bold text-gray-900">{selectedPaymentBookingId ? paymentStatusText(localPaymentStatuses[selectedPaymentBookingId]) : 'Chưa thanh toán'}</span>
            </div>
            {!paymentOption && (
              <div className="space-y-2">
                <button onClick={handleChooseCash} className="w-full px-4 py-3 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl text-emerald-700 font-bold">Thanh toán tiền mặt</button>
                <button onClick={handleChooseTransfer} disabled={paymentCreating} className="w-full px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl font-bold">{paymentCreating ? 'Đang tạo QR...' : 'Chuyển khoản (MoMo QR)'}</button>
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{paymentError}</div>
                )}
              </div>
            )}
            {paymentOption === 'transfer' && (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700">Quét QR để thanh toán. Hệ thống sẽ tự cập nhật khi thanh toán thành công.</div>
                {paymentCreating ? (
                  <div className="flex items-center justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" /></div>
                ) : (paymentQrCode || paymentPayUrl) ? (
                  <div className="flex flex-col items-center">
                    {paymentQrCode && (
                      <img alt="QR MoMo" className="w-44 h-44 rounded-xl border border-gray-100 bg-gray-50" src={paymentQrCode.startsWith('http') ? paymentQrCode : `data:image/png;base64,${paymentQrCode}`} />
                    )}
                    {paymentPayUrl && (
                      <a href={paymentPayUrl} target="_blank" rel="noreferrer" className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-bold">Mở trang thanh toán</a>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">Không có QR để hiển thị. Vui lòng thử lại.</div>
                )}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{paymentError}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unpaid Customers Modal */}
      {showUnpaidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Khách chưa thanh toán</h3>
              <button onClick={() => setShowUnpaidModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Vui lòng thu tiền cho các khách sau trước khi hoàn thành chuyến.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {Object.entries(localPaymentStatuses).filter(([, st]) => st === 'pending').map(([bid]) => {
                const cust = (trip.customers && trip.customers.length > 0 ? trip.customers : [{
                  booking_id: trip.booking_id,
                  customer_name: trip.customer_name || 'Khách',
                  customer_phone: trip.customer_phone
                }]).find(c => c.booking_id === bid);
                return (
                  <li key={bid}>
                    {cust?.customer_name || 'Khách'} {cust?.customer_phone ? `(${cust.customer_phone})` : ''}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowUnpaidModal(false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Đã thu tiền</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Hủy nhận khách</h3>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedDeclineCustomer(null);
                  setDeclineReason('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Vui lòng nhập lý do để nhân viên có thể phân công tài xế khác.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="Ví dụ: bận chuyến khác, xe gặp sự cố, không kịp thời gian..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedDeclineCustomer(null);
                  setDeclineReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-sm"
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  if (selectedDeclineCustomer?.booking_id && selectedDeclineCustomer?.assignment_id) {
                    onDecline(selectedDeclineCustomer.booking_id, selectedDeclineCustomer.assignment_id, declineReason);
                  }
                  setShowDeclineModal(false);
                  setSelectedDeclineCustomer(null);
                  setDeclineReason('');
                }}
                disabled={!declineReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}