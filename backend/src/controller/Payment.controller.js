const crypto = require('crypto');
const axios = require('axios');

const Booking = require('../models/Booking.models');
const Payment = require('../models/Payment.models');
const ApiResponse = require('../models/ApiResponse.models');

class PaymentController {
  constructor() {
    this.createPaymentForBooking = this.createPaymentForBooking.bind(this);
    this.createTransferPaymentForBooking = this.createTransferPaymentForBooking.bind(this);
    this.getPaymentStatus = this.getPaymentStatus.bind(this);
    this.confirmCashPayment = this.confirmCashPayment.bind(this);
    this.handleMomoIpn = this.handleMomoIpn.bind(this);
    this.handleMomoReturn = this.handleMomoReturn.bind(this);
  }

  async handleMomoReturn(req, res) {
    try {
      const clientBaseUrl = process.env.CLIENT_PUBLIC_URL || process.env.CLIENT_URL || 'http://localhost:5173';
      const q = req.query || {};
      const resultCode = q.resultCode;
      const extraData = q.extraData;
      const target = q.target || null;

      // extraData được set = bookingId khi tạo QR
      const bookingId = Array.isArray(extraData) ? extraData[0] : extraData;

      if (!bookingId) {
        if (target === 'driver-dashboard') {
          return res.redirect(`${clientBaseUrl}/driver-dashboard`);
        }
        return res.redirect(`${clientBaseUrl}/confirmation?id=missing_booking_id`);
      }

      const payment = await Payment.findOne({ booking_id: bookingId });
      if (!payment) {
        if (target === 'driver-dashboard') {
          return res.redirect(`${clientBaseUrl}/driver-dashboard`);
        }
        return res.redirect(`${clientBaseUrl}/confirmation?id=${bookingId}`);
      }

      // resultCode 0 => thanh toán thành công
      if (String(resultCode) === '0') {
        payment.payment_status = 'paid_transfer';
        payment.paid_at = new Date();
        payment.momo_raw = { ...q };

        // Các field có thể khác nhau theo MoMo
        payment.momo_trans_id = Array.isArray(q.transID) ? q.transID[0] : q.transID || q.transId || q.transactionId || null;
        payment.momo_result_code = resultCode != null ? String(resultCode) : null;
        await payment.save();
      }

      if (target === 'driver-dashboard') {
        return res.redirect(`${clientBaseUrl}/driver-dashboard`);
      }
      return res.redirect(`${clientBaseUrl}/confirmation?id=${bookingId}`);
    } catch (error) {
      console.error('❌ handleMomoReturn:', error?.message || error);
      return res.redirect(`${process.env.CLIENT_PUBLIC_URL || process.env.CLIENT_URL || 'http://localhost:5173'}/confirmation?id=unknown`);
    }
  }

  async createTransferPaymentForBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId).select('price');
      if (!booking) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy booking'));
      }

      const amount = Number(booking.price || 0);
      let payment = await Payment.findOne({ booking_id: bookingId });

      if (payment && payment.payment_status === 'paid_transfer') {
        return res.status(200).json(
          ApiResponse.success(
            {
              paymentId: payment._id,
              payment_status: payment.payment_status,
              payment_method: payment.payment_method
            },
            'Payment đã thanh toán chuyển khoản'
          )
        );
      }

      if (!payment) {
        payment = await Payment.create({
          booking_id: bookingId,
          payment_method: 'transfer',
          amount,
          payment_status: 'pending'
        });
      } else {
        // Driver có thể thay đổi phương thức thanh toán trước khi khách hoàn tất.
        payment.payment_method = 'transfer';
        payment.amount = amount;
        payment.payment_status = 'pending';
        await payment.save();
      }

      // Tạo QR/PayUrl cho momo (lấy từ logic trong createPaymentForBooking)
      const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
      const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';

      const partnerName = process.env.MOMO_PARTNER_NAME || 'CarBookingSystem';
      const storeId = process.env.MOMO_STORE_ID || 'CarBookingStore';
      const orderInfo = process.env.MOMO_ORDER_INFO || 'pay with MoMo';
      const requestType = 'payWithMethod';
      const lang = 'vi';
      const autoCapture = true;

      const momoAmount = String(Math.round(Number(payment.amount)));
      const orderId = `${partnerCode}${Date.now()}`;
      const requestId = orderId;
      const extraData = String(bookingId);
      const orderGroupId = '';

      const apiBaseUrl = process.env.API_PUBLIC_URL || process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
      const ipnUrl =
        process.env.MOMO_IPN_URL || `${apiBaseUrl}/api/payments/momo/ipn`;
      const redirectUrl =
        process.env.MOMO_REDIRECT_URL || `${apiBaseUrl}/api/payments/momo/return?target=driver-dashboard`;

      const rawSignature = `accessKey=${accessKey}&amount=${momoAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode,
        partnerName,
        storeId,
        requestId,
        amount: momoAmount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature
      };

      const momoResponse = await axios.post(
        process.env.MOMO_CREATE_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = momoResponse.data || {};
      const resultCode = data.resultCode;

      if (String(resultCode) !== '0') {
        return res.status(400).json(
          ApiResponse.error('Tạo payment momo thất bại', null, { resultCode, message: data.message })
        );
      }

      payment.momo_order_id = orderId;
      payment.momo_request_id = requestId;
      payment.momo_raw = data;
      payment.payment_status = 'pending';
      await payment.save();

      return res.status(200).json(
        ApiResponse.success(
          {
            paymentId: payment._id,
            bookingId: payment.booking_id,
            payment_status: payment.payment_status,
            qrCode: data.qrCode || data.payCode || data.qr || null,
            payUrl: data.payUrl || null,
            orderId,
            requestId
          },
          'Tạo QR momo thành công'
        )
      );
    } catch (error) {
      console.error('❌ createTransferPaymentForBooking:', error?.message || error);
      return res.status(500).json(ApiResponse.error('Lỗi tạo payment', error?.message));
    }
  }

  async createOrInitPayment(booking) {
    const payment_method = booking.payment_method || 'cash';
    const amount = Number(booking.price || 0);

    const existing = await Payment.findOne({ booking_id: booking._id });
    if (!existing) {
      return Payment.create({
        booking_id: booking._id,
        payment_method,
        amount,
        payment_status: 'pending'
      });
    }

    existing.amount = amount;
    // Không override payment_method nếu đã paid để tránh lệch trạng thái do driver/staff override.
    if (existing.payment_status === 'pending') {
      existing.payment_method = payment_method;
    }
    return existing.save();
  }

  async createPaymentForBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId).select('payment_method price');
      if (!booking) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy booking'));
      }

      const payment = await this.createOrInitPayment(booking);

      // Nếu tiền mặt: không cần tạo momo QR, chỉ trả payment hiện tại.
      if (payment.payment_method !== 'transfer') {
        return res.status(200).json(
          ApiResponse.success(
            {
              paymentId: payment._id,
              payment_status: payment.payment_status,
              payment_method: payment.payment_method
            },
            'Khởi tạo payment thành công (tiền mặt)'
          )
        );
      }

      // Nếu đã thanh toán  chuyển khoản rồi thì không tạo QR mới.
      if (payment.payment_status === 'paid_transfer') {
        return res.status(200).json(
          ApiResponse.success(
            {
              paymentId: payment._id,
              payment_status: payment.payment_status,
              payment_method: payment.payment_method
            },
            'Payment đã được thanh toán chuyển khoản'
          )
        );
      }

      // Tạo QR/PayUrl cho momo
      const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
      const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
      const partnerName = process.env.MOMO_PARTNER_NAME || 'CarBookingSystem';
      const storeId = process.env.MOMO_STORE_ID || 'CarBookingStore';

      const orderInfo = process.env.MOMO_ORDER_INFO || 'pay with MoMo';
      const requestType = 'payWithMethod';
      const lang = 'vi';
      const autoCapture = true;

      const amount = String(Math.round(Number(payment.amount)));
      const orderId = `${partnerCode}${Date.now()}`;
      const requestId = orderId;
      const extraData = String(booking._id); // dùng để map callback về booking
      const orderGroupId = '';

      const apiBaseUrl = process.env.API_PUBLIC_URL || process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
      const ipnUrl =
        process.env.MOMO_IPN_URL || `${apiBaseUrl}/api/payments/momo/ipn`;
      const redirectUrl =
        process.env.MOMO_REDIRECT_URL || `${apiBaseUrl}/api/payments/momo/return`;

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode,
        partnerName,
        storeId,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature
      };

      // momo response từ endpoint create
      const momoResponse = await axios.post(
        process.env.MOMO_CREATE_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = momoResponse.data || {};
      const resultCode = data.resultCode;

      if (String(resultCode) !== '0') {
        return res.status(400).json(
          ApiResponse.error(
            'Tạo payment momo thất bại',
            null,
            { resultCode, message: data.message }
          )
        );
      }

      payment.momo_order_id = orderId;
      payment.momo_request_id = requestId;
      payment.momo_raw = data;
      payment.payment_status = 'pending';
      await payment.save();

      return res.status(200).json(
        ApiResponse.success(
          {
            paymentId: payment._id,
            bookingId: payment.booking_id,
            payment_status: payment.payment_status,
            qrCode: data.qrCode || data.payCode || data.qr || null,
            payUrl: data.payUrl || null,
            orderId,
            requestId
          },
          'Tạo QR momo thành công'
        )
      );
    } catch (error) {
      console.error('❌ createPaymentForBooking:', error?.message || error);
      return res.status(500).json(ApiResponse.error('Lỗi tạo payment', error?.message));
    }
  }

  async getPaymentStatus(req, res) {
    try {
      const { bookingId } = req.params;

      const payment = await Payment.findOne({ booking_id: bookingId });
      if (!payment) {
        // Nếu chưa có payment record thì coi như pending
        return res.status(200).json(
          ApiResponse.success(
            {
              paymentId: null,
              payment_status: 'pending'
            },
            'Chưa có payment record (coi như pending)'
          )
        );
      }

      return res.status(200).json(
        ApiResponse.success(
          {
            paymentId: payment._id,
            payment_method: payment.payment_method,
            payment_status: payment.payment_status,
            paid_at: payment.paid_at
          },
          'Lấy trạng thái payment thành công'
        )
      );
    } catch (error) {
      console.error('❌ getPaymentStatus:', error?.message || error);
      return res.status(500).json(ApiResponse.error('Lỗi lấy payment', error?.message));
    }
  }

  async confirmCashPayment(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId).select('price');
      if (!booking) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy booking'));
      }

      const payment = await Payment.findOne({ booking_id: bookingId });
      if (!payment) {
        return res.status(404).json(ApiResponse.error('Chưa có payment record'));
      }

      if (payment.payment_status === 'paid_cash' || payment.payment_status === 'paid_transfer') {
        return res.status(200).json(
          ApiResponse.success(
            {
              paymentId: payment._id,
              payment_status: payment.payment_status
            },
            'Payment đã được ghi nhận rồi'
          )
        );
      }

      // authMiddleware set:
      //  - staff: req.staffId
      //  - driver: req.driverId
      if (req.userRole === 'staff') {
        payment.confirmed_by_staff_id = req.staffId;
      } else if (req.userRole === 'driver') {
        payment.confirmed_by_driver_id = req.driverId;
      }

      // Cho phép override theo lựa chọn của staff/driver
      payment.payment_method = 'cash';
      payment.payment_status = 'paid_cash';
      payment.paid_at = new Date();
      await payment.save();

      return res.status(200).json(
        ApiResponse.success(
          {
            paymentId: payment._id,
            payment_status: payment.payment_status,
            paid_at: payment.paid_at
          },
          'Xác nhận thanh toán tiền mặt thành công'
        )
      );
    } catch (error) {
      console.error('❌ confirmCashPayment:', error?.message || error);
      return res.status(500).json(ApiResponse.error('Lỗi xác nhận payment', error?.message));
    }
  }

  async handleMomoIpn(req, res) {
    try {
      const body = req.body || {};

      // MoMo thường gửi các field: resultCode, transID, orderId, extraData...
      const resultCode = body.resultCode;
      const transId = body.transID || body.transId || body.transactionId || null;
      const orderId = body.orderId || body.orderid || null;
      const extraData = body.extraData || null;

      if (!resultCode || !extraData) {
        // không đủ dữ liệu
        return res.status(400).json(ApiResponse.error('IPN thiếu dữ liệu'));
      }

      const payment = await Payment.findOne({
        $or: [
          { momo_order_id: orderId },
          { booking_id: extraData }
        ]
      });

      if (!payment) {
        return res.status(404).json(ApiResponse.error('Không tìm thấy payment cho callback'));
      }

      if (String(resultCode) === '0') {
        payment.payment_status = 'paid_transfer';
        payment.paid_at = new Date();
        payment.momo_trans_id = transId;
        payment.momo_result_code = String(resultCode);
        payment.momo_raw = body;
        await payment.save();
      }

      // trả về cho MoMo biết nhận OK
      return res.status(200).json(ApiResponse.success(null, 'IPN handled'));
    } catch (error) {
      console.error('❌ handleMomoIpn:', error?.message || error);
      return res.status(500).json(ApiResponse.error('Lỗi xử lý IPN', error?.message));
    }
  }
}

module.exports = new PaymentController();

