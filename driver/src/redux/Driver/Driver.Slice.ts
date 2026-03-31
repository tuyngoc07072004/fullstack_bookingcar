// src/redux/Driver/Driver.Slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { driverApi } from './Driver.Api';
import { 
  Driver, 
  DriverRegisterPayload,
  DriverLoginPayload 
} from '../../types/Driver.types';

interface DriverState {
  currentDriver: Driver | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

const loadState = (): DriverState => {
  try {
    const token = localStorage.getItem('driverToken');
    const driverInfo = localStorage.getItem('driverInfo');
    
    console.log('📦 Loading driver state from localStorage:', { 
      hasToken: !!token, 
      hasDriverInfo: !!driverInfo,
    });
    
    let currentDriver = null;
    if (driverInfo) {
      try {
        currentDriver = JSON.parse(driverInfo);
        console.log('📦 Loaded driver info:', { 
          id: currentDriver._id, 
          name: currentDriver.name,
          status: currentDriver.status 
        });
      } catch (e) {
        console.error('Error parsing driver info:', e);
      }
    }
    
    return {
      currentDriver,
      token: token || null,
      loading: false,
      error: null,
      success: false,
      message: null,
    };
  } catch (error) {
    console.error('Error loading driver state:', error);
    return {
      currentDriver: null,
      token: null,
      loading: false,
      error: null,
      success: false,
      message: null,
    };
  }
};

const initialState: DriverState = loadState();

// Đăng ký
export const driverRegister = createAsyncThunk(
  'driver/driver-register',
  async (payload: DriverRegisterPayload, { rejectWithValue }) => {
    try {
      const response = await driverApi.register(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng ký thất bại');
    }
  }
);

// Đăng nhập
export const driverLogin = createAsyncThunk(
  'driver/driver-login',
  async (payload: DriverLoginPayload, { rejectWithValue }) => {
    try {
      const response = await driverApi.login(payload);
      console.log('✅ Login response received, token:', response.token ? 'Yes' : 'No');
      console.log('✅ Driver status from login:', response.status);
      
      // Lưu token và driver info vào localStorage
      localStorage.setItem('driverToken', response.token);
      localStorage.setItem('driverInfo', JSON.stringify({
        _id: response.id,
        name: response.name,
        phone: response.phone,
        license_number: response.license_number,
        username: response.username,
        status: response.status,
        created_at: new Date().toISOString(),
      }));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

// Đăng xuất
export const driverLogout = createAsyncThunk(
  'driver/driver-logout',
  async (_, { rejectWithValue }) => {
    try {
      await driverApi.logout();
    } catch (error: any) {
      console.warn('Logout API error:', error.message);
    }
    // Always clear local storage
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverInfo');
    return null;
  }
);

// Lấy thông tin tài xế hiện tại
export const fetchCurrentDriver = createAsyncThunk(
  'driver/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverApi.getCurrentDriver();
      // Cập nhật localStorage
      localStorage.setItem('driverInfo', JSON.stringify(response));
      console.log('✅ Current driver fetched, status:', response.status);
      return response;
    } catch (error: any) {
      // Nếu lỗi 401 (unauthorized), xóa localStorage
      if (error.status === 401) {
        localStorage.removeItem('driverToken');
        localStorage.removeItem('driverInfo');
      }
      return rejectWithValue(error.message || 'Lấy thông tin thất bại');
    }
  }
);

// Lấy thông tin tài xế theo ID (cho polling)
export const fetchDriverById = createAsyncThunk(
  'driver/fetchById',
  async (driverId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { driver: DriverState };
      const token = state.driver.token;
      
      const response = await driverApi.getDriverById(driverId, token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy thông tin tài xế thất bại');
    }
  }
);

// Lấy status chỉ (cho polling nhanh)
export const fetchDriverStatus = createAsyncThunk(
  'driver/fetchStatus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { driver: DriverState };
      const token = state.driver.token;
      
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await fetch('/api/driver/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch status');
      }
      
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lấy trạng thái thất bại');
    }
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
      state.success = false;
    },
    resetState: (state) => {
      state.currentDriver = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverInfo');
      console.log('🔄 Driver state reset');
    },
    // Cập nhật thông tin tài xế (dùng cho polling hoặc WebSocket)
    updateDriverInfo: (state, action: PayloadAction<Driver>) => {
      const oldStatus = state.currentDriver?.status;
      const newStatus = action.payload.status;
      
      console.log('🔄 updateDriverInfo called:', {
        oldStatus,
        newStatus,
        hasCurrentDriver: !!state.currentDriver,
        timestamp: new Date().toISOString()
      });
      
      if (state.currentDriver) {
        // Cập nhật từng field
        state.currentDriver = {
          ...state.currentDriver,
          ...action.payload
        };
      } else {
        state.currentDriver = action.payload;
      }
      
      // Lưu vào localStorage
      localStorage.setItem('driverInfo', JSON.stringify(state.currentDriver));
      console.log('💾 Driver info saved to localStorage, status:', state.currentDriver.status);
      
      // Trigger event để các component khác có thể lắng nghe
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('driverStatusChanged', { 
          detail: { oldStatus, newStatus, driver: state.currentDriver }
        }));
      }
    },
    // Cập nhật trạng thái tài xế
    updateDriverStatus: (state, action: PayloadAction<'active' | 'inactive' | 'busy'>) => {
      if (state.currentDriver) {
        const oldStatus = state.currentDriver.status;
        const newStatus = action.payload;
        
        console.log(`🔄 Updating driver status: ${oldStatus} → ${newStatus}`);
        state.currentDriver.status = newStatus;
        
        // Cập nhật localStorage
        localStorage.setItem('driverInfo', JSON.stringify(state.currentDriver));
        
        // Trigger event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('driverStatusChanged', { 
            detail: { oldStatus, newStatus, driver: state.currentDriver }
          }));
        }
      }
    },
    // Cập nhật token
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('driverToken', action.payload);
      console.log('🔑 Token saved to localStorage');
    }
  },
  extraReducers: (builder) => {
    builder
      // Đăng ký
      .addCase(driverRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(driverRegister.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.message = 'Đăng ký thành công';
      })
      .addCase(driverRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Đăng nhập
      .addCase(driverLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(driverLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDriver = {
          _id: action.payload.id,
          name: action.payload.name,
          phone: action.payload.phone,
          license_number: action.payload.license_number,
          username: action.payload.username,
          status: action.payload.status as 'active' | 'inactive' | 'busy',
          created_at: new Date().toISOString(),
        };
        state.token = action.payload.token;
        state.success = true;
        state.message = 'Đăng nhập thành công';
        console.log('✅ Driver logged in, status:', state.currentDriver.status);
      })
      .addCase(driverLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      // Đăng xuất
      .addCase(driverLogout.pending, (state) => {
        state.loading = true;
      })
      .addCase(driverLogout.fulfilled, (state) => {
        state.loading = false;
        state.currentDriver = null;
        state.token = null;
        state.success = true;
        state.message = 'Đăng xuất thành công';
        console.log('✅ Driver logged out');
      })
      .addCase(driverLogout.rejected, (state) => {
        state.loading = false;
        state.currentDriver = null;
        state.token = null;
        console.log('⚠️ Driver logout with errors, state cleared anyway');
      })

      // Lấy thông tin hiện tại
      .addCase(fetchCurrentDriver.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentDriver.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDriver = action.payload;
        state.success = true;
        console.log('✅ Current driver fetched, status:', state.currentDriver?.status);
      })
      .addCase(fetchCurrentDriver.rejected, (state, action) => {
        state.loading = false;
        state.currentDriver = null;
        state.token = null;
        state.error = action.payload as string || 'Phiên đăng nhập hết hạn';
        console.log('❌ Failed to fetch current driver:', state.error);
      })

      // Lấy thông tin tài xế theo ID (polling)
      .addCase(fetchDriverById.pending, (state) => {
        // Không set loading để tránh ảnh hưởng UI
      })
      .addCase(fetchDriverById.fulfilled, (state, action) => {
        // Cập nhật thông tin driver nếu có thay đổi
        if (state.currentDriver && action.payload) {
          const oldStatus = state.currentDriver.status;
          const newStatus = action.payload.status;
          
          if (oldStatus !== newStatus) {
            console.log(`🔄 [fetchDriverById] Driver status changed: ${oldStatus} → ${newStatus}`);
          }
          
          state.currentDriver = {
            ...state.currentDriver,
            ...action.payload
          };
          // Cập nhật localStorage
          localStorage.setItem('driverInfo', JSON.stringify(state.currentDriver));
        }
      })
      .addCase(fetchDriverById.rejected, (state, action) => {
        console.error('❌ Failed to fetch driver info:', action.payload);
      })
      
      // Lấy status chỉ (polling nhanh)
      .addCase(fetchDriverStatus.fulfilled, (state, action) => {
        if (state.currentDriver && action.payload) {
          const oldStatus = state.currentDriver.status;
          const newStatus = action.payload.status;
          
          if (oldStatus !== newStatus) {
            console.log(`🔄 [fetchDriverStatus] Status changed: ${oldStatus} → ${newStatus}`);
            state.currentDriver.status = newStatus;
            state.currentDriver.updated_at = action.payload.updated_at;
            localStorage.setItem('driverInfo', JSON.stringify(state.currentDriver));
          }
        }
      })
      .addCase(fetchDriverStatus.rejected, (state, action) => {
        console.error('❌ Failed to fetch driver status:', action.payload);
      });
  },
});

export const { 
  clearError, 
  clearMessage, 
  resetState,
  updateDriverInfo,
  updateDriverStatus,
  setToken
} = driverSlice.actions;

export default driverSlice.reducer;