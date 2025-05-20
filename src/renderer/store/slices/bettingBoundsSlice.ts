import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LeagueName } from "@@/types/league";
import { RootState } from "../store";

// --------------------
// This slice contains data that is used to display the betting bounds of a matchup in the UI
// --------------------


// ---------- Types ----------

type Error = string | null;

// ----- By league -----

interface MarketLinesMLBDisplay { // Much like MarketlinesMLB from mlb.ts, but with strings instead(for use in text boxes)
  awayML: string;
  homeML: string;
  totalLine: string;
  overOdds: string;
  underOdds: string;
}

interface MarketLinesMLBDisplayErrors {
  awayML: Error;
  homeML: Error;
  totalLine: Error;
  overOdds: Error;
  underOdds: Error;
}

interface MLBBettingBounds {
  values: MarketLinesMLBDisplay;
  errors: MarketLinesMLBDisplayErrors;
}

// ----- Overall slice types -----

export type LeagueToBettingBoundsMap = {
  MLB: MLBBettingBounds;
  NBA: undefined;
  NFL: undefined;
  NHL: undefined;
}

export type BettingBoundsState = {
  MLB?: { [matchId: number]: MLBBettingBounds } | undefined;
  NBA?: undefined;
  NFL?: undefined;
  NHL?: undefined;
}

// ----- Initializers -----

const getInitialLeagueMatchState = (league: keyof LeagueToBettingBoundsMap) => {
  switch (league) {
    case 'MLB':
      return {
        values: {
          awayML: '',
          homeML: '',
          totalLine: '',
          overOdds: '',
          underOdds: ''
        },
        errors: {
          awayML: null,
          homeML: null,
          totalLine: null,
          overOdds: null,
          underOdds: null
        }
      };
    default:
      throw new Error(`Unsupported league: ${league}`);
  }
};

const initialState: BettingBoundsState = {};


// ---------- Slice ----------

const bettingBoundsSlice = createSlice({
  name: 'bettingBounds',
  initialState,
  reducers: {
    setBettingBounds: (state: BettingBoundsState, action: PayloadAction<{ league: keyof LeagueToBettingBoundsMap, matchId: number, bettingBounds: NonNullable<LeagueToBettingBoundsMap[typeof action.payload.league]> }>) => {
      if (!state[action.payload.league]) {
        (state as any)[action.payload.league] = {};
      }
      if (!state[action.payload.league]![action.payload.matchId]) {
        state[action.payload.league]![action.payload.matchId] = getInitialLeagueMatchState(action.payload.league);
      }
      state[action.payload.league]![action.payload.matchId] = action.payload.bettingBounds;
    }
  },
  extraReducers: (builder) => {}
})


// ---------- Actions ----------

export const { 
  setBettingBounds
} = bettingBoundsSlice.actions;

// ---------- Selectors ----------

export const selectBettingBoundsValues = (state: RootState, league: keyof LeagueToBettingBoundsMap, matchId: number) => {
  return state.bettingBounds[league]?.[matchId]?.values ?? null;
}
export const selectBettingBoundsErrors = (state: RootState, league: keyof LeagueToBettingBoundsMap, matchId: number) => {
  return state.bettingBounds[league]?.[matchId]?.errors ?? null;
}
  
// Export the reducer
export default bettingBoundsSlice.reducer;
