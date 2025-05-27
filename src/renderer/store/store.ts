import { configureStore, combineReducers } from '@reduxjs/toolkit';

// Import the combined reducers
import simDashReducer from '@/simDash/store/rootReducer';
// accounting reducers (future)
// import accountingReducer from '@/accounting/store/rootReducer';
// Overall app reducer
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import counterpartiesReducer from './slices/counterpartiesSlice';


const rootReducer = combineReducers({
  simDash: simDashReducer,
  // accounting: accountingReducer,

  auth: authReducer,
  app: appReducer,
  counterparties: counterpartiesReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  // Optional: Add middleware here if needed
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

// Export types for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
