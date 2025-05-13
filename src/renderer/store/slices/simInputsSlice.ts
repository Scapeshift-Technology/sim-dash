import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { MatchupLineups, Player, Position } from '@/types/mlb';
import type { MLBGameInputs, MLBLineups, MLBSimInputs, MLBSimInputsTeam, SimInputsState } from '@/types/simInputs';
import { LeagueName } from '@@/types/league';

// ---------- Initial States ----------
// ----- MLB -----

const initialMLBTeamInputs: MLBSimInputsTeam = {
  teamHitterLean: 0,
  teamPitcherLean: 0,
  individualHitterLeans: {},
  individualPitcherLeans: {}
}

const initialMLBInputs: MLBSimInputs = {
  away: initialMLBTeamInputs,
  home: initialMLBTeamInputs
}

const initialMLBLineups: MLBLineups = {
  data: null,
  lineupsStatus: 'idle',
  lineupsError: null,
  statsStatus: 'idle',
  statsError: null
}

const initialGameInputsMLB: MLBGameInputs = {
  lineups: initialMLBLineups,
  inputs: initialMLBInputs
};

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

const initialState: SimInputsState = {};

const simInputsSlice = createSlice({
  name: 'simInputs',
  initialState,
  reducers: {
    initializeLeagueSimInputs: (state, action: { payload: LeagueName }) => {
      const league = action.payload;
      if (!state[league]) {
        state[league] = {};
      }
    },
    clearGameData: (state, action: { payload: { league: LeagueName; matchId: number } }) => {
      const { league, matchId } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]) {
        state[league][matchId] = initialGameInputsMLB;
      }
    },
    reorderMLBLineup: (state, action: { 
      payload: { 
        matchId: number; 
        team: 'home' | 'away'; 
        newOrder: Player[] 
      } 
    }) => {
      const { matchId, team, newOrder } = action.payload;
      if (state['MLB']?.[matchId]?.lineups.data) {
        state['MLB'][matchId].lineups.data[team].lineup = newOrder;
      }
    },
    updateMLBPlayerPosition: (state, action: {
      payload: {
        matchId: number;
        team: 'home' | 'away';
        playerId: number;
        position: Position;
      }
    }) => {
      const { matchId, team, playerId, position } = action.payload;
      if (state['MLB']?.[matchId]?.lineups.data) {
        const player = state['MLB'][matchId].lineups.data[team].lineup.find(p => p.id === playerId);
        if (player) {
          player.position = position;
        }
      }
    },
    updateTeamLean: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        teamType: 'home' | 'away';
        leanType: 'offense' | 'defense';
        value: number;
      }
    }) => {
      const { league, matchId, teamType, leanType, value } = action.payload;
      
      // Only handle MLB for now
      if (league === 'MLB' && state[league]?.[matchId]) {
        if (leanType === 'offense') {
          state[league][matchId].inputs[teamType].teamHitterLean = value;
        } else {
          state[league][matchId].inputs[teamType].teamPitcherLean = value;
        }
      }
    },
    updatePlayerLean: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        teamType: 'home' | 'away';
        playerType: 'hitter' | 'pitcher';
        playerId: number;
        value: number;
      }
    }) => {
      const { league, matchId, teamType, playerType, playerId, value } = action.payload;
      
      // Only handle MLB for now
      if (league === 'MLB' && state[league]?.[matchId]) {
        if (playerType === 'hitter') {
          state[league][matchId].inputs[teamType].individualHitterLeans[playerId] = value;
        } else {
          state[league][matchId].inputs[teamType].individualPitcherLeans[playerId] = value;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ---------- Fetch MLB Lineup ----------
      .addCase(fetchMlbLineup.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (!state['MLB']) {
          state['MLB'] = {};
        }
        if (!state['MLB']?.[matchId]) {
          state['MLB'][matchId] = initialGameInputsMLB;
        }
        
        // Create a copy of the current state to allow for direct assignment
        const newState = { ...state['MLB'][matchId] };
        newState.lineups = { ...newState.lineups };
        
        newState.lineups.lineupsError = null;
        newState.lineups.lineupsStatus = 'loading';
        
        state['MLB'][matchId] = newState;
      })
      .addCase(fetchMlbLineup.fulfilled, (state, action) => {
        const { matchId, lineups } = action.payload;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].lineups.data = lineups;
          state['MLB'][matchId].lineups.lineupsStatus = 'succeeded';
          state['MLB'][matchId].lineups.lineupsError = null;
        }
      })
      .addCase(fetchMlbLineup.rejected, (state, action) => {
        const { matchId } = action.meta.arg;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].lineups.lineupsStatus = 'failed';
          state['MLB'][matchId].lineups.lineupsError = action.error.message ?? 'Failed to fetch lineup data';
        }
      })
      // ---------- Fetch MLB Game Player Stats ----------
      .addCase(fetchMlbGamePlayerStats.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        // It should have already loaded by now
        // Just set state to loading and error to null
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].lineups.statsError = null;
          state['MLB'][matchId].lineups.statsStatus = 'loading';
        }
        
      })
      .addCase(fetchMlbGamePlayerStats.fulfilled, (state, action) => {
        const { matchId, playerStats } = action.payload;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].lineups.data = playerStats;
          state['MLB'][matchId].lineups.statsStatus = 'succeeded';
          state['MLB'][matchId].lineups.statsError = null;
        }
      })
      .addCase(fetchMlbGamePlayerStats.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].lineups.statsStatus = 'failed';
          state['MLB'][matchId].lineups.statsError = action.error.message ?? 'Failed to fetch player stats';
        }
      });
  }
});

// ---------- Actions ----------

export const { 
  clearGameData, 
  reorderMLBLineup, 
  updateMLBPlayerPosition, 
  initializeLeagueSimInputs,
  updateTeamLean,
  updatePlayerLean
} = simInputsSlice.actions;

// ---------- Selectors ----------

export const selectGameInputs = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId];
export const selectTeamInputs = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.inputs;
export const selectGameLineups = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups;
export const selectGameLineupsData = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups.data;
export const selectGameLineupsStatus = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups.lineupsStatus ?? 'idle';
export const selectGameLineupsError = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups.lineupsError;
export const selectGamePlayerStatsStatus = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups.statsStatus ?? 'idle';
export const selectGamePlayerStatsError = (state: { simInputs: SimInputsState }, league: LeagueName, matchId: number) => 
  state.simInputs[league]?.[matchId]?.lineups.statsError;

export default simInputsSlice.reducer;

