import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  getAllDrivers, 
  getDriverById, 
  getDriversByStatus, 
  updateDriverStatus, 
  searchDrivers,
  UpdateStatusPayload,
  DriverManagementState 
} from './DriverManagement.Api';
import { Driver } from '../../types/Driver.types';
import { RootState } from '../store';

// Initial state
const initialState: DriverManagementState = {
  drivers: [],
  selectedDriver: null,
  loading: false,
  error: null,
  searchResults: [],
  filters: {
    status: null,
    searchKeyword: ''
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 10
  }
};

// Async thunks
export const fetchAllDrivers = createAsyncThunk(
  'driverManagement/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      // Lấy token từ state.staff (cấu trúc StaffState có token riêng)
      const token = state.staff.token;
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token xác thực');
      }
      
      const response = await getAllDrivers(token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách tài xế');
    }
  }
);

export const fetchDriverById = createAsyncThunk(
  'driverManagement/fetchById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.staff.token;
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token xác thực');
      }
      
      const response = await getDriverById(id, token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy thông tin tài xế');
    }
  }
);

export const fetchDriversByStatus = createAsyncThunk(
  'driverManagement/fetchByStatus',
  async (status: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.staff.token;
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token xác thực');
      }
      
      const response = await getDriversByStatus(status, token);
      return {
        drivers: response.data,
        status: status
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách tài xế theo trạng thái');
    }
  }
);

export const updateDriverStatusThunk = createAsyncThunk(
  'driverManagement/updateStatus',
  async ({ id, status }: { id: string; status: UpdateStatusPayload }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.staff.token;
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token xác thực');
      }
      
      const response = await updateDriverStatus(id, status, token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi cập nhật trạng thái tài xế');
    }
  }
);

export const searchDriversThunk = createAsyncThunk(
  'driverManagement/search',
  async (keyword: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.staff.token;
      
      if (!token) {
        return rejectWithValue('Không tìm thấy token xác thực');
      }
      
      const response = await searchDrivers(keyword, token);
      return {
        drivers: response.data,
        keyword: keyword
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi tìm kiếm tài xế');
    }
  }
);

// Slice
const driverManagementSlice = createSlice({
  name: 'driverManagement',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedDriver: (state) => {
      state.selectedDriver = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.filters.searchKeyword = '';
    },
    setFilters: (state, action: PayloadAction<{ status?: string | null; searchKeyword?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        status: null,
        searchKeyword: ''
      };
      state.pagination = {
        total: 0,
        page: 1,
        limit: 10
      };
    },
    updateDriverInList: (state, action: PayloadAction<Driver>) => {
      const index = state.drivers.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.drivers[index] = action.payload;
      }
      
      // Cập nhật trong search results nếu có
      const searchIndex = state.searchResults.findIndex(d => d._id === action.payload._id);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex] = action.payload;
      }
      
      // Cập nhật selectedDriver nếu đang chọn
      if (state.selectedDriver?._id === action.payload._id) {
        state.selectedDriver = action.payload;
      }
    },
    removeDriverFromList: (state, action: PayloadAction<string>) => {
      state.drivers = state.drivers.filter(d => d._id !== action.payload);
      state.searchResults = state.searchResults.filter(d => d._id !== action.payload);
      if (state.selectedDriver?._id === action.payload) {
        state.selectedDriver = null;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch all drivers
    builder
      .addCase(fetchAllDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDrivers.fulfilled, (state, action: PayloadAction<Driver[]>) => {
        state.loading = false;
        state.drivers = action.payload;
        state.pagination.total = action.payload.length;
      })
      .addCase(fetchAllDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    // Fetch driver by ID
      .addCase(fetchDriverById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriverById.fulfilled, (state, action: PayloadAction<Driver>) => {
        state.loading = false;
        state.selectedDriver = action.payload;
      })
      .addCase(fetchDriverById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    // Fetch drivers by status
      .addCase(fetchDriversByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriversByStatus.fulfilled, (state, action: PayloadAction<{ drivers: Driver[]; status: string }>) => {
        state.loading = false;
        state.drivers = action.payload.drivers;
        state.filters.status = action.payload.status;
        state.pagination.total = action.payload.drivers.length;
      })
      .addCase(fetchDriversByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    // Update driver status
      .addCase(updateDriverStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDriverStatusThunk.fulfilled, (state, action: PayloadAction<Driver>) => {
        state.loading = false;
        
        // Cập nhật trong danh sách drivers
        const index = state.drivers.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.drivers[index] = action.payload;
        }
        
        // Cập nhật trong search results
        const searchIndex = state.searchResults.findIndex(d => d._id === action.payload._id);
        if (searchIndex !== -1) {
          state.searchResults[searchIndex] = action.payload;
        }
        
        // Cập nhật selectedDriver
        if (state.selectedDriver?._id === action.payload._id) {
          state.selectedDriver = action.payload;
        }
      })
      .addCase(updateDriverStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    // Search drivers
      .addCase(searchDriversThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchDriversThunk.fulfilled, (state, action: PayloadAction<{ drivers: Driver[]; keyword: string }>) => {
        state.loading = false;
        state.searchResults = action.payload.drivers;
        state.filters.searchKeyword = action.payload.keyword;
      })
      .addCase(searchDriversThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Actions
export const { 
  clearError, 
  clearSelectedDriver, 
  clearSearchResults,
  setFilters,
  setPagination,
  resetFilters,
  updateDriverInList,
  removeDriverFromList
} = driverManagementSlice.actions;

// Selectors
export const selectAllDrivers = (state: RootState) => state.driverManagement.drivers;
export const selectSelectedDriver = (state: RootState) => state.driverManagement.selectedDriver;
export const selectDriverManagementLoading = (state: RootState) => state.driverManagement.loading;
export const selectDriverManagementError = (state: RootState) => state.driverManagement.error;
export const selectSearchResults = (state: RootState) => state.driverManagement.searchResults;
export const selectDriverFilters = (state: RootState) => state.driverManagement.filters;
export const selectDriverPagination = (state: RootState) => state.driverManagement.pagination;

// Filtered drivers selector (combines regular drivers and search results)
export const selectDisplayedDrivers = (state: RootState) => {
  const { searchResults, drivers, filters } = state.driverManagement;
  
  // Nếu đang tìm kiếm, hiển thị kết quả tìm kiếm
  if (filters.searchKeyword && searchResults.length > 0) {
    return searchResults;
  }
  
  // Nếu đang lọc theo status, hiển thị drivers đã được lọc
  if (filters.status) {
    return drivers.filter(d => d.status === filters.status);
  }
  
  // Mặc định hiển thị tất cả drivers
  return drivers;
};

export default driverManagementSlice.reducer;