import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface LowOccupancyFormProps {
  tripId: number;
  bookingId: number;
  totalOccupancy: number;
  vehicleSeats: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function LowOccupancyForm({
  tripId,
  bookingId,
  totalOccupancy,
  vehicleSeats,
  onConfirm,
  onCancel
}: LowOccupancyFormProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-widest mb-3">
        <AlertCircle size={16} /> Công suất dưới 80% ({totalOccupancy}/{vehicleSeats})
      </div>
      <p className="text-sm text-amber-600 font-bold mb-4">Vui lòng nhập lý do khởi hành khi chưa đủ khách:</p>
      <textarea 
        className="w-full p-4 bg-white border border-amber-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 font-medium text-sm transition-all mb-4"
        placeholder="Ví dụ: Khách yêu cầu đi gấp, xe hỏng..."
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <button 
          onClick={onCancel}
          className="flex-1 bg-white border border-amber-200 text-amber-700 py-3 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all"
        >
          Hủy
        </button>
        <button 
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className="flex-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-amber-100"
        >
          Gửi & Khởi Hành
        </button>
      </div>
    </div>
  );
}