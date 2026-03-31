import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  DriverTrip,
  DriverTripStats,
  DriverStatusResponse,
  ConfirmTripPayload,
  DriverTripState,
  ApiResponse
} from '../../types/DriverTrip.types';
import * as driverTripApi from './DriverTrip.Api';

const initialState: DriverTripState = {
  trips: [],
  stats: null,
  driverStatus: null,
  loading: false,
  error: null,
};


/**
 * Lấy danh sách chuyến đi của tài xế
 */
export const fetchDriverTrips = createAsyncThunk(
  'driverTrip/fetchTrips',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverTripApi.getDriverTrips(driverId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy danh sách chuyến thất bại');
    }
  }
);

/**
 * Lấy thống kê của tài xế
 */
export const fetchDriverTripStats = createAsyncThunk(
  'driverTrip/fetchStats',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const response = await driverTripApi.getDriverTripStats(driverId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy thống kê thất bại');
    }
  }
);

/**
 * Xác nhận nhận chuyến
 */
export const confirmTrip = createAsyncThunk(
  'driverTrip/confirmTrip',
  async (payload: ConfirmTripPayload, { rejectWithValue }) => {
    try {
      const response = await driverTripApi.confirmTrip(payload);
      return { response, payload };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Xác nhận chuyến thất bại');
    }
  }
);

/**
 * Hoàn thành chuyến đi
 */
export const completeTrip = createAsyncThunk(
  'driverTrip/completeTrip',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await driverTripApi.completeTrip(bookingId);
      return { response, bookingId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Hoàn thành chuyến thất bại');
    }
  }
);

/**
 * Lấy trạng thái hiện tại của tài xế (polling)
 */
export const fetchDriverStatus = createAsyncThunk(
  'driverTrip/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverTripApi.getDriverStatus();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy trạng thái thất bại');
    }
  }
);

// ==================== SLICE ====================
const driverTripSlice = createSlice({
  name: 'driverTrip',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetTrips: (state) => {
      state.trips = [];
      state.stats = null;
    },
    updateTripLocally: (state, action: PayloadAction<{ bookingId: string; status: string }>) => {
      const { bookingId, status } = action.payload;
      const trip = state.trips.find(t => t.booking_id === bookingId);
      if (trip) {
        trip.booking_status = status as any;
      }
    },
  },
  extraReducers: (builder) => {
    // ========== FETCH DRIVER TRIPS ==========
    builder.addCase(fetchDriverTrips.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDriverTrips.fulfilled, (state, action: PayloadAction<DriverTrip[]>) => {
      state.loading = false;
      state.trips = action.payload;
    });
    builder.addCase(fetchDriverTrips.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========== FETCH DRIVER TRIP STATS ==========
    builder.addCase(fetchDriverTripStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDriverTripStats.fulfilled, (state, action: PayloadAction<DriverTripStats>) => {
      state.loading = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchDriverTripStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========== CONFIRM TRIP ==========
    builder.addCase(confirmTrip.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(confirmTrip.fulfilled, (state, action) => {
      state.loading = false;
      const { bookingId } = action.payload.payload;
      // Cập nhật trạng thái trip trong danh sách
      const tripIndex = state.trips.findIndex(t => t.booking_id === bookingId);
      if (tripIndex !== -1) {
        state.trips[tripIndex].driver_confirm = 1;
        state.trips[tripIndex].booking_status = 'in-progress';
        state.trips[tripIndex].start_time = new Date().toISOString();
      }
    });
    builder.addCase(confirmTrip.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========== COMPLETE TRIP ==========
    builder.addCase(completeTrip.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(completeTrip.fulfilled, (state, action) => {
      state.loading = false;
      const { bookingId } = action.payload;
      // Cập nhật trạng thái trip trong danh sách
      const tripIndex = state.trips.findIndex(t => t.booking_id === bookingId);
      if (tripIndex !== -1) {
        state.trips[tripIndex].booking_status = 'completed';
        state.trips[tripIndex].end_time = new Date().toISOString();
      }
      // Cập nhật lại stats
      if (state.stats) {
        state.stats.completedTrips += 1;
      }
    });
    builder.addCase(completeTrip.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchDriverStatus.pending, (state) => {
    });
    builder.addCase(fetchDriverStatus.fulfilled, (state, action: PayloadAction<DriverStatusResponse>) => {
      state.driverStatus = action.payload;
    });
    builder.addCase(fetchDriverStatus.rejected, (state, action) => {
      console.error('Lỗi lấy trạng thái tài xế:', action.payload);
    });
  },
});

export const { clearError, resetTrips, updateTripLocally } = driverTripSlice.actions;
export default driverTripSlice.reducer;