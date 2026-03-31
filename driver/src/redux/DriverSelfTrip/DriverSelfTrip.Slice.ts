import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as selfTripApi from './DriverSelfTrip.Api';
import { DriverVehiclePayload, CreateDriverSelfBookingRequest } from '../../types/DriverSelfTrip.types';

interface DriverSelfTripState {
  myVehicle: DriverVehiclePayload | null;
  loading: boolean;
  createLoading: boolean;
  error: string | null;
}

const initialState: DriverSelfTripState = {
  myVehicle: null,
  loading: false,
  createLoading: false,
  error: null
};

export const fetchMyVehicle = createAsyncThunk('driverSelfTrip/fetchMyVehicle', async (_, { rejectWithValue }) => {
  try {
    return await selfTripApi.getMyVehicle();
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi tải xe');
  }
});

export const submitDriverSelfBooking = createAsyncThunk(
  'driverSelfTrip/create',
  async (payload: CreateDriverSelfBookingRequest, { rejectWithValue }) => {
    try {
      return await selfTripApi.createDriverSelfBooking(payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(err.response?.data?.message || err.message || 'Tạo chuyến thất bại');
    }
  }
);

const driverSelfTripSlice = createSlice({
  name: 'driverSelfTrip',
  initialState,
  reducers: {
    clearDriverSelfTripError: (state) => {
      state.error = null;
    },
    resetDriverSelfTrip: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.myVehicle = action.payload;
      })
      .addCase(fetchMyVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Lỗi';
      })
      .addCase(submitDriverSelfBooking.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(submitDriverSelfBooking.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(submitDriverSelfBooking.rejected, (state, action) => {
        state.createLoading = false;
        state.error = (action.payload as string) || 'Lỗi';
      });
  }
});

export const { clearDriverSelfTripError, resetDriverSelfTrip } = driverSelfTripSlice.actions;
export default driverSelfTripSlice.reducer;
