// store/StaffCustomer/StaffCustomer.slice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import StaffCustomerAPI from './StaffCustomer.Api';
import {
  Customer,
  CustomerBooking,
  CustomerStats,
  CustomerWithDetails,
  GetAllCustomersParams,
  GetCustomerBookingsParams
} from '../../types/StaffCustomer.types';

interface StaffCustomerState {
  customers: Customer[];
  customersPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  customersLoading: boolean;
  customersError: string | null;

  selectedCustomer: CustomerWithDetails | null;
  customerStats: CustomerStats | null;
  customerBookings: CustomerBooking[];
  customerBookingsPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  customerBookingsLoading: boolean;
  customerBookingsError: string | null;

  // Search and filter
  searchQuery: string;
  bookingStatusFilter: string;
}

const initialState: StaffCustomerState = {
  customers: [],
  customersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  customersLoading: false,
  customersError: null,

  selectedCustomer: null,
  customerStats: null,
  customerBookings: [],
  customerBookingsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  customerBookingsLoading: false,
  customerBookingsError: null,

  searchQuery: '',
  bookingStatusFilter: 'all'
};

// Async thunks
export const fetchAllCustomers = createAsyncThunk(
  'staffCustomer/fetchAllCustomers',
  async (params: GetAllCustomersParams = {}, { rejectWithValue }) => {
    try {
      const response = await StaffCustomerAPI.getAllCustomers(params);
      // API trả về { success, data: { customers, pagination }, message }
      if (response.success && response.data) {
        return {
          customers: response.data.customers,
          pagination: response.data.pagination
        };
      }
      return rejectWithValue(response.message || 'Lỗi tải danh sách khách hàng');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tải danh sách khách hàng');
    }
  }
);

export const fetchCustomerBookings = createAsyncThunk(
  'staffCustomer/fetchCustomerBookings',
  async (
    { customerId, params }: { customerId: string; params?: GetCustomerBookingsParams },
    { rejectWithValue }
  ) => {
    try {
      const response = await StaffCustomerAPI.getCustomerBookings(customerId, params);
      // Backend trả về { success, data: { customer, bookings, statistics, pagination }, message }
      if (response.success && response.data) {
        const backendCustomer = response.data.customer;
        const backendStatistics = (response.data as any).statistics;

        // UI đang đọc `customerStats`, nên map `statistics` từ backend sang đúng shape.
        const mappedStats = backendStatistics
          ? {
              total_bookings: backendCustomer?.total_bookings ?? 0,
              total_spent: backendCustomer?.total_spent ?? 0,
              completed_bookings: backendStatistics.completed ?? 0,
              cancelled_bookings: backendStatistics.cancelled ?? 0,
            }
          : {
              total_bookings: backendCustomer?.total_bookings ?? 0,
              total_spent: backendCustomer?.total_spent ?? 0,
              completed_bookings: 0,
              cancelled_bookings: 0,
            };

        return {
          customer: backendCustomer,
          stats: mappedStats,
          bookings: response.data.bookings,
          pagination: response.data.pagination,
        };
      }
      return rejectWithValue(response.message || 'Lỗi tải chuyến đi của khách hàng');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tải chuyến đi của khách hàng');
    }
  }
);

const staffCustomerSlice = createSlice({
  name: 'staffCustomer',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setBookingStatusFilter: (state, action: PayloadAction<string>) => {
      state.bookingStatusFilter = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
      state.customerStats = null;
      state.customerBookings = [];
      state.customerBookingsPagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
      };
    },
    resetCustomersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch all customers
      .addCase(fetchAllCustomers.pending, (state) => {
        state.customersLoading = true;
        state.customersError = null;
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.customersLoading = false;
        state.customers = action.payload.customers;
        state.customersPagination = action.payload.pagination;
      })
      .addCase(fetchAllCustomers.rejected, (state, action) => {
        state.customersLoading = false;
        state.customersError = action.payload as string;
      })

      // Fetch customer bookings
      .addCase(fetchCustomerBookings.pending, (state) => {
        state.customerBookingsLoading = true;
        state.customerBookingsError = null;
      })
      .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
        state.customerBookingsLoading = false;
        state.selectedCustomer = action.payload.customer;
        state.customerStats = action.payload.stats;
        state.customerBookings = action.payload.bookings;
        state.customerBookingsPagination = action.payload.pagination;
      })
      .addCase(fetchCustomerBookings.rejected, (state, action) => {
        state.customerBookingsLoading = false;
        state.customerBookingsError = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setBookingStatusFilter,
  clearSelectedCustomer,
  resetCustomersState,
} = staffCustomerSlice.actions;

export default staffCustomerSlice.reducer;