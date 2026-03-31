import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import driverReducer from './Driver/Driver.Slice';
import vehicleReducer from './Vehicle/Vehicle.Slice';
import driverManagementReducer from './DriverManagement/DriverManagement.Slice';
import bookingReducer from './Booking/Booking.Slice';
import tripReducer from './Trip/Trip.Slice';
import driverTripReducer from './DriverTrip/DriverTrip.Slice'; 
import driverSelfTripReducer from './DriverSelfTrip/DriverSelfTrip.Slice';
import paymentReducer from './Payment/Payment.Slice';
import driverReviewReducer from './DriverReview/DriverReview.Slice';

export const store = configureStore({
  reducer: {
    driver: driverReducer,
    vehicle: vehicleReducer,
    driverManagement: driverManagementReducer,
    booking: bookingReducer,
    trip: tripReducer,
    driverTrip: driverTripReducer,
    driverSelfTrip: driverSelfTripReducer,
    payment: paymentReducer,
    driverReview: driverReviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const getAuthToken = (): string | null => {
  const state = store.getState();
  if (state.driver?.token) return state.driver.token;
  return localStorage.getItem('staffToken') || localStorage.getItem('driverToken');
};


export const getDriverInfo = (): any => {
  const state = store.getState();
  if (state.driver?.currentDriver) return state.driver.currentDriver;
  const stored = localStorage.getItem('driverInfo');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};