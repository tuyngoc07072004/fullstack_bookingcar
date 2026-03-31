import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import bookingReducer from './Booking/Booking.Slice';
import paymentReducer from './Payment/Payment.Slice';
import driverReviewReducer from './DriverReview/DriverReview.Slice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
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