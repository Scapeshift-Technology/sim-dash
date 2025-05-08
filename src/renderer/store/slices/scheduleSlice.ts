import { ScheduleItem } from '@/types/sqlite';
import { createSlice, createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';
import dayjs, { Dayjs } from 'dayjs';
import type { RootState } from '../store';

// ---------- Types ----------

interface ScheduleState {
  // Every league gets their state
  [key: string]: LeagueScheduleState;
};

interface LeagueScheduleState { 
    date: string;
    schedule: ScheduleItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };

const initialState: ScheduleState = {};
const initialLeagueState: LeagueScheduleState = {
  date: dayjs().format('YYYY-MM-DD'),
  schedule: [],
  status: 'idle',
  error: null,
};

// ---------- Thunks ----------

export const fetchSchedule = createAsyncThunk<ScheduleItem[], { league: string; date: string }>(
  'schedule/fetchSchedule',
  async ({ league, date }) => {
    const response = await window.electronAPI.fetchSchedule({ league, date });
    // Ensure all dates are serialized as strings
    return response.map(item => ({
      ...item,
      PostDtmUTC: new Date(item.PostDtmUTC).toISOString()
    }));
  }
);

// ---------- Slice ----------
const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    initializeLeague: (state, action: PayloadAction<string>) => {
      const league = action.payload;
      if (!state[league]) {
        state[league] = initialLeagueState;
      }
    },
    updateLeagueDate: (state, action: PayloadAction<{ league: string; date: string }>) => {
      const league = action.payload.league;
      if (state[league]) {
        state[league].date = action.payload.date;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedule.pending, (state, action) => {
        const league = action.meta.arg.league;
        if (!state[league]) {
          state[league] = initialLeagueState;
        }
        state[league].status = 'loading';
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        const league = action.meta.arg.league;
        state[league].status = 'succeeded';
        state[league].schedule = action.payload;
        state[league].error = null;
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        const league = action.meta.arg.league;
        state[league].status = 'failed';
        state[league].error = action.error.message ?? 'Unknown error fetching schedule';
      });
  },
});

// ---------- Actions ----------

export const { 
  initializeLeague,
  updateLeagueDate
} = scheduleSlice.actions;

// ---------- Selectors ----------

export const selectLeagueSchedule = (state: RootState, league: string) => state.schedule[league];
export const selectLeagueScheduleStatus = (state: RootState, league: string) => state.schedule[league]?.status ?? 'idle';
export const selectLeagueScheduleError = (state: RootState, league: string) => state.schedule[league]?.error ?? null;
export const selectLeagueScheduleData = (state: RootState, league: string) => state.schedule[league]?.schedule ?? [];
export const selectLeagueScheduleDate = (state: RootState, league: string) => state.schedule[league]?.date ?? dayjs().format('YYYY-MM-DD');

// Export the reducer
export default scheduleSlice.reducer;
