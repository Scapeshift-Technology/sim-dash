import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import { persistConfig, persistReducer } from './persistConfig';

// Import the combined reducers
import simDashReducer from '@/simDash/store/rootReducer';
// accounting reducers (future)
// import accountingReducer from '@/accounting/store/rootReducer';
// Overall app reducer
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import counterpartiesReducer from './slices/counterpartiesSlice';
import ledgerReducer from './slices/ledgerSlice';

// ---------- Reducers ----------
const rootReducer = combineReducers({
  simDash: simDashReducer,
  // accounting: accountingReducer,

  auth: authReducer,
  app: appReducer,
  counterparties: counterpartiesReducer,
  ledger: ledgerReducer,
});

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Export types for TypeScript support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
