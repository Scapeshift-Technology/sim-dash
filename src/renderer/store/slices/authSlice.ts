import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store'; // Import RootState for selector typing
import {
  LoginConfig,
  LoginResult,
  LogoutResult
} from '@/types/sqlite';
import {
  AuthState
} from '@/types/auth';

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  isLoading: false,
  error: null,
  hasPartyRole: null,
};

// Async thunk for handling login
export const loginUser = createAsyncThunk<
  LoginResult, // Return type on success
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
      const result: LoginResult = await window.electronAPI.login(config);
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
    LogoutResult,
    void, // No arguments needed for logout
    { rejectValue: string }
>(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.logout) {
                throw new Error('Logout API is not available.');
            }
            const result: LogoutResult = await window.electronAPI.logout();
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

// Async thunk for checking role membership
export const checkRoleMembership = createAsyncThunk<
    boolean, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/checkRoleMembership',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            const result = await window.electronAPI.executeSqlQuery("SELECT IS_ROLEMEMBER('ss_party') as hasRole");
            return result.recordset[0]?.hasRole === 1;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while checking role membership.');
        }
    }
);

// Async thunk for registering user party
export const registerUserParty = createAsyncThunk<
    void, // Return type on success
    string, // Party string argument
    { rejectValue: string }
>(
    'auth/registerUserParty',
    async (party, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            // Use parameterized query to prevent SQL injection
            await window.electronAPI.executeSqlQuery(`EXEC dbo.UserParty_REGISTER_tr @Party = '${party.replace(/'/g, "''")}'`);
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred during registration.');
        }
    }
);

// Async thunk for unregistering user party
export const unregisterUserParty = createAsyncThunk<
    void, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/unregisterUserParty',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            await window.electronAPI.executeSqlQuery('EXEC dbo.UserParty_UNREGISTER_tr');
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred during unregistration.');
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
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResult>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.username = action.payload.username || null;
        state.error = null;
        // Role membership will be checked separately by the component
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
        state.hasPartyRole = null; // Reset role status on logout
      })
      .addCase(logoutUser.rejected, (state, action) => {
         // Even on rejection, typically reset auth state as user intended to logout
        state.isLoading = false;
        state.isAuthenticated = false;
        state.username = null;
        // Optionally store the logout error, but might confuse user
        // state.error = action.payload ?? 'Logout failed';
        console.error("Logout rejected:", action.payload);
      })
      // Role membership check actions
      .addCase(checkRoleMembership.pending, (state) => {
        // Optional: could add loading state for role check if needed
      })
      .addCase(checkRoleMembership.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.hasPartyRole = action.payload;
      })
      .addCase(checkRoleMembership.rejected, (state, action) => {
        state.hasPartyRole = null; // Reset to unknown on error
        console.error("Role membership check failed:", action.payload);
      })
      // Registration actions
      .addCase(registerUserParty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUserParty.fulfilled, (state) => {
        state.isLoading = false;
        // Role status will be updated by subsequent checkRoleMembership call
      })
      .addCase(registerUserParty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Registration failed';
      })
      // Unregistration actions
      .addCase(unregisterUserParty.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unregisterUserParty.fulfilled, (state) => {
        state.isLoading = false;
        // Role status will be updated by subsequent checkRoleMembership call
      })
      .addCase(unregisterUserParty.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Unregistration failed';
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
// Selector for party role membership
export const selectHasPartyRole = (state: RootState) => state.auth.hasPartyRole;

export default authSlice.reducer; 