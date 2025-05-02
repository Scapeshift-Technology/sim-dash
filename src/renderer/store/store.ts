import { configureStore } from '@reduxjs/toolkit';
// Import your future slice reducers here
import authReducer from './slices/authSlice';
import profilesReducer from './slices/profilesSlice';
import tabReducer from './slices/leagueSlice'; // Renamed variable and kept file name
// import leagueReducer from './slices/leagueSlice'; // Keep for future use

export const store = configureStore({
  reducer: {
    // Add reducers here as they are created
    auth: authReducer,
    profiles: profilesReducer,
    tabs: tabReducer, // Use the new slice name 'tabs' and the imported reducer
    // leagues: leagueReducer,
    // Remove placeholder now that we have real reducers
    // placeholder: (state = {}) => state,
  },
  // Optional: Add middleware here if needed (e.g., for logging)
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Define a custom hook type for dispatching actions with correct typings
export type AppDispatch = typeof store.dispatch; 