import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { staffApi } from './Staff.Api';
import { 
  Staff, 
  StaffState, 
  StaffRegisterPayload,
  StaffLoginPayload
} from '../../types/Staff.types';

const loadState = (): Partial<StaffState> => {
  try {
    const token = localStorage.getItem('staffToken');
    const staffInfo = localStorage.getItem('staffInfo');
    console.log('🔄 Loading staff state from localStorage:', { 
      hasToken: !!token, 
      hasStaffInfo: !!staffInfo 
    });
    
    if (token && staffInfo) {
      return {
        token: token,
        currentStaff: JSON.parse(staffInfo),
        isAuthenticated: true
      };
    }
    return { 
      token: null, 
      currentStaff: null,
      isAuthenticated: false 
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return { 
      token: null, 
      currentStaff: null,
      isAuthenticated: false 
    };
  }
};

const initialState: StaffState = {
  currentStaff: null,
  staffList: [],
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  ...loadState(),
};

export const staffRegister = createAsyncThunk(
  'staff/register',
  async (payload: StaffRegisterPayload, { rejectWithValue }) => {
    try {
      const response = await staffApi.register(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const staffLogin = createAsyncThunk(
  'staff/login',
  async (payload: StaffLoginPayload, { rejectWithValue }) => {
    try {
      const response = await staffApi.login(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const staffLogout = createAsyncThunk(
  'staff/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await staffApi.logout();
      return { success: true };
    } catch (error: any) {
      dispatch(logout());
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const fetchCurrentStaff = createAsyncThunk(
  'staff/fetchCurrent',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { staff } = getState() as { staff: StaffState };
      let token = staff.token;
      if (!token) {
        token = localStorage.getItem('staffToken');
      }
      const response = await staffApi.getCurrentStaff(token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff');
    }
  }
);

export const fetchAllStaff = createAsyncThunk(
  'staff/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { staff } = getState() as { staff: StaffState };
      let token = staff.token;
      if (!token) {
        token = localStorage.getItem('staffToken');
      }
      const response = await staffApi.getAllStaff(token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff list');
    }
  }
);

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ id, data }: { id: string; data: Partial<Staff> }, { getState, rejectWithValue }) => {
    try {
      const { staff } = getState() as { staff: StaffState };
      let token = staff.token;
      if (!token) {
        token = localStorage.getItem('staffToken');
      }
      const response = await staffApi.updateStaff(id, data, token || undefined);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update staff');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentStaff = null;
      state.token = null;
      state.staffList = [];
      state.isAuthenticated = false;
      state.error = null;
      
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffInfo');
      
      console.log('🚪 Staff logged out');
    },
    clearError: (state) => {
      state.error = null;
    },
    setStaff: (state, action: PayloadAction<Staff>) => {
      state.currentStaff = action.payload;
      localStorage.setItem('staffInfo', JSON.stringify(action.payload));
    },
    refreshToken: (state) => {
      const token = localStorage.getItem('staffToken');
      if (token && !state.token) {
        state.token = token;
        state.isAuthenticated = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(staffRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(staffRegister.fulfilled, (state, action: PayloadAction<{ token: string; staff: Staff }>) => {
        state.loading = false;
        state.currentStaff = action.payload.staff;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        
        localStorage.setItem('staffToken', action.payload.token);
        localStorage.setItem('staffInfo', JSON.stringify(action.payload.staff));
        
        console.log('✅ Staff registered:', action.payload.staff.username);
      })
      .addCase(staffRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        console.error('❌ Staff registration failed:', action.payload);
      })
      
      .addCase(staffLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(staffLogin.fulfilled, (state, action: PayloadAction<{ token: string; staff: Staff }>) => {
        state.loading = false;
        state.currentStaff = action.payload.staff;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        
        localStorage.setItem('staffToken', action.payload.token);
        localStorage.setItem('staffInfo', JSON.stringify(action.payload.staff));
        
        console.log('✅ Staff logged in:', action.payload.staff.username);
      })
      .addCase(staffLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        console.error('❌ Staff login failed:', action.payload);
      })
      
      .addCase(staffLogout.pending, (state) => {
        state.loading = true;
      })
      .addCase(staffLogout.fulfilled, (state) => {
        state.currentStaff = null;
        state.token = null;
        state.staffList = [];
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffInfo');
        
        console.log('✅ Staff logout successful');
      })
      .addCase(staffLogout.rejected, (state, action) => {
        // Vẫn logout dù API lỗi
        state.currentStaff = null;
        state.token = null;
        state.staffList = [];
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
        
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffInfo');
        
        console.error('❌ Staff logout failed:', action.payload);
      })
      
      .addCase(fetchCurrentStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentStaff.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.loading = false;
        state.currentStaff = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('staffInfo', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffInfo');
        state.token = null;
        state.currentStaff = null;
      })
      
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action: PayloadAction<Staff[]>) => {
        state.loading = false;
        state.staffList = action.payload;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateStaff.fulfilled, (state, action: PayloadAction<Staff>) => {
        const index = state.staffList.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.staffList[index] = action.payload;
        }
        if (state.currentStaff?._id === action.payload._id) {
          state.currentStaff = action.payload;
          localStorage.setItem('staffInfo', JSON.stringify(action.payload));
        }
      });
  },
});

export const { logout, clearError, setStaff, refreshToken } = staffSlice.actions;
export default staffSlice.reducer;