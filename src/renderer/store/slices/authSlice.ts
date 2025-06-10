import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { authPersistConfig } from '@/store/persistConfig';
import type { RootState } from '@/store/store'; // Import RootState for selector typing

import {
  LoginConfig,
  LoginResult,
  LogoutResult
} from '@/types/sqlite';
import {
  AuthState,
  GranteeResult,
  GrantorResult,
  AddUserPermissionRequest,
  RemoveUserPermissionRequest
} from '@/types/auth';

// ---------- Initial State ----------

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  isRegistrationLoading: false,
  error: null,
  hasPartyRole: null,
  telegramToken: null,
  telegramTokenExpiration: null,
  isTelegramTokenLoading: false,
  
  // Database Connection
  databaseConnectionStatus: 'idle',
  
  // Party Management
  userDefaultParty: null,
  currentParty: null,
  
  // Permissions
  granteePermissions: [],
  grantorPermissions: [],
  
  // Role Types
  roleTypes: [],
  roleTypesError: null,
  roleTypesLoading: false,
  
  // Add User Permission
  addUserPermissionError: null,
  addUserPermissionLoading: false,
  
  // Remove User Permission
  removeUserPermissionError: null,
  removeUserPermissionLoading: false,
  
  // Fetch Permissions
  fetchPermissionsError: null,
  fetchPermissionsLoading: false,
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
    async (_, { dispatch, rejectWithValue }) => {
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

// Async thunk for generating telegram token
export const generateTelegramToken = createAsyncThunk<
    { token: string; expirationDtm: string }, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/generateTelegramToken',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            const result = await window.electronAPI.executeSqlQuery('EXEC dbo.PartyTelegramRegistrationToken_CREATE_tr');
            const record = result.recordset[0];
            if (record && record.Token && record.ExpirationDtm) {
                return {
                    token: record.Token,
                    expirationDtm: record.ExpirationDtm
                };
            } else {
                throw new Error('Invalid response from token generation procedure');
            }
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while generating telegram token.');
        }
    }
);

// Async thunk for fetching user default party
export const fetchUserDefaultParty = createAsyncThunk<
    string | null, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/fetchUserDefaultParty',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            const result = await window.electronAPI.executeSqlQuery('SELECT dbo.User_GET_Party_fn() as defaultParty');
            return result.recordset[0]?.defaultParty.trim() || null;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching default party.');
        }
    }
);

// Async thunk for fetching permissions (grantee and grantor)
export const fetchPermissions = createAsyncThunk<
    { granteePermissions: GranteeResult[]; grantorPermissions: GrantorResult[] }, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/fetchPermissions',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            
            // GranteeResult - lists parties that have granted permission to you
            const granteeResult = await window.electronAPI.executeSqlQuery(`
                IF IS_ROLEMEMBER('ss_party') = 1
                    SELECT Grantor, PartyAgentRoleType
                    FROM dbo.PartyAgentRole_V
                    WHERE Grantor <> dbo.User_GET_Party_fn()
                ELSE
                    SELECT NULL as Grantor, NULL as PartyAgentRoleType WHERE 1=0
            `);

            // GrantorResult - lists parties that you have granted permissions to
            const grantorResult = await window.electronAPI.executeSqlQuery(`
                IF IS_ROLEMEMBER('ss_party') = 1
                    SELECT Grantee, PartyAgentRoleType
                    FROM dbo.PartyAgentRole_V
                    WHERE Grantor = dbo.User_GET_Party_fn()
                ELSE
                    SELECT NULL as Grantee, NULL as PartyAgentRoleType WHERE 1=0
            `);

            return {
                granteePermissions: granteeResult.recordset.filter(row => row.Grantor !== null),
                grantorPermissions: grantorResult.recordset.filter(row => row.Grantee !== null)
            };
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching permissions.');
        }
    }
);

// Async thunk for fetching role types
export const fetchRoleTypes = createAsyncThunk<
    string[], // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/fetchRoleTypes',
    async (_, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            const result = await window.electronAPI.executeSqlQuery(`
                SELECT DISTINCT PartyAgentRoleType
                FROM dbo.PartyAgentRoleType
            `);
            return result.recordset.map((row: any) => row.PartyAgentRoleType);
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching role types.');
        }
    }
);

// Async thunk for adding user permission
export const addUserPermission = createAsyncThunk<
    void, // Return type on success
    AddUserPermissionRequest, // Argument type
    { rejectValue: string }
>(
    'auth/addUserPermission',
    async ({ granteeUsername, partyAgentRoleType }, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            await window.electronAPI.executeSqlQuery(`
                EXEC dbo.PartyAgentRole_ADD_tr 
                @GranteeUsr = '${granteeUsername.replace(/'/g, "''")}', 
                @PartyAgentRoleType = '${partyAgentRoleType.replace(/'/g, "''")}'
            `);
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while adding user permission.');
        }
    }
);

// Async thunk for removing user permission
export const removeUserPermission = createAsyncThunk<
    void, // Return type on success
    RemoveUserPermissionRequest, // Argument type
    { rejectValue: string }
>(
    'auth/removeUserPermission',
    async ({ granteeUsername, partyAgentRoleType }, { rejectWithValue }) => {
        try {
            if (!window.electronAPI?.executeSqlQuery) {
                throw new Error('SQL execution API is not available.');
            }
            await window.electronAPI.executeSqlQuery(`
                EXEC dbo.PartyAgentRole_DELETE_tr 
                @GranteeUsr = '${granteeUsername.replace(/'/g, "''")}', 
                @PartyAgentRoleType = '${partyAgentRoleType.replace(/'/g, "''")}'
            `);
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while removing user permission.');
        }
    }
);

// Async thunk for loading complete auth state after login
export const loadAuthState = createAsyncThunk<
    void, // Return type on success
    void, // No arguments needed
    { rejectValue: string }
>(
    'auth/loadAuthState',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // Check role membership first
            await dispatch(checkRoleMembership()).unwrap();
            
            // Fetch user default party
            await dispatch(fetchUserDefaultParty()).unwrap();
            
            // Fetch permissions (only if user has party role)
            await dispatch(fetchPermissions()).unwrap();
            
        } catch (err: any) {
            // Don't reject the whole operation if some parts fail
            console.warn('Some auth state loading failed:', err);
            // Still consider it successful since core auth worked
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
    // Set the current party
    setCurrentParty: (state, action: PayloadAction<string>) => {
      state.currentParty = action.payload;
    },
    // Clear specific error states
    clearAddUserPermissionError: (state) => {
      state.addUserPermissionError = null;
    },
    clearRemoveUserPermissionError: (state) => {
      state.removeUserPermissionError = null;
    },
    clearRoleTypesError: (state) => {
      state.roleTypesError = null;
    },
    clearFetchPermissionsError: (state) => {
      state.fetchPermissionsError = null;
    },
    // Database connection actions
    setConnectionStatus: (state, action: PayloadAction<'idle' | 'attempting' | 'connected' | 'failed'>) => {
      state.databaseConnectionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login actions
      .addCase(loginUser.pending, (state) => {
        state.isRegistrationLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResult>) => {
        state.isRegistrationLoading = false;
        state.isAuthenticated = true;
        state.username = action.payload.username || null;
        state.error = null;
        state.databaseConnectionStatus = 'connected';
        // Auth state will be loaded by the dispatched loadAuthState thunk
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isRegistrationLoading = false;
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
        state.isRegistrationLoading = false;
        state.isAuthenticated = false;
        state.username = null;
        state.error = null;
        state.hasPartyRole = null; // Reset role status on logout
        state.telegramToken = null;
        state.telegramTokenExpiration = null;
        state.isTelegramTokenLoading = false;
        // Reset party and agent state
        state.userDefaultParty = null;
        state.currentParty = null;
        state.granteePermissions = [];
        state.grantorPermissions = [];
        state.roleTypes = [];
        state.roleTypesError = null;
        state.roleTypesLoading = false;
        state.addUserPermissionError = null;
        state.addUserPermissionLoading = false;
        state.removeUserPermissionError = null;
        state.removeUserPermissionLoading = false;
        state.fetchPermissionsError = null;
        state.fetchPermissionsLoading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
         // Even on rejection, typically reset auth state as user intended to logout
        state.isRegistrationLoading = false;
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
        state.isRegistrationLoading = true;
        state.error = null;
      })
      .addCase(registerUserParty.fulfilled, (state) => {
        state.isRegistrationLoading = false;
        // Role status will be updated by subsequent checkRoleMembership call
      })
      .addCase(registerUserParty.rejected, (state, action) => {
        state.isRegistrationLoading = false;
        state.error = action.payload ?? 'Registration failed';
      })
      // Unregistration actions
      .addCase(unregisterUserParty.pending, (state) => {
        state.isRegistrationLoading = true;
        state.error = null;
      })
      .addCase(unregisterUserParty.fulfilled, (state) => {
        state.isRegistrationLoading = false;
        // Role status will be updated by subsequent checkRoleMembership call
      })
      .addCase(unregisterUserParty.rejected, (state, action) => {
        state.isRegistrationLoading = false;
        state.error = action.payload ?? 'Unregistration failed';
      })
      // Telegram token generation actions
      .addCase(generateTelegramToken.pending, (state) => {
        state.isTelegramTokenLoading = true;
        state.error = null;
      })
      .addCase(generateTelegramToken.fulfilled, (state, action: PayloadAction<{ token: string; expirationDtm: string }>) => {
        state.isTelegramTokenLoading = false;
        state.error = null;
        state.telegramToken = action.payload.token;
        state.telegramTokenExpiration = action.payload.expirationDtm;
      })
      .addCase(generateTelegramToken.rejected, (state, action) => {
        state.isTelegramTokenLoading = false;
        state.error = action.payload ?? 'Telegram token generation failed';
      })
      // Fetch user default party actions
      .addCase(fetchUserDefaultParty.pending, (state) => {
        // Could add loading state if needed
      })
      .addCase(fetchUserDefaultParty.fulfilled, (state, action: PayloadAction<string | null>) => {
        state.userDefaultParty = action.payload;
        // Set current party to default party if not already set
        if (!state.currentParty && action.payload) {
          state.currentParty = action.payload;
        }
      })
      .addCase(fetchUserDefaultParty.rejected, (state, action) => {
        console.error("Fetch user default party failed:", action.payload);
      })
      // Fetch permissions actions
      .addCase(fetchPermissions.pending, (state) => {
        state.fetchPermissionsLoading = true;
        state.fetchPermissionsError = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action: PayloadAction<{ granteePermissions: GranteeResult[]; grantorPermissions: GrantorResult[] }>) => {
        state.fetchPermissionsLoading = false;
        state.granteePermissions = action.payload.granteePermissions;
        state.grantorPermissions = action.payload.grantorPermissions;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.fetchPermissionsLoading = false;
        state.fetchPermissionsError = action.payload ?? 'Failed to fetch permissions';
      })
      // Fetch role types actions
      .addCase(fetchRoleTypes.pending, (state) => {
        state.roleTypesLoading = true;
        state.roleTypesError = null;
      })
      .addCase(fetchRoleTypes.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.roleTypesLoading = false;
        state.roleTypes = action.payload;
      })
      .addCase(fetchRoleTypes.rejected, (state, action) => {
        state.roleTypesLoading = false;
        state.roleTypesError = action.payload ?? 'Failed to fetch role types';
      })
      // Add user permission actions
      .addCase(addUserPermission.pending, (state) => {
        state.addUserPermissionLoading = true;
        state.addUserPermissionError = null;
      })
      .addCase(addUserPermission.fulfilled, (state) => {
        state.addUserPermissionLoading = false;
      })
      .addCase(addUserPermission.rejected, (state, action) => {
        state.addUserPermissionLoading = false;
        state.addUserPermissionError = action.payload ?? 'Failed to add user permission';
      })
      // Remove user permission actions
      .addCase(removeUserPermission.pending, (state) => {
        state.removeUserPermissionLoading = true;
        state.removeUserPermissionError = null;
      })
      .addCase(removeUserPermission.fulfilled, (state) => {
        state.removeUserPermissionLoading = false;
      })
      .addCase(removeUserPermission.rejected, (state, action) => {
        state.removeUserPermissionLoading = false;
        state.removeUserPermissionError = action.payload ?? 'Failed to remove user permission';
      });
  },
});

export const { clearAuthError, setCurrentParty, clearAddUserPermissionError, clearRemoveUserPermissionError, clearRoleTypesError, clearFetchPermissionsError, setConnectionStatus } = authSlice.actions;

// Selector to get the entire auth state
export const selectAuthState = (state: RootState) => state.auth;
// Selector to get only the isAuthenticated status
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
// Selector for username
export const selectUsername = (state: RootState) => state.auth.username;
// Selector for registration loading state
export const selectRegistrationLoading = (state: RootState) => state.auth.isRegistrationLoading;
// Selector for error message
export const selectAuthError = (state: RootState) => state.auth.error;
// Selector for party role membership
export const selectHasPartyRole = (state: RootState) => state.auth.hasPartyRole;
// Selector for telegram token
export const selectTelegramToken = (state: RootState) => state.auth.telegramToken;
// Selector for telegram token expiration
export const selectTelegramTokenExpiration = (state: RootState) => state.auth.telegramTokenExpiration;
// Selector for telegram token loading state
export const selectTelegramTokenLoading = (state: RootState) => state.auth.isTelegramTokenLoading;
// Selector for database connection status
export const selectDatabaseConnectionStatus = (state: RootState) => state.auth.databaseConnectionStatus;

// Party Management Selectors
export const selectUserDefaultParty = (state: RootState) => state.auth.userDefaultParty;
export const selectCurrentParty = (state: RootState) => state.auth.currentParty;

// Permissions Selectors
export const selectGranteePermissions = (state: RootState) => state.auth.granteePermissions;
export const selectGrantorPermissions = (state: RootState) => state.auth.grantorPermissions;
export const selectFetchPermissionsLoading = (state: RootState) => state.auth.fetchPermissionsLoading;
export const selectFetchPermissionsError = (state: RootState) => state.auth.fetchPermissionsError;

// Role Types Selectors
export const selectRoleTypes = (state: RootState) => state.auth.roleTypes;
export const selectRoleTypesLoading = (state: RootState) => state.auth.roleTypesLoading;
export const selectRoleTypesError = (state: RootState) => state.auth.roleTypesError;

// Add User Permission Selectors
export const selectAddUserPermissionLoading = (state: RootState) => state.auth.addUserPermissionLoading;
export const selectAddUserPermissionError = (state: RootState) => state.auth.addUserPermissionError;

// Remove User Permission Selectors
export const selectRemoveUserPermissionLoading = (state: RootState) => state.auth.removeUserPermissionLoading;
export const selectRemoveUserPermissionError = (state: RootState) => state.auth.removeUserPermissionError;

// Computed Selectors
// Get available parties for dropdown (user's default party + parties that granted permissions)
export const selectAvailableParties = (state: RootState) => {
  const defaultParty = state.auth.userDefaultParty;
  const granteePermissions = state.auth.granteePermissions;
  
  const parties = new Set<string>();
  
  // Add default party if it exists
  if (defaultParty) {
    parties.add(defaultParty);
  }
  
  // Add parties that have granted permissions
  granteePermissions.forEach(permission => {
    if (permission.Grantor) {
      parties.add(permission.Grantor);
    }
  });
  
  return Array.from(parties);
};

const authReducer = authSlice.reducer;
export default persistReducer(authPersistConfig, authReducer); 