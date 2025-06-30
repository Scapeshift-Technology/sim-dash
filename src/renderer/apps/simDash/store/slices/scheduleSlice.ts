import { ScheduleItem } from '@/types/sqlite';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import type { RootState } from '@/store/store';
import { SimHistoryEntry } from '@/types/simHistory';

// --------------------
// This slice contains data needed to display the schedule in LeagueScheduleView.tsx
// --------------------

// ---------- Types ----------

interface LiveStatus {
  abstractGameState: string;
  detailedState: string;
  reason?: string;
}

interface ScheduleItemWithDisplayedSimOdds extends ScheduleItem {
  simResults?: SimHistoryEntry[];
  liveStatus?: LiveStatus;
  status?: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
}

interface ScheduleState {
  // Every league gets their state
  [key: string]: LeagueScheduleState;
};

interface LeagueScheduleState { 
  date: string;
  schedule: ScheduleItemWithDisplayedSimOdds[];
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
    console.log(`[fetchSchedule] Fetching data for ${league} on ${date}`);
    const response = await window.electronAPI.fetchSchedule({ league, date });
    // Ensure all dates are serialized as strings
    return response.map(item => ({
      ...item,
      PostDtmUTC: new Date(item.PostDtmUTC).toISOString()
    }));
  }
);

export const fetchSimResults = createAsyncThunk<SimHistoryEntry[], { league: string; matchId: number }>(
  'schedule/fetchSimResults',
  async ({ league, matchId }) => {
    const response: SimHistoryEntry[] = await window.electronAPI.getSimHistory(matchId);
    return response;
  }
)

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
    },
    updateLiveStatus: (state, action: PayloadAction<{ league: string; matchId: number; status: LiveStatus }>) => {
      const { league, matchId, status } = action.payload;
      if (state[league]) {
        const match = state[league].schedule.find(m => m.Match === matchId);
        if (match) {
          match.liveStatus = status;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch schedule
      .addCase(fetchSchedule.pending, (state, action) => {
        const league = action.meta.arg.league;
        if (!state[league]) {
          state[league] = initialLeagueState;
        }
        state[league].status = 'loading';
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        const league = action.meta.arg.league;

        const newSchedule = action.payload.map(newMatch => {
          const existingMatch = state[league].schedule.find(m => m.Match === newMatch.Match);
          return {
              ...newMatch,
              simResults: existingMatch?.simResults,
              status: existingMatch?.status
          };
        });

        state[league].status = 'succeeded';
        state[league].schedule = newSchedule;
        state[league].error = null;
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        const league = action.meta.arg.league;
        state[league].status = 'failed';
        state[league].error = action.error.message ?? 'Unknown error fetching schedule';
      })
      // Fetch sim history
      .addCase(fetchSimResults.pending, (state, action) => {
        const league = action.meta.arg.league;
        const match = state[league].schedule.find((match: ScheduleItemWithDisplayedSimOdds) => match.Match === action.meta.arg.matchId);
        if (match) {
          match.status = 'loading';
        }
      })
      .addCase(fetchSimResults.fulfilled, (state, action) => {
        const league = action.meta.arg.league;
        // Set match history data
        const match = state[league].schedule.find((match: ScheduleItemWithDisplayedSimOdds) => match.Match === action.meta.arg.matchId);
        if (match) {
          match.status = 'succeeded';
          match.simResults = action.payload;
        }
      })
      .addCase(fetchSimResults.rejected, (state, action) => {
        const league = action.meta.arg.league;
        const match = state[league].schedule.find((match: ScheduleItemWithDisplayedSimOdds) => match.Match === action.meta.arg.matchId);
        if (match) {
          match.status = 'failed';
          match.error = action.error.message ?? 'Error fetching sim history';
        }
      })
  },
});

// ---------- Actions ----------

export const { 
  initializeLeague,
  updateLeagueDate,
  updateLiveStatus
} = scheduleSlice.actions;

// ---------- Selectors ----------
// ----- League Schedule -----
export const selectLeagueSchedule = (state: RootState, league: string) => state.simDash.schedule[league];
export const selectLeagueScheduleStatus = (state: RootState, league: string) => state.simDash.schedule[league]?.status ?? 'idle';
export const selectLeagueScheduleError = (state: RootState, league: string) => state.simDash.schedule[league]?.error ?? null;
export const selectLeagueScheduleData = (state: RootState, league: string) => state.simDash.schedule[league]?.schedule ?? [];
export const selectLeagueScheduleDate = (state: RootState, league: string) => state.simDash.schedule[league]?.date ?? dayjs().format('YYYY-MM-DD');

// ----- Sim Results -----
export const selectMatchSimResults = (state: RootState, league: string, matchId: number) => {
    const match = state.simDash.schedule[league]?.schedule.find(m => m.Match === matchId);
    return match?.simResults;
};
export const selectMatchSimStatus = (state: RootState, league: string, matchId: number) => {
    const match = state.simDash.schedule[league]?.schedule.find(m => m.Match === matchId);
    return match?.status ?? 'idle';
};
export const selectMatchSimError = (state: RootState, league: string, matchId: number) => {
    const match = state.simDash.schedule[league]?.schedule.find(m => m.Match === matchId);
    return match?.error ?? null;
};

// ----- Live Status -----
export const selectMatchLiveStatus = (state: RootState, league: string, matchId: number) => {
    const match = state.simDash.schedule[league]?.schedule.find(m => m.Match === matchId);
    return match?.liveStatus;
};

// Export the reducer
export default scheduleSlice.reducer;
