import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface AuthState {
  credentials: {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  credentials: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState['credentials']>) => {
      state.credentials = action.payload;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.credentials = null;
      state.isAuthenticated = false;
    },
  },
});

// Selectors
export const selectUsername = (state: RootState) => state.auth.credentials?.username ?? '';

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer; 