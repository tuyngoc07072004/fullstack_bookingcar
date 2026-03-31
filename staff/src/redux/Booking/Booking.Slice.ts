import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import bookingApi from './Booking.Api';
import { 
  BookingState, 
  Booking, 
  BookingStatus, 
  PriceCalculationResponse,
  CreateBookingRequest,
  PriceCalculationRequest
} from '../../types/Booking.types';

const initialState: BookingState = {
  currentBooking: null,
  bookings: [],
  bookingStatus: null,
  priceCalculation: null,
  loading: false,
  error: null,
};

export const calculatePrice = createAsyncThunk(
  'booking/calculatePrice',
  async (data: PriceCalculationRequest, { rejectWithValue }) => {
    try {
      const response = await bookingApi.calculatePrice(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Tính giá thất bại');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (data: CreateBookingRequest, { rejectWithValue }) => {
    try {
      const response = await bookingApi.createBooking(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đặt xe thất bại');
    }
  }
);

export const getBookingById = createAsyncThunk(
  'booking/getBookingById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await bookingApi.getBookingById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể lấy thông tin đơn đặt xe');
    }
  }
);

export const getBookingsByPhone = createAsyncThunk(
  'booking/getBookingsByPhone',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await bookingApi.getBookingsByPhone(phone);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể lấy danh sách đơn đặt xe');
    }
  }
);

export const checkBookingStatus = createAsyncThunk(
  'booking/checkBookingStatus',
  async ({ id, phone }: { id: string; phone?: string }, { rejectWithValue }) => {
    try {
      const response = await bookingApi.checkBookingStatus(id, phone);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể kiểm tra trạng thái đơn đặt xe');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await bookingApi.cancelBooking(id, { reason });
      return { id, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Hủy đơn đặt xe thất bại');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearBookings: (state) => {
      state.bookings = [];
    },
    clearBookingStatus: (state) => {
      state.bookingStatus = null;
    },
    clearPriceCalculation: (state) => {
      state.priceCalculation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetBookingState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(calculatePrice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculatePrice.fulfilled, (state, action: PayloadAction<PriceCalculationResponse>) => {
        state.loading = false;
        state.priceCalculation = action.payload;
      })
      .addCase(calculatePrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
        state.bookings = [action.payload.booking, ...state.bookings];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingById.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getBookingsByPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingsByPhone.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(getBookingsByPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkBookingStatus.fulfilled, (state, action: PayloadAction<BookingStatus>) => {
        state.loading = false;
        state.bookingStatus = action.payload;
      })
      .addCase(checkBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentBooking && state.currentBooking._id === action.payload.id) {
          state.currentBooking.status = 'cancelled';
          state.currentBooking.status_text = 'Đã hủy';
        }
        const index = state.bookings.findIndex(b => b._id === action.payload.id);
        if (index !== -1) {
          state.bookings[index].status = 'cancelled';
          state.bookings[index].status_text = 'Đã hủy';
        }
        if (state.bookingStatus && state.bookingStatus.id === action.payload.id) {
          state.bookingStatus.status = 'cancelled';
          state.bookingStatus.status_text = 'Đã hủy';
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentBooking,
  clearBookings,
  clearBookingStatus,
  clearPriceCalculation,
  clearError,
  resetBookingState,
} = bookingSlice.actions;

export const selectCurrentBooking = (state: { booking: BookingState }) => state.booking.currentBooking;
export const selectBookings = (state: { booking: BookingState }) => state.booking.bookings;
export const selectBookingStatus = (state: { booking: BookingState }) => state.booking.bookingStatus;
export const selectPriceCalculation = (state: { booking: BookingState }) => state.booking.priceCalculation;
export const selectBookingLoading = (state: { booking: BookingState }) => state.booking.loading;
export const selectBookingError = (state: { booking: BookingState }) => state.booking.error;

export default bookingSlice.reducer;