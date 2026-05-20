import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DriverReviewState, CreateReviewPayload, CanReviewResponse } from '../../types/DriverReview.types';
import * as reviewApi from './DriverReview.Api';

const initialState: DriverReviewState = {
  reviewsByBooking: {},
  canReviewStatus: {},
  submitting: false,
  loading: false,
  error: null,
  driverReviews: [],
  driverReviewStats: { total: 0, avgRating: 0 },
  loadingDriverReviews: false,
};

// Lấy danh sách đánh giá của tài xế
export const fetchDriverReviews = createAsyncThunk(
  'driverReview/fetchDriverReviews',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await reviewApi.getDriverReviews(driverId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi tải danh sách đánh giá');
    }
  }
);

// Fetch review cho 1 chuyến cụ thể
export const fetchReviewByBooking = createAsyncThunk(
  'driverReview/fetchByBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const review = await reviewApi.getReviewByBooking(bookingId);
      return { bookingId, review };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi tải đánh giá');
    }
  }
);

// NEW: Kiểm tra xem có thể đánh giá không
export const fetchCanReview = createAsyncThunk(
  'driverReview/fetchCanReview',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const result = await reviewApi.checkCanReview(bookingId);
      return { bookingId, result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi kiểm tra đánh giá');
    }
  }
);

// Submit review mới
export const submitReview = createAsyncThunk(
  'driverReview/submit',
  async (payload: CreateReviewPayload, { rejectWithValue, dispatch }) => {
    try {
      const review = await reviewApi.createReview(payload);
      // After successful submit, refresh canReview status
      await dispatch(fetchCanReview(payload.bookingId));
      return { bookingId: payload.bookingId, review };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi gửi đánh giá');
    }
  }
);

const driverReviewSlice = createSlice({
  name: 'driverReview',
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    clearCanReviewStatus: (state, action) => {
      const { bookingId } = action.payload;
      delete state.canReviewStatus[bookingId];
    }
  },
  extraReducers: (builder) => {
    // fetchReviewByBooking
    builder.addCase(fetchReviewByBooking.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchReviewByBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.reviewsByBooking[action.payload.bookingId] = action.payload.review;
    });
    builder.addCase(fetchReviewByBooking.rejected, (state, action) => {
      state.loading = false;
      console.error('fetchReviewByBooking rejected:', action.payload);
    });

    // fetchCanReview
    builder.addCase(fetchCanReview.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCanReview.fulfilled, (state, action) => {
      state.loading = false;
      state.canReviewStatus[action.payload.bookingId] = action.payload.result;
    });
    builder.addCase(fetchCanReview.rejected, (state, action) => {
      state.loading = false;
      console.error('fetchCanReview rejected:', action.payload);
    });

    // submitReview
    builder.addCase(submitReview.pending, (state) => {
      state.submitting = true;
      state.error = null;
    });
    builder.addCase(submitReview.fulfilled, (state, action) => {
      state.submitting = false;
      state.reviewsByBooking[action.payload.bookingId] = action.payload.review;
    });
    builder.addCase(submitReview.rejected, (state, action) => {
      state.submitting = false;
      state.error = action.payload as string;
    });

    // fetchDriverReviews
    builder.addCase(fetchDriverReviews.pending, (state) => {
      state.loadingDriverReviews = true;
    });
    builder.addCase(fetchDriverReviews.fulfilled, (state, action) => {
      state.loadingDriverReviews = false;
      state.driverReviews = action.payload.reviews;
      state.driverReviewStats = {
        total: action.payload.total,
        avgRating: action.payload.avgRating
      };
    });
    builder.addCase(fetchDriverReviews.rejected, (state, action) => {
      state.loadingDriverReviews = false;
      console.error('fetchDriverReviews rejected:', action.payload);
    });
  }
});

export const { clearReviewError, clearCanReviewStatus } = driverReviewSlice.actions;
export default driverReviewSlice.reducer;