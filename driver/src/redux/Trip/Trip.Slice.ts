import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import tripApi from './Trip.Api';
import {
  Trip,
  TripState,
  TripFilters,
  TripStats,
  AssignBookingPayload,
  FindSuitableTripsResponse,
  UpdateTripStatusPayload,
  TripListResponse,
  TripWithPopulated,
} from '../../types/Trip.types';

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  stats: null,
  suitableTrips: null,
  tripBookings: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {
    status: 'all',
    page: 1,
    limit: 20,
  },
};

// Async Thunks

/**
 * Lấy danh sách chuyến đi
 */
export const fetchTrips = createAsyncThunk(
  'trip/fetchTrips',
  async (filters: TripFilters = {}, { rejectWithValue }) => {
    try {
      const response = await tripApi.getAllTrips(filters);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể lấy danh sách chuyến đi');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Lấy chi tiết chuyến đi theo ID
 */
export const fetchTripById = createAsyncThunk(
  'trip/fetchTripById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await tripApi.getTripById(id);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể lấy thông tin chuyến đi');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Lấy thống kê chuyến đi
 */
export const fetchTripStats = createAsyncThunk(
  'trip/fetchTripStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tripApi.getTripStats();
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể lấy thống kê chuyến đi');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Cập nhật trạng thái chuyến đi
 */
export const updateTripStatus = createAsyncThunk(
  'trip/updateTripStatus',
  async (
    { id, payload }: { id: string; payload: UpdateTripStatusPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await tripApi.updateTripStatus(id, payload);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể cập nhật trạng thái chuyến đi');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Phân công booking vào chuyến đi
 */
export const assignBookingToTrip = createAsyncThunk(
  'trip/assignBooking',
  async (
    { bookingId, payload }: { bookingId: string; payload: AssignBookingPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await tripApi.assignBooking(bookingId, payload);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể phân công booking');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Tìm chuyến đi phù hợp cho booking
 */
export const findSuitableTrips = createAsyncThunk(
  'trip/findSuitableTrips',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await tripApi.findSuitableTrips(bookingId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể tìm chuyến đi phù hợp');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Xóa booking khỏi chuyến đi
 */
export const removeBookingFromTrip = createAsyncThunk(
  'trip/removeBooking',
  async (
    { tripId, bookingId }: { tripId: string; bookingId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await tripApi.removeBookingFromTrip(tripId, bookingId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể xóa booking khỏi chuyến đi');
      }
      return { data: response.data, tripId, bookingId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

/**
 * Lấy danh sách bookings trong chuyến đi
 */
export const fetchTripBookings = createAsyncThunk(
  'trip/fetchTripBookings',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const response = await tripApi.getTripBookings(tripId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Không thể lấy danh sách booking');
      }
      return { data: response.data, tripId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    }
  }
);

// Slice
const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    // Reset state
    resetTripState: (state) => {
      state.trips = [];
      state.currentTrip = null;
      state.suitableTrips = null;
      state.tripBookings = [];
      state.loading = false;
      state.error = null;
      state.pagination = initialState.pagination;
    },
    
    // Clear current trip
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
    },
    
    // Clear suitable trips
    clearSuitableTrips: (state) => {
      state.suitableTrips = null;
    },
    
    // Set filters
    setTripFilters: (state, action: PayloadAction<TripFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetTripFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Set page
    setTripPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },
    
    // Set error
    setTripError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Update local trip status
    updateLocalTripStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const { id, status } = action.payload;
      const trip = state.trips.find(t => t._id === id);
      if (trip) {
        trip.status = status as any;
      }
      if (state.currentTrip && state.currentTrip._id === id) {
        state.currentTrip.status = status as any;
      }
    },
    
    // Add booking to local trip
    addBookingToLocalTrip: (state, action: PayloadAction<{ tripId: string; booking: any }>) => {
      const { tripId, booking } = action.payload;
      const trip = state.trips.find(t => t._id === tripId);
      if (trip) {
        trip.bookings.push(booking);
        trip.total_passengers += booking.passengers;
      }
      if (state.currentTrip && state.currentTrip._id === tripId) {
        state.currentTrip.bookings.push(booking);
        state.currentTrip.total_passengers += booking.passengers;
      }
    },
    
    // Remove booking from local trip
    removeBookingFromLocalTrip: (state, action: PayloadAction<{ tripId: string; bookingId: string }>) => {
      const { tripId, bookingId } = action.payload;
      const trip = state.trips.find(t => t._id === tripId);
      if (trip) {
        const booking = trip.bookings.find(b => b.booking_id === bookingId);
        if (booking) {
          trip.total_passengers -= booking.passengers;
        }
        trip.bookings = trip.bookings.filter(b => b.booking_id !== bookingId);
      }
      if (state.currentTrip && state.currentTrip._id === tripId) {
        const booking = state.currentTrip.bookings.find(b => b.booking_id === bookingId);
        if (booking) {
          state.currentTrip.total_passengers -= booking.passengers;
        }
        state.currentTrip.bookings = state.currentTrip.bookings.filter(b => b.booking_id !== bookingId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTrips
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action: PayloadAction<TripListResponse | undefined>) => {
        state.loading = false;
        if (action.payload) {
          state.trips = action.payload.trips || [];
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchTripById
      .addCase(fetchTripById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action: PayloadAction<Trip | undefined>) => {
        state.loading = false;
        state.currentTrip = action.payload as TripWithPopulated || null;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchTripStats
      .addCase(fetchTripStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripStats.fulfilled, (state, action: PayloadAction<TripStats | undefined>) => {
        state.loading = false;
        state.stats = action.payload || null;
      })
      .addCase(fetchTripStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateTripStatus
      .addCase(updateTripStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTripStatus.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload?.trip) {
          const updatedTrip = action.payload.trip;
          const index = state.trips.findIndex(t => t._id === updatedTrip._id);
          if (index !== -1) {
            state.trips[index] = updatedTrip;
          }
          if (state.currentTrip && state.currentTrip._id === updatedTrip._id) {
            state.currentTrip = updatedTrip;
          }
        }
      })
      .addCase(updateTripStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // assignBookingToTrip
      .addCase(assignBookingToTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignBookingToTrip.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload?.trip) {
          const newTrip = action.payload.trip;
          const isNewTrip = action.payload.isNewTrip;
          
          if (isNewTrip) {
            state.trips.unshift(newTrip);
          } else {
            const index = state.trips.findIndex(t => t._id === newTrip._id);
            if (index !== -1) {
              state.trips[index] = newTrip;
            }
          }
        }
      })
      .addCase(assignBookingToTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // findSuitableTrips
      .addCase(findSuitableTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findSuitableTrips.fulfilled, (state, action: PayloadAction<FindSuitableTripsResponse | undefined>) => {
        state.loading = false;
        state.suitableTrips = action.payload || null;
      })
      .addCase(findSuitableTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // removeBookingFromTrip
      .addCase(removeBookingFromTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeBookingFromTrip.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const { tripId, bookingId } = action.payload;
        const trip = state.trips.find(t => t._id === tripId);
        if (trip) {
          const removedBooking = trip.bookings.find(b => b.booking_id === bookingId);
          if (removedBooking) {
            trip.total_passengers -= removedBooking.passengers;
          }
          trip.bookings = trip.bookings.filter(b => b.booking_id !== bookingId);
        }
        if (state.currentTrip && state.currentTrip._id === tripId) {
          const removedBooking = state.currentTrip.bookings.find(b => b.booking_id === bookingId);
          if (removedBooking) {
            state.currentTrip.total_passengers -= removedBooking.passengers;
          }
          state.currentTrip.bookings = state.currentTrip.bookings.filter(b => b.booking_id !== bookingId);
        }
      })
      .addCase(removeBookingFromTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchTripBookings
      .addCase(fetchTripBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripBookings.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        if (action.payload?.data) {
          state.tripBookings = action.payload.data.bookings || [];
        }
      })
      .addCase(fetchTripBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  resetTripState,
  clearCurrentTrip,
  clearSuitableTrips,
  setTripFilters,
  resetTripFilters,
  setTripPage,
  setTripError,
  updateLocalTripStatus,
  addBookingToLocalTrip,
  removeBookingFromLocalTrip,
} = tripSlice.actions;

export default tripSlice.reducer;