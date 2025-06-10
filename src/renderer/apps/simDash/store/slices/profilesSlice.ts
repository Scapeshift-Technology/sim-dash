import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { current } from '@reduxjs/toolkit';
import { Profile, ProfilesState } from '@/types/profiles';
import { LoginConfig } from '@@/types/sqlite';

const initialState: ProfilesState = {
  profiles: [],
  selectedProfileName: null,
  isLoading: false,
  error: null,
  statusMessage: null,

  // ---------- Delete a profile ----------
  deleteProfileStatus: null,
  deleteProfileError: null,

  // ---------- Save a profile ----------
  saveProfileStatus: null,
  saveProfileError: null,

  // ---------- Test connection ----------
  testConnectionStatus: null,
  testConnectionError: null
  };


// Async thunk for fetching profiles
export const fetchProfiles = createAsyncThunk<
  Profile[], // Return type on success
  void,      // No arguments
  { rejectValue: string }
>('profiles/fetchProfiles', async (_, { rejectWithValue }) => {
  try {
    if (!window.electronAPI?.getProfiles) {
      throw new Error('getProfiles API is not available.');
    }
    const result: Profile[] = await window.electronAPI.getProfiles();
    return result;
  } catch (err: any) {
    console.error('[profilesSlice] Error calling getProfiles:', err);
    return rejectWithValue(err.message || 'Failed to fetch profiles.');
  }
});

// Async thunk for saving a profile
export const saveProfile = createAsyncThunk<
  Profile, // Return the saved profile on success
  Profile, // Argument is the profile to save
  { rejectValue: string }
>('profiles/saveProfile', async (profile, { rejectWithValue }) => {
  try {
    if (!window.electronAPI?.saveProfile) {
      throw new Error('saveProfile API is not available.');
    }
    // Actually call the API
    const success: boolean = await window.electronAPI.saveProfile(profile);
    if (success) {
      return profile; // Return the profile data that was intended to be saved
    } else {
      return rejectWithValue('Failed to save profile on backend.');
    }
  } catch (err: any) {
    return rejectWithValue(err.message || 'An unexpected error occurred while saving profile.');
  }
});

// Async thunk for deleting a profile
export const deleteProfile = createAsyncThunk<
  string, // Return the name of the deleted profile on success
  string, // Argument is the profile name to delete
  { rejectValue: string }
>('profiles/deleteProfile', async (profileName, { rejectWithValue }) => {
  try {
    if (!window.electronAPI?.deleteProfile) {
      throw new Error('deleteProfile API is not available.');
    }
    const success: boolean = await window.electronAPI.deleteProfile(profileName);
    if (success) {
      return profileName; // Return the name of the deleted profile
    } else {
      return rejectWithValue('Failed to delete profile on backend.');
    }
  } catch (err: any) {
    return rejectWithValue(err.message || 'An unexpected error occurred while deleting profile.');
  }
});

// Thunk for checking connection
export const testConnection = createAsyncThunk<
  boolean, // Return type on success
  LoginConfig, // Argument is the login config
  { rejectValue: string }
>('profiles/testConnection', async (config, { rejectWithValue }) => {
  try {
    if (!window.electronAPI?.testConnection) {
      throw new Error('testConnection API is not available.');
    }
    const result: boolean = await window.electronAPI.testConnection(config);
    return result;
  } catch (err: any) {
    return rejectWithValue(err.message || 'An unexpected error occurred while testing connection.');
  }
});

// ---------- Slice ----------

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setSelectedProfile: (state, action: PayloadAction<string | null>) => {
      state.selectedProfileName = action.payload;
      state.statusMessage = null; // Clear status when changing selection
      state.error = null;
      // Reset save/delete states when changing profile
      state.deleteProfileStatus = null;
      state.deleteProfileError = null;
      state.saveProfileStatus = null;
      state.saveProfileError = null;
    },
    clearProfileStatus: (state) => {
      state.statusMessage = null;
    },
    clearProfileError: (state) => {
      state.error = null;
    },
    resetProfileOperationStates: (state) => {
      state.deleteProfileStatus = null;
      state.deleteProfileError = null;
      state.saveProfileStatus = null;
      state.saveProfileError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profiles
      .addCase(fetchProfiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.statusMessage = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action: PayloadAction<Profile[]>) => {
        state.isLoading = false;
        state.profiles = action.payload; // Check if this line is correctly updating the state
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to load profiles';
      })
      
      // ---------- Delete a profile ----------
      .addCase(deleteProfile.pending, (state) => {
        state.deleteProfileStatus = 'pending';
        state.deleteProfileError = null;
      })
      .addCase(deleteProfile.fulfilled, (state, action) => {
        state.deleteProfileStatus = 'success';
        state.deleteProfileError = null;
      })
      .addCase(deleteProfile.rejected, (state, action) => {
        state.deleteProfileStatus = 'error';
        state.deleteProfileError = action.payload ?? 'Error deleting profile';
      })
      
      // ---------- Save a profile ----------
      .addCase(saveProfile.pending, (state) => {
        state.saveProfileStatus = 'pending';
        state.saveProfileError = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saveProfileStatus = 'success';
        state.saveProfileError = null;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saveProfileStatus = 'error';
        state.saveProfileError = action.payload ?? 'Error saving profile';
      })

      // ---------- Test connection ----------
      .addCase(testConnection.pending, (state) => {
        state.testConnectionStatus = 'pending';
        state.testConnectionError = null;
      })
      .addCase(testConnection.fulfilled, (state, action) => {
        state.testConnectionStatus = 'success';
        state.testConnectionError = null;
      })
      .addCase(testConnection.rejected, (state, action) => {
        state.testConnectionStatus = 'error';
        state.testConnectionError = action.payload ?? 'Error testing connection';
      });
  },
});

export const { setSelectedProfile, clearProfileStatus, clearProfileError, resetProfileOperationStates } = profilesSlice.actions;

// Selectors
export const selectProfilesState = (state: RootState) => state.simDash.profiles;
export const selectAllProfiles = (state: RootState) => state.simDash.profiles.profiles;
export const selectSelectedProfileName = (state: RootState) => state.simDash.profiles.selectedProfileName;
export const selectProfileByName = (name: string | null) => (state: RootState): Profile | null => {
    if (!name) return null;
    return state.simDash.profiles.profiles.find(p => p.name === name) ?? null;
};
export const selectProfilesLoading = (state: RootState) => state.simDash.profiles.isLoading;
export const selectProfilesError = (state: RootState) => state.simDash.profiles.error;
export const selectProfilesStatusMessage = (state: RootState) => state.simDash.profiles.statusMessage;

export default profilesSlice.reducer;

 