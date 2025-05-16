import type { MatchupLineups } from './mlb';
import type { LeagueName } from './league';

// ---------- Types ----------

export type GameInputs = MLBGameInputs; // Add other leagues later

export type SimInputsState = {
  [key in LeagueName]?: {
    [matchId: number]: GameInputs;
  };
}

// ---------- MLB ----------

export interface MLBSimInputsTeam {
  teamHitterLean: number // -0.1 to 0.1
  teamPitcherLean: number // -0.1 to 0.1
  individualHitterLeans: Record<number, number> // playerId to lean
  individualPitcherLeans: Record<number, number> // playerId to lean
}

export interface MLBSimInputs {
  away: MLBSimInputsTeam;
  home: MLBSimInputsTeam;
}

export interface MLBLineups {
  data: MatchupLineups | null;
  lineupsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  lineupsError: string | null;
  statsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  statsError: string | null;
}

export interface MLBGameInputs {
  lineups: MLBLineups;
  inputs: MLBSimInputs;
}


