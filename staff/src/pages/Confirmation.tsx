import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const momoPayUrl = searchParams.get('momoPayUrl');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 md:p-12 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Đặt Xe Thành Công!</h1>
        <p className="text-gray-600 mb-8">
          Cảm ơn bạn đã tin dùng dịch vụ của chúng tôi. Mã đặt xe của bạn là <span className="font-bold text-emerald-600">#{bookingId}</span>. 
          Nhân viên sẽ liên hệ xác nhận trong ít phút.
        </p>

        {momoPayUrl && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 text-left">
            <h3 className="font-bold text-gray-900 mb-2">Thanh toán chuyển khoản</h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng mở trang MoMo để hoàn tất thanh toán. Hệ thống sẽ tự cập nhật trạng thái khi thành công.</p>
            <a
              href={momoPayUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Mở trang thanh toán MoMo
            </a>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4">
          <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Bước tiếp theo:</h3>
          <div className="flex gap-4 items-start">
            <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-1">1</div>
            <p className="text-sm text-gray-600">Nhân viên kiểm tra và xác nhận booking của bạn.</p>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-1">2</div>
            <p className="text-sm text-gray-600">Hệ thống phân công tài xế và xe phù hợp.</p>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-1">3</div>
            <p className="text-sm text-gray-600">Thông tin tài xế sẽ được gửi đến bạn qua SĐT/Email.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/" className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all">
            <Home size={20} /> Trang Chủ
          </Link>
          <Link to="/my-trips" className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all">
            Chuyến Đi Của Tôi
          </Link>
        </div>
      </div>
    </div>
  );
}
