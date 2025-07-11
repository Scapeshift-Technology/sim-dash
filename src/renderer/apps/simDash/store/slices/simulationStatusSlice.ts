import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { LeagueName } from "@@/types/league";
import { RootState } from "@/store/store";
import { MLBGameInputs2, SeriesGameInputs } from "@/types/simInputs";
import { runSeriesSimulation, runSimulation } from "@/simDash/pages/MLBMatchupView/functions/simulation";
import { findOptimalLeans } from "@/simDash/pages/MLBMatchupView/functions/optimalLeans";
import { MatchupLineups } from "@/preload";
import { MarketLinesMLB, MlbLiveDataApiResponse } from "@@/types/mlb";
import { SavedConfiguration } from "@@/types/statCaptureConfig";
import { BaseRunningModel, ParkEffectsResponse, UmpireEffectsResponse } from "@@/types/mlb/mlb-sim";

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
  numGames: number;
} & {
  [Key in LeagueName]?: {
    [matchId: number]: LeagueToStatusMap[Key & keyof LeagueToStatusMap];
  };
}

// ----- Initializers -----

const initialState: SimulationStatusState = {
  numGames: 90000
};

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
    baseRunningModel,
    numGames = 90000,
    liveGameData,
    activeConfig,
    parkEffects,
    umpireEffects
  }: {
    league: LeagueName;
    matchId: number;
    gameInputs: MLBGameInputs2;
    baseRunningModel: BaseRunningModel;
    numGames?: number;
    liveGameData?: MlbLiveDataApiResponse;
    activeConfig?: SavedConfiguration;
    parkEffects?: ParkEffectsResponse;
    umpireEffects?: UmpireEffectsResponse;
  }) => {
    const results = await runSimulation(gameInputs, numGames, baseRunningModel, liveGameData, activeConfig, parkEffects, umpireEffects);
    return results;
  }
);

export const runSeriesSimulationThunk = createAsyncThunk(
  'simulationStatus/runSeriesSimulation',
  async ({
    league, // These inputs are necessary for the thunk reducers
    matchId,
    gameInputs,
    baseRunningModel,
    numGames = 90000,
    activeConfig,
    parkEffects,
    umpireEffects
  }: {
    league: LeagueName;
    matchId: number;
    gameInputs: SeriesGameInputs;
    baseRunningModel: BaseRunningModel;
    numGames?: number;
    activeConfig?: SavedConfiguration;
    parkEffects?: ParkEffectsResponse;
    umpireEffects?: UmpireEffectsResponse;
  }) => {
    const results = await runSeriesSimulation(gameInputs, numGames, baseRunningModel, activeConfig, parkEffects, umpireEffects);
    return results;
  }
);

export const findLeansThunk = createAsyncThunk(
  'simulationStatus/findLeans',
  async ({
    league, // These inputs are necessary for the thunk reducers
    matchId,
    baseRunningModel,
    lineups,
    marketLines,
    parkEffects,
    umpireEffects
  }: {
    league: LeagueName;
    matchId: number;
    baseRunningModel: BaseRunningModel;
    lineups: MatchupLineups;
    marketLines: MarketLinesMLB;
    parkEffects?: ParkEffectsResponse;
    umpireEffects?: UmpireEffectsResponse;
  }) => {
    const results = await findOptimalLeans(lineups, marketLines, baseRunningModel, parkEffects, umpireEffects);
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
  reducers: {
    updateNumGames: (state, action: { payload: number }) => {
      state.numGames = action.payload;
    }
  },
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
  updateNumGames
} = simulationStatusSlice.actions;

// ---------- Selectors ----------

export const selectNumGames = (state: RootState) => {
  return state.simDash.simulationStatus.numGames;
};

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
