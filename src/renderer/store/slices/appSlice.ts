import { createSlice } from "@reduxjs/toolkit";
import { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

// ---------- Types ----------

interface AppState {
  currentApp: 'simDash' | 'accounting' | null;
}

// ---------- Initial State ----------

const initialState: AppState = {
  currentApp: 'simDash' // Default app to start with
};

// ---------- Slice ----------

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentApp: (state, action: PayloadAction<'simDash' | 'accounting'>) => {
      state.currentApp = action.payload;
    },
  },
});

export const { setCurrentApp } = appSlice.actions;

// ---------- Selectors ----------

export const selectCurrentApp = (state: RootState) => state.app.currentApp;

// ---------- Export ----------
export default appSlice.reducer;

