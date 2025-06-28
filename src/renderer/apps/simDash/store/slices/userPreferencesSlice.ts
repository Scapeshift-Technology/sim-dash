import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

// ---------- Types ----------

export interface UserPreferencesState {
  roiDemandPercentage: number; // Stored as percentage (2.0 for 2%)
}

// ---------- Initial State ----------

const initialState: UserPreferencesState = {
  roiDemandPercentage: 2.0 // Default to 2%
};

// ---------- Slice ----------

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setROIDemandPercentage: (state, action: PayloadAction<number>) => {
      // Clamp maximum to 10 percent, allow negative values
      state.roiDemandPercentage = Math.min(10, action.payload);
    },
    resetToDefaults: (state) => {
      state.roiDemandPercentage = 2.0;
    }
  }
});

// ---------- Actions ----------

export const { setROIDemandPercentage, resetToDefaults } = userPreferencesSlice.actions;

// ---------- Selectors ----------

export const selectROIDemandPercentage = (state: RootState): number => 
  state.simDash.userPreferences.roiDemandPercentage;

export const selectROIDemandDecimal = (state: RootState): number => 
  state.simDash.userPreferences.roiDemandPercentage / 100;

// ---------- Export ----------

export default userPreferencesSlice.reducer; 