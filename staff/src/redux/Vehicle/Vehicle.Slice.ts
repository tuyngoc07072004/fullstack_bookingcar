import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { vehicleApi } from './Vehicle.Api';
import {
  Vehicle,
  VehicleFormData,
  VehicleUpdatePayload,
  VehicleStatusUpdatePayload,
  VehicleStats,
  VehicleSearchParams,
  VehicleFilters,
  VehicleStatus,
  VehicleSeatCount,
} from '../../types/Vehicle.types';

interface VehicleState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  stats: VehicleStats | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  } | null;
}

const initialState: VehicleState = {
  vehicles: [],
  currentVehicle: null,
  stats: null,
  loading: false,
  error: null,
  success: false,
  message: null,
  pagination: null,
};

// Helper function to get token from multiple sources
const getToken = (state: any): string | null => {
  // Priority from Redux state
  if (state.staff?.token) {
    return state.staff.token;
  }
  // Fallback to localStorage
  const localToken = localStorage.getItem('staffToken');
  if (localToken) {
    return localToken;
  }
  return null;
};

const isValidId = (id: string): boolean => {
  
  if (!id) {
    return false;
  }
  
  if (id === 'undefined' || id === 'null') {
    return false;
  }
  
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    return false;
  }
  
  return true;
};


export const addVehicle = createAsyncThunk(
  'vehicle/add',
  async (payload: VehicleFormData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại để thêm xe');
      }
      
      const response = await vehicleApi.addVehicle(payload, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Thêm xe thất bại');
    }
  }
);

// Lấy tất cả xe
export const fetchAllVehicles = createAsyncThunk(
  'vehicle/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getAllVehicles(token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy danh sách xe thất bại');
    }
  }
);

// Lấy xe theo ID
export const fetchVehicleById = createAsyncThunk(
  'vehicle/fetchById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      if (!isValidId(id)) {
        throw new Error('ID xe không hợp lệ');
      }
      
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getVehicleById(id, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy thông tin xe thất bại');
    }
  }
);

// Lấy xe theo trạng thái
export const fetchVehiclesByStatus = createAsyncThunk(
  'vehicle/fetchByStatus',
  async (status: VehicleStatus, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getVehiclesByStatus(status, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy danh sách xe theo trạng thái thất bại');
    }
  }
);

// Lấy xe theo số chỗ
export const fetchVehiclesBySeats = createAsyncThunk(
  'vehicle/fetchBySeats',
  async (seats: VehicleSeatCount, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getVehiclesBySeats(seats, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy danh sách xe theo số chỗ thất bại');
    }
  }
);

// Tìm kiếm xe
export const searchVehicles = createAsyncThunk(
  'vehicle/search',
  async (params: VehicleSearchParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.searchVehicles(params, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Tìm kiếm xe thất bại');
    }
  }
);

// Lọc xe
export const filterVehicles = createAsyncThunk(
  'vehicle/filter',
  async (filters: VehicleFilters, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getVehiclesByFilters(filters, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lọc xe thất bại');
    }
  }
);

// Cập nhật xe
export const updateVehicle = createAsyncThunk(
  'vehicle/update',
  async ({ id, payload }: { id: string; payload: VehicleUpdatePayload }, { getState, rejectWithValue }) => {
    try {
      console.log('📝 updateVehicle called with ID:', id, 'type:', typeof id);
      
      if (!isValidId(id)) {
        throw new Error(`ID xe không hợp lệ: ${id}`);
      }
      
      const state = getState() as any;
      const token = getToken(state);
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại để cập nhật xe');
      }
      
      const response = await vehicleApi.updateVehicle(id, payload, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Cập nhật xe thất bại');
    }
  }
);

// Cập nhật trạng thái xe
export const updateVehicleStatus = createAsyncThunk(
  'vehicle/updateStatus',
  async ({ id, payload }: { id: string; payload: VehicleStatusUpdatePayload }, { getState, rejectWithValue }) => {
    try {
      
      if (!isValidId(id)) {
        throw new Error(`ID xe không hợp lệ: ${id}`);
      }
      
      const state = getState() as any;
      const token = getToken(state);
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại để cập nhật trạng thái');
      }
      
      const response = await vehicleApi.updateVehicleStatus(id, payload, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Cập nhật trạng thái xe thất bại');
    }
  }
);

// Xóa xe
export const deleteVehicle = createAsyncThunk(
  'vehicle/delete',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      
      if (!isValidId(id)) {
        throw new Error(`ID xe không hợp lệ: ${id}`);
      }
      
      const state = getState() as any;
      const token = getToken(state);
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại để xóa xe');
      }
      
      const response = await vehicleApi.deleteVehicle(id, token);
      console.log('✅ Delete successful, response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ deleteVehicle error:', error.message);
      return rejectWithValue(error.message || 'Xóa xe thất bại');
    }
  }
);

// Lấy thống kê xe
export const fetchVehicleStats = createAsyncThunk(
  'vehicle/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = getToken(state);
      const response = await vehicleApi.getVehicleStats(token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy thống kê xe thất bại');
    }
  }
);

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
      state.success = false;
    },
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    resetState: (state) => {
      state.vehicles = [];
      state.currentVehicle = null;
      state.stats = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Vehicle
      .addCase(addVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = 'Thêm xe thành công';
        state.vehicles.unshift(action.payload);
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Fetch All Vehicles
      .addCase(fetchAllVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
        console.log('✅ Vehicles loaded in state:', state.vehicles.length);
      })
      .addCase(fetchAllVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Vehicle By ID
      .addCase(fetchVehicleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVehicle = action.payload;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Vehicles By Status
      .addCase(fetchVehiclesByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiclesByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehiclesByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Vehicles By Seats
      .addCase(fetchVehiclesBySeats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiclesBySeats.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehiclesBySeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Search Vehicles
      .addCase(searchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Filter Vehicles
      .addCase(filterVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(filterVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Vehicle
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = 'Cập nhật xe thành công';
        
        const index = state.vehicles.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        
        if (state.currentVehicle?._id === action.payload._id) {
          state.currentVehicle = action.payload;
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Update Vehicle Status
      .addCase(updateVehicleStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVehicleStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = 'Cập nhật trạng thái xe thành công';
        
        const index = state.vehicles.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        
        if (state.currentVehicle?._id === action.payload._id) {
          state.currentVehicle = action.payload;
        }
      })
      .addCase(updateVehicleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Delete Vehicle
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = 'Xóa xe thành công';
        
        console.log('🗑️ Deleting vehicle with _id:', action.payload._id);
        state.vehicles = state.vehicles.filter(v => v._id !== action.payload._id);
        
        if (state.currentVehicle?._id === action.payload._id) {
          state.currentVehicle = null;
        }
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Fetch Vehicle Stats
      .addCase(fetchVehicleStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchVehicleStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMessage, setCurrentVehicle, resetState } = vehicleSlice.actions;
export default vehicleSlice.reducer;