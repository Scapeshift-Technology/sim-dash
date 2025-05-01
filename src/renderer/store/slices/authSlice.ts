import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // Import RootState for selector typing

// Define the shape of the login configuration expected by the API
interface LoginConfig {
  host: string;
  port: string; // Keep as string, main process will parse
  database: string;
  user: string;
  password?: string;
}

// Define the shape of the successful login response from the API
interface LoginSuccessResponse {
  success: true;
  username: string;
}

// Define the shape of the failed login response from the API
interface LoginErrorResponse {
  success: false;
  error: string;
}

// Define the shape of the logout response (adjust if API returns more)
interface LogoutResponse {
  success: boolean;
  error?: string;
}

// Define the state structure for authentication
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  isLoading: false,
  error: null,
};

// Async thunk for handling login
export const loginUser = createAsyncThunk<
  LoginSuccessResponse, // Return type on success
  LoginConfig,          // Argument type
  { rejectValue: string } // Type for rejected promise payload
>(
  'auth/loginUser',
  async (config, { rejectWithValue }) => {
    try {
      // Check if electronAPI is available
      if (!window.electronAPI?.login) {
        throw new Error('Login API is not available. Check preload script.');
      }
      const result: LoginSuccessResponse | LoginErrorResponse = await window.electronAPI.login(config);
      if (result.success) {
        return result; // Contains { success: true, username: string }
      } else {
        // Use rejectWithValue to pass the error message
        return rejectWithValue(result.error || 'Unknown login error');
      }
    } catch (err: any) {
        // Handle generic errors (e.g., IPC communication failure)
        return rejectWithValue(err.message || 'An unexpected error occurred during login.');
    }
  }
);

// Async thunk for handling logout
export const logoutUser = createAsyncThunk<
    LogoutResponse,
    void, // No arguments needed for logout
    { rejectValue: string }
>(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.logout) {
                throw new Error('Logout API is not available.');
            }
            const result: LogoutResponse = await window.electronAPI.logout();
            if (!result.success) {
                 // Even if backend logout fails, we proceed with client-side logout,
                 // but maybe log the error or show a less severe message.
                console.warn('Backend logout failed:', result.error);
                // Optionally reject, but typically we want the UI to reflect logged out state anyway
                // return rejectWithValue(result.error || 'Logout failed on backend.');
            }
            return result; // Contains { success: boolean, error?: string }
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred during logout.');
        }
    }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Optional: a synchronous action to clear errors if needed
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login actions
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginSuccessResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.username = action.payload.username;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.username = null;
        state.error = action.payload ?? 'Login failed'; // Use payload from rejectWithValue
      })
       // Logout actions
      .addCase(logoutUser.pending, (state) => {
        // Optional: set loading state during logout if needed
        // state.isLoading = true;
        state.error = null; // Clear errors on logout attempt
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Reset state regardless of backend success, as user initiated logout
        state.isLoading = false;
        state.isAuthenticated = false;
        state.username = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
         // Even on rejection, typically reset auth state as user intended to logout
        state.isLoading = false;
        state.isAuthenticated = false;
        state.username = null;
        // Optionally store the logout error, but might confuse user
        // state.error = action.payload ?? 'Logout failed';
        console.error("Logout rejected:", action.payload);
      });
  },
});

export const { clearAuthError } = authSlice.actions;

// Selector to get the entire auth state
export const selectAuthState = (state: RootState) => state.auth;
// Selector to get only the isAuthenticated status
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
// Selector for username
export const selectUsername = (state: RootState) => state.auth.username;
// Selector for loading state
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
// Selector for error message
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer; 