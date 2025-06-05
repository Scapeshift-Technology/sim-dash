import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { LeagueName } from "@@/types/league";
import { RootState } from "@/store/store";
import { MLBGameInputs2, SeriesGameInputs } from "@/types/simInputs";
import { runSeriesSimulation, runSimulation } from "@/simDash/pages/MLBMatchupView/functions/simulation";
import { findOptimalLeans } from "@/simDash/pages/MLBMatchupView/functions/optimalLeans";
import { MatchupLineups } from "@/preload";
import { MarketLinesMLB, MlbLiveDataApiResponse } from "@@/types/mlb";
import { SavedConfiguration } from "@@/types/statCaptureConfig";

// --------------------
// This slice contains data that is used to display the status of a simulation in the UI
// --------------------


// ---------- Types ----------

type SimStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
type SimError = string | null;
interface SimState {
  simStatus: SimStatus;
  simError: SimError;
}

// ----- By league -----

interface MLBSimulationStatus {
  traditional: SimState;
  series: SimState;
  findLeans: SimState;
}

// ----- Overall slice types -----

export type LeagueToStatusMap = {
  MLB: MLBSimulationStatus;
  NBA: never;
  NFL: never;
  NHL: never;
}

export type SimulationStatusState = {
  [Key in LeagueName]?: {
    [matchId: number]: LeagueToStatusMap[Key & keyof LeagueToStatusMap];
  };
}

// ----- Initializers -----

const initialState: SimulationStatusState = {};

const getInitialLeagueMatchState = (league: keyof LeagueToStatusMap) => {
  function createSimState(status: SimStatus = 'idle'): SimState {
    return { simStatus: status, simError: null };
  }

  switch (league) {
    case 'MLB':
      return { traditional: createSimState(), series: createSimState(), findLeans: createSimState() };
    case 'NFL':
      // return NFL-specific initial state when implemented
      throw new Error('NFL simulation not implemented');
    default:
      throw new Error(`Unsupported league: ${league}`);
  }
};

// ---------- Thunks ----------

export const runSimulationThunk = createAsyncThunk(
  'simulationStatus/runSimulation',
  async ({
    league, // These inputs are necessary for the thunk reducers
    matchId,
    gameInputs,
    numGames = 90000,
    liveGameData,
    activeConfig
  }: {
    league: LeagueName;
    matchId: number;
    gameInputs: MLBGameInputs2;
    numGames?: number;
    liveGameData?: MlbLiveDataApiResponse;
    activeConfig?: SavedConfiguration;
  }) => {
    console.log('Running simulation thunk!', activeConfig);
    const results = await runSimulation(gameInputs, numGames, liveGameData, activeConfig);
    return results;
  }
);

export const runSeriesSimulationThunk = createAsyncThunk(
  'simulationStatus/runSeriesSimulation',
  async ({
    league, // These inputs are necessary for the thunk reducers
    matchId,
    gameInputs,
    numGames = 90000,
    activeConfig
  }: {
    league: LeagueName;
    matchId: number;
    gameInputs: SeriesGameInputs;
    numGames?: number;
    activeConfig?: SavedConfiguration;
  }) => {
    const results = await runSeriesSimulation(gameInputs, numGames, activeConfig);
    return results;
  }
);

export const findLeansThunk = createAsyncThunk(
  'simulationStatus/findLeans',
  async ({
    league, // These inputs are necessary for the thunk reducers
    matchId,
    lineups,
    marketLines
  }: {
    league: LeagueName;
    matchId: number;
    lineups: MatchupLineups;
    marketLines: MarketLinesMLB;
  }) => {
    const results = await findOptimalLeans(lineups, marketLines);
    return results;
  }
);

const handleSimulationState = (
    state: SimulationStatusState,
    league: keyof LeagueToStatusMap,
    matchId: number,
    simType: keyof MLBSimulationStatus,
    status: SimStatus,
    error: SimError = null
  ) => {
    if (!state[league]) state[league] = {};
    if (!state[league][matchId]) state[league][matchId] = getInitialLeagueMatchState(league);
    state[league][matchId][simType].simStatus = status;
    state[league][matchId][simType].simError = error;
  };

// ---------- Slice ----------

const simulationStatusSlice = createSlice({
  name: 'simulationStatus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Traditional simulation
    builder
      .addCase(runSimulationThunk.pending, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'traditional', 'loading');
      })
      .addCase(runSimulationThunk.fulfilled, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'traditional', 'succeeded');
      })
      .addCase(runSimulationThunk.rejected, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'traditional', 'failed', action.error.message ?? 'Error while running simulation');
      });

    // Series simulation
    builder
      .addCase(runSeriesSimulationThunk.pending, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'series', 'loading');
      })
      .addCase(runSeriesSimulationThunk.fulfilled, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'series', 'succeeded');
      })
      .addCase(runSeriesSimulationThunk.rejected, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'series', 'failed', action.error.message ?? 'Error while running simulation');
      });

    // Find optimal leans
    builder
      .addCase(findLeansThunk.pending, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'findLeans', 'loading');
      })
      .addCase(findLeansThunk.fulfilled, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'findLeans', 'succeeded');
      })
      .addCase(findLeansThunk.rejected, (state, action) => {
        handleSimulationState(state, action.meta.arg.league as keyof LeagueToStatusMap, action.meta.arg.matchId, 'findLeans', 'failed', action.error.message ?? 'Error while running simulation');
      });
  }
});


// ---------- Actions ----------

export const { 
  
} = simulationStatusSlice.actions;

// ---------- Selectors ----------

export const selectTraditionalSimulationStatus = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.traditional?.simStatus ?? 'idle';
}
export const selectTraditionalSimulationError = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.traditional?.simError ?? null;
}

export const selectSeriesSimulationStatus = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.series?.simStatus ?? 'idle';
}
export const selectSeriesSimulationError = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.series?.simError ?? null;
}

export const selectFindLeansStatus = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.findLeans?.simStatus ?? 'idle';
}
export const selectFindLeansError = (state: RootState, league: keyof LeagueToStatusMap, matchId: number) => {
  return state.simDash.simulationStatus[league]?.[matchId]?.findLeans?.simError ?? null;
}

// Export the reducer
export default simulationStatusSlice.reducer;
