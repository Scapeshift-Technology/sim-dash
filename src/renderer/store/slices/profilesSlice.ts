import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { current } from '@reduxjs/toolkit';
import { Profile, ProfilesState } from '@/types/profiles';

const initialState: ProfilesState = {
  profiles: [],
  selectedProfileName: null,
  isLoading: false,
  error: null,
  statusMessage: null,
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
    console.log('[profilesSlice] Calling window.electronAPI.getProfiles...');
    const result: Profile[] = await window.electronAPI.getProfiles();
    console.log('[profilesSlice] Profiles received from main process:', result); // Log result from IPC
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

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setSelectedProfile: (state, action: PayloadAction<string | null>) => {
      state.selectedProfileName = action.payload;
      state.statusMessage = null; // Clear status when changing selection
      state.error = null;
    },
    clearProfileStatus: (state) => {
      state.statusMessage = null;
    },
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profiles
      .addCase(fetchProfiles.pending, (state) => {
        console.log('[profilesSlice] fetchProfiles pending...');
        state.isLoading = true;
        state.error = null;
        state.statusMessage = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action: PayloadAction<Profile[]>) => {
        console.log('[profilesSlice] fetchProfiles fulfilled. Payload:', action.payload);
        state.isLoading = false;
        state.profiles = action.payload; // Check if this line is correctly updating the state
        console.log('[profilesSlice] State after update:', current(state)); // Log state using current
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        console.log('[profilesSlice] fetchProfiles rejected. Payload:', action.payload);
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to load profiles';
      })
      // ... other builder cases ...
  },
});

export const { setSelectedProfile, clearProfileStatus, clearProfileError } = profilesSlice.actions;

// Selectors
export const selectProfilesState = (state: RootState) => state.profiles;
export const selectAllProfiles = (state: RootState) => state.profiles.profiles;
export const selectSelectedProfileName = (state: RootState) => state.profiles.selectedProfileName;
export const selectProfileByName = (name: string | null) => (state: RootState): Profile | null => {
    if (!name) return null;
    return state.profiles.profiles.find(p => p.name === name) ?? null;
};
export const selectProfilesLoading = (state: RootState) => state.profiles.isLoading;
export const selectProfilesError = (state: RootState) => state.profiles.error;
export const selectProfilesStatusMessage = (state: RootState) => state.profiles.statusMessage;

export default profilesSlice.reducer;

 