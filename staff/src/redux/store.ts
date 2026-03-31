import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import vehicleReducer from './Vehicle/Vehicle.Slice';
import staffReducer from './Staff/Staff.Slice';
import driverManagementReducer from './DriverManagement/DriverManagement.Slice';
import bookingReducer from './Booking/Booking.Slice';
import staffBookingReducer from './StaffBooking/StaffBooking.Slice';
import staffCustomerReducer from './StaffCustomer/StaffCustomer.Slice';
import driverTripReducer from './DriverTrip/DriverTrip.Slice'; 
import paymentReducer from './Payment/Payment.Slice';
import driverReviewReducer from './DriverReview/DriverReview.Slice';

export const store = configureStore({
  reducer: {
    vehicle: vehicleReducer,
    staff: staffReducer,
    driverManagement: driverManagementReducer,
    booking: bookingReducer,
    staffBooking: staffBookingReducer,
    staffCustomer: staffCustomerReducer,
    driverTrip: driverTripReducer,
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


export const getStaffInfo = (): any => {
  const state = store.getState();
  if (state.staff?.currentStaff) return state.staff.currentStaff;
  const stored = localStorage.getItem('staffInfo');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};
