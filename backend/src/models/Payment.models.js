const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'transfer'],
    required: true,
    index: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid_cash', 'paid_transfer'],
    default: 'pending',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paid_at: {
    type: Date,
    default: null
  },

  momo_order_id: { type: String, default: null, index: true },
  momo_request_id: { type: String, default: null, index: true },
  momo_trans_id: { type: String, default: null, index: true },
  momo_result_code: { type: String, default: null },
  momo_raw: { type: mongoose.Schema.Types.Mixed, default: null },

  confirmed_by_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  confirmed_by_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Payment', paymentSchema);

