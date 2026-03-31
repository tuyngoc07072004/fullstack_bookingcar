// store/StaffBooking/StaffBooking.Slice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { staffBookingApi } from './StaffBooking.Api';
import {
  StaffBookingState,
  BookingFilters,
  AssignDriverPayload,
  ConfirmBookingPayload,
  UpdateStatusPayload,
  StaffBooking,
  TripAssignment,
  BookingStatus,
} from '../../types/StaffBooking.types';

const initialState: StaffBookingState = {
  bookings: [],
  currentBooking: null,
  bookingDetails: null,
  stats: null,
  availableVehicles: [],
  availableDrivers: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  filters: {
    status: 'all',
    page: 1,
    limit: 20
  }
};

// Helper để tạo TripAssignment object từ response - MATCH BACKEND STRUCTURE
const createTripAssignment = (assignment: any): TripAssignment | undefined => {
  if (!assignment) return undefined;
  
  return {
    _id: assignment._id,
    booking_id: assignment.booking_id,
    driver_id: assignment.driver_id,
    vehicle_id: assignment.vehicle_id,
    staff_id: assignment.staff_id,
    driver_confirm: assignment.driver_confirm,
    low_occupancy_reason: assignment.low_occupancy_reason,
    assigned_at: assignment.assigned_at,
    start_time: assignment.start_time,
    end_time: assignment.end_time,
    driver: assignment.driver ? {
      _id: assignment.driver._id,
      name: assignment.driver.name,
      phone: assignment.driver.phone
    } : undefined,
    vehicle: assignment.vehicle ? {
      _id: assignment.vehicle._id,
      vehicle_name: assignment.vehicle.vehicle_name,
      license_plate: assignment.vehicle.license_plate,
      seats: assignment.vehicle.seats
    } : undefined,
    staff: assignment.staff_id ? {
      _id: typeof assignment.staff_id === 'object' ? assignment.staff_id._id : assignment.staff_id,
      name: typeof assignment.staff_id === 'object' ? assignment.staff_id.name : '',
      username: typeof assignment.staff_id === 'object' ? assignment.staff_id.username : ''
    } : undefined
  };
};

// Helper để ép kiểu status - FIXED: Use as const assertion
const toBookingStatus = (status: string): BookingStatus => {
  // Validate that status is a valid BookingStatus
  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'];
  if (validStatuses.includes(status as BookingStatus)) {
    return status as BookingStatus;
  }
  return 'pending' as BookingStatus;
};

// Helper để transform booking từ backend
const transformBooking = (booking: any): StaffBooking => {
  return {
    ...booking,
    tripAssignment: booking.tripAssignment ? createTripAssignment(booking.tripAssignment) : undefined,
    vehicleType: booking.vehicleType || booking.vehicle_type_id
  };
};

// Async Thunks
export const fetchBookingStats = createAsyncThunk(
  'staffBooking/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.getStats();
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Không thể lấy thống kê');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy thống kê');
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'staffBooking/fetchBookings',
  async (filters: BookingFilters, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.getBookings(filters);
      if (response.success && response.data) {
        return {
          ...response.data,
          bookings: response.data.bookings.map(transformBooking)
        };
      }
      return rejectWithValue(response.message || 'Không thể lấy danh sách booking');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách booking');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'staffBooking/fetchBookingById',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.getBookingById(bookingId);
      if (response.success && response.data) {
        return transformBooking(response.data);
      }
      return rejectWithValue(response.message || 'Không thể lấy chi tiết booking');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy chi tiết booking');
    }
  }
);

export const fetchBookingDetailsForStaff = createAsyncThunk(
  'staffBooking/fetchBookingDetailsForStaff',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.getBookingDetailsForStaff(bookingId);
      if (response.success && response.data) {
        return {
          ...response.data,
          booking: transformBooking(response.data.booking)
        };
      }
      return rejectWithValue(response.message || 'Không thể lấy chi tiết booking');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy chi tiết booking');
    }
  }
);

export const confirmBooking = createAsyncThunk(
  'staffBooking/confirmBooking',
  async ({ bookingId, payload }: { bookingId: string; payload: ConfirmBookingPayload }, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.confirmBooking(bookingId, payload);
      if (response.success && response.data) {
        return { bookingId, data: response.data };
      }
      return rejectWithValue(response.message || 'Không thể xác nhận booking');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi xác nhận booking');
    }
  }
);

export const assignDriverAndVehicle = createAsyncThunk(
  'staffBooking/assignDriverAndVehicle',
  async ({ bookingId, payload }: { bookingId: string; payload: AssignDriverPayload }, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.assignDriverAndVehicle(bookingId, payload);
      if (response.success && response.data) {
        return { bookingId, data: response.data };
      }
      return rejectWithValue(response.message || 'Không thể phân công');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi phân công');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'staffBooking/updateBookingStatus',
  async ({ bookingId, payload }: { bookingId: string; payload: UpdateStatusPayload }, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.updateBookingStatus(bookingId, payload);
      if (response.success && response.data) {
        return { bookingId, data: response.data };
      }
      return rejectWithValue(response.message || 'Không thể cập nhật trạng thái');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi cập nhật trạng thái');
    }
  }
);

// ✅ FIXED: Required parameter cannot follow optional parameter
export const fetchAvailableVehicles = createAsyncThunk(
  'staffBooking/fetchAvailableVehicles',
  async (seats: number | undefined, { rejectWithValue }: any) => {
    try {
      const response = await staffBookingApi.getAvailableVehicles(seats);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Không thể lấy danh sách xe');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách xe');
    }
  }
);

export const fetchAvailableDrivers = createAsyncThunk(
  'staffBooking/fetchAvailableDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await staffBookingApi.getAvailableDrivers();
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Không thể lấy danh sách tài xế');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách tài xế');
    }
  }
);

// Slice
const staffBookingSlice = createSlice({
  name: 'staffBooking',
  initialState,
  reducers: {
    resetStaffBookingState: (state) => {
      state.bookings = [];
      state.currentBooking = null;
      state.bookingDetails = null;
      state.stats = null;
      state.availableVehicles = [];
      state.availableDrivers = [];
      state.loading = false;
      state.error = null;
      state.pagination = initialState.pagination;
      state.filters = initialState.filters;
    },
    
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    
    clearBookingDetails: (state) => {
      state.bookingDetails = null;
    },
    
    setFilters: (state, action: PayloadAction<Partial<BookingFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateBookingInList: (state, action: PayloadAction<{ bookingId: string; updates: Partial<StaffBooking> }>) => {
      const { bookingId, updates } = action.payload;
      const index = state.bookings.findIndex(b => b._id === bookingId);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stats
      .addCase(fetchBookingStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchBookingStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Booking By ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Booking Details For Staff
      .addCase(fetchBookingDetailsForStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetailsForStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingDetails = action.payload;
        // Also set available vehicles and drivers
        if (action.payload.availableVehicles) {
          state.availableVehicles = action.payload.availableVehicles;
        }
        if (action.payload.availableDrivers) {
          state.availableDrivers = action.payload.availableDrivers;
        }
      })
      .addCase(fetchBookingDetailsForStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Confirm Booking
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        
        const { bookingId, data } = action.payload;
        const status = toBookingStatus(data.status);
        
        // Update booking in list
        const index = state.bookings.findIndex(b => b._id === bookingId);
        if (index !== -1) {
          state.bookings[index] = {
            ...state.bookings[index],
            status: status,
            status_text: data.status_text
          };
        }
        
        // Update current booking if it's the same
        if (state.currentBooking?._id === bookingId) {
          state.currentBooking = {
            ...state.currentBooking,
            status: status,
            status_text: data.status_text
          };
        }
        
        // Update booking details if it's the same
        if (state.bookingDetails?.booking._id === bookingId) {
          state.bookingDetails.booking = {
            ...state.bookingDetails.booking,
            status: status,
            status_text: data.status_text
          };
          state.bookingDetails.canAssign = status === 'confirmed';
        }
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Assign Driver and Vehicle
      .addCase(assignDriverAndVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignDriverAndVehicle.fulfilled, (state, action) => {
        state.loading = false;
        
        const { bookingId, data } = action.payload;
        const status = toBookingStatus(data.booking.status);
        const tripAssignment = createTripAssignment(data.assignment);
        
        // Update booking in list
        const index = state.bookings.findIndex(b => b._id === bookingId);
        if (index !== -1) {
          state.bookings[index] = {
            ...state.bookings[index],
            status: status,
            status_text: data.booking.status_text,
            tripAssignment
          };
        }
        
        // Update current booking if it's the same
        if (state.currentBooking?._id === bookingId) {
          state.currentBooking = {
            ...state.currentBooking,
            status: status,
            status_text: data.booking.status_text,
            tripAssignment
          };
        }
        
        // Update booking details if it's the same
        if (state.bookingDetails?.booking._id === bookingId) {
          state.bookingDetails.booking = {
            ...state.bookingDetails.booking,
            status: status,
            status_text: data.booking.status_text,
            tripAssignment
          };
          state.bookingDetails.canAssign = false;
        }
        
        // Remove assigned driver and vehicle from available lists
        if (data.assignment.driver) {
          state.availableDrivers = state.availableDrivers.filter(
            d => d._id !== data.assignment.driver._id
          );
        }
        if (data.assignment.vehicle) {
          state.availableVehicles = state.availableVehicles.filter(
            v => v._id !== data.assignment.vehicle._id
          );
        }
      })
      .addCase(assignDriverAndVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update Booking Status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        const { bookingId, data } = action.payload;
        const status = toBookingStatus(data.status);
        
        // Update booking in list
        const index = state.bookings.findIndex(b => b._id === bookingId);
        if (index !== -1) {
          state.bookings[index] = {
            ...state.bookings[index],
            status: status,
            status_text: data.status_text
          };
        }
        
        // Update current booking if it's the same
        if (state.currentBooking?._id === bookingId) {
          state.currentBooking = {
            ...state.currentBooking,
            status: status,
            status_text: data.status_text
          };
        }
        
        // Update booking details if it's the same
        if (state.bookingDetails?.booking._id === bookingId) {
          state.bookingDetails.booking = {
            ...state.bookingDetails.booking,
            status: status,
            status_text: data.status_text
          };
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Available Vehicles
      .addCase(fetchAvailableVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.availableVehicles = action.payload;
      })
      .addCase(fetchAvailableVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Available Drivers
      .addCase(fetchAvailableDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.availableDrivers = action.payload;
      })
      .addCase(fetchAvailableDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  resetStaffBookingState,
  clearCurrentBooking,
  clearBookingDetails,
  setFilters,
  resetFilters,
  setPagination,
  clearError,
  updateBookingInList
} = staffBookingSlice.actions;

export default staffBookingSlice.reducer;