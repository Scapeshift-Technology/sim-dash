import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { MatchupLineups, Player } from '@/types/mlb';

// ---------- Types ----------
interface GameInputs {
  lineups: {
    data: MatchupLineups | null;
    lineupsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    lineupsError: string | null;
    statsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    statsError: string | null;
  };
  inputs: Record<string, any>; // Will be typed properly later
}

interface SimInputsState {
  games: Record<number, GameInputs>;
}

// ---------- Thunks ----------

export const fetchMlbLineup = createAsyncThunk<
  { matchId: number; lineups: MatchupLineups },
  { 
    league: string;
    date: string;
    participant1: string;
    participant2: string;
    daySequence?: number;
    matchId: number;
  }
>(
  'simInputs/fetchMlbLineup',
  async ({ league, date, participant1, participant2, daySequence, matchId }) => {
    const lineups = await window.electronAPI.fetchMlbLineup({
      league,
      date,
      participant1,
      participant2,
      daySequence
    });
    return { matchId, lineups };
  }
);

export const fetchMlbGamePlayerStats = createAsyncThunk<
  { matchId: number; playerStats: MatchupLineups },
  { matchId: number; matchupLineups: MatchupLineups }
>(
  'simInputs/fetchMlbGamePlayerStats',
  async ({ matchId, matchupLineups }) => {
    const playerStats = await window.electronAPI.fetchMlbGamePlayerStats(matchupLineups);
    return { matchId, playerStats };
  }
)

// ---------- Slice ----------

const initialState: SimInputsState = {
  games: {}
};

const simInputsSlice = createSlice({
  name: 'simInputs',
  initialState,
  reducers: {
    clearGameData: (state, action: { payload: number }) => {
      const matchId = action.payload;
      if (state.games[matchId]) {
        state.games[matchId] = {
          lineups: {
            data: null,
            lineupsStatus: 'idle',
            lineupsError: null,
            statsStatus: 'idle',
            statsError: null
          },
          inputs: {}
        };
      }
    },
    reorderLineup: (state, action: { 
      payload: { 
        matchId: number; 
        team: 'home' | 'away'; 
        newOrder: Player[] 
      } 
    }) => {
      const { matchId, team, newOrder } = action.payload;
      if (state.games[matchId]?.lineups.data) {
        state.games[matchId].lineups.data[team].lineup = newOrder;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ---------- Fetch MLB Lineup ----------
      .addCase(fetchMlbLineup.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (!state.games[matchId]) {
          state.games[matchId] = {
            lineups: {
              data: null,
              lineupsStatus: 'loading',
              lineupsError: null,
              statsStatus: 'idle',
              statsError: null
            },
            inputs: {}
          };
        }
        state.games[matchId].lineups.lineupsError = null;
        state.games[matchId].lineups.lineupsStatus = 'loading';
      })
      .addCase(fetchMlbLineup.fulfilled, (state, action) => {
        const { matchId, lineups } = action.payload;
        state.games[matchId].lineups.data = lineups;
        state.games[matchId].lineups.lineupsStatus = 'succeeded';
        state.games[matchId].lineups.lineupsError = null;
      })
      .addCase(fetchMlbLineup.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        state.games[matchId].lineups.lineupsStatus = 'failed';
        state.games[matchId].lineups.lineupsError = action.error.message ?? 'Failed to fetch lineup data';
      })
      // ---------- Fetch MLB Game Player Stats ----------
      .addCase(fetchMlbGamePlayerStats.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        // It should have already loaded by now
        // Just set state to loading and error to null
        state.games[matchId].lineups.statsError = null;
        state.games[matchId].lineups.statsStatus = 'loading';
      })
      .addCase(fetchMlbGamePlayerStats.fulfilled, (state, action) => {
        const { matchId, playerStats } = action.payload;
        state.games[matchId].lineups.data = playerStats;
        state.games[matchId].lineups.statsStatus = 'succeeded';
        state.games[matchId].lineups.statsError = null;
      })
      .addCase(fetchMlbGamePlayerStats.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        state.games[matchId].lineups.statsStatus = 'failed';
        state.games[matchId].lineups.statsError = action.error.message ?? 'Failed to fetch player stats';
      });
  }
});

// ---------- Actions ----------

export const { clearGameData, reorderLineup } = simInputsSlice.actions;

// ---------- Selectors ----------

export const selectGameInputs = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId];
export const selectGameLineups = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups;
export const selectGameLineupsData = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups.data;
export const selectGameLineupsStatus = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups.lineupsStatus ?? 'idle';
export const selectGameLineupsError = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups.lineupsError;
export const selectGamePlayerStatsStatus = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups.statsStatus ?? 'idle';
export const selectGamePlayerStatsError = (state: { simInputs: SimInputsState }, matchId: number) => 
  state.simInputs.games[matchId]?.lineups.statsError;

export default simInputsSlice.reducer;

