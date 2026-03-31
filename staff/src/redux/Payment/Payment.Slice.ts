import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentApi } from './Payment.Api';
import {
  PaymentCreateResponse,
  PaymentRecord,
  ConfirmCashPaymentResponse,
  PaymentStatus
} from '../../types/Payment.types';

interface PaymentState {
  loading: boolean;
  error: string | null;
  lastCreate?: PaymentCreateResponse;
  lastStatus?: PaymentRecord;
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  lastCreate: undefined,
  lastStatus: undefined
};

export const createPaymentForBooking = createAsyncThunk(
  'payment/createPaymentForBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await paymentApi.createPaymentForBooking(bookingId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || response.error || 'Không thể tạo payment');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể tạo payment');
    }
  }
);

export const createTransferPaymentForBooking = createAsyncThunk(
  'payment/createTransferPaymentForBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await paymentApi.createTransferPaymentForBooking(bookingId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || response.error || 'Không thể tạo QR chuyển khoản');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể tạo QR chuyển khoản');
    }
  }
);

export const fetchPaymentStatus = createAsyncThunk(
  'payment/fetchPaymentStatus',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await paymentApi.getPaymentStatus(bookingId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || response.error || 'Không thể lấy trạng thái payment');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể lấy trạng thái payment');
    }
  }
);

export const confirmCashPayment = createAsyncThunk(
  'payment/confirmCashPayment',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await paymentApi.confirmCashPayment(bookingId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || response.error || 'Không thể xác nhận tiền mặt');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể xác nhận tiền mặt');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.loading = false;
      state.error = null;
      state.lastCreate = undefined;
      state.lastStatus = undefined;
    },
    // Helper: cập nhật nhanh theo trạng thái polling
    setPaymentStatusLocal: (state, action: PayloadAction<{ payment_status: PaymentStatus }>) => {
      if (state.lastStatus) {
        state.lastStatus.payment_status = action.payload.payment_status;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentForBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentForBooking.fulfilled, (state, action: PayloadAction<PaymentCreateResponse>) => {
        state.loading = false;
        state.lastCreate = action.payload;
      })
      .addCase(createPaymentForBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createTransferPaymentForBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransferPaymentForBooking.fulfilled, (state, action: PayloadAction<PaymentCreateResponse>) => {
        state.loading = false;
        state.lastCreate = action.payload;
      })
      .addCase(createTransferPaymentForBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchPaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action: PayloadAction<PaymentRecord>) => {
        state.loading = false;
        state.lastStatus = action.payload;
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(confirmCashPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmCashPayment.fulfilled, (state, action: PayloadAction<ConfirmCashPaymentResponse>) => {
        state.loading = false;
        state.lastStatus = {
          paymentId: action.payload.paymentId,
          payment_status: action.payload.payment_status,
          paid_at: action.payload.paid_at,
          payment_method: 'cash'
        };
      })
      .addCase(confirmCashPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearPaymentState, setPaymentStatusLocal } = paymentSlice.actions;
export default paymentSlice.reducer;

