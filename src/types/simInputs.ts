import type { MatchupLineups, GameMetadataMLB, GameStateMLB } from './mlb';
import type { SimType } from './mlb/mlb-sim';
import type { LeagueName } from './league';

// ---------- Types ----------

export type GameContainers = MLBGameContainer; // Add other leagues later

export type SimInputsState = {
  [key in LeagueName]?: {
    [matchId: number]: GameContainers;
  };
}

// ---------- MLB ----------

export interface MLBGameCustomModeData {
  gameState: GameStateMLB;
  lineups: MatchupLineups;
}

export interface MLBGameSimInputsTeam {
  // --- Leans ---
  teamHitterLean: number // -0.1 to 0.1
  teamPitcherLean: number // -0.1 to 0.1
  individualHitterLeans: Record<number, number> // playerId to lean
  individualPitcherLeans: Record<number, number> // playerId to lean
}

export interface MLBGameSimInputs {
  away: MLBGameSimInputsTeam;
  home: MLBGameSimInputsTeam;
}

export interface SeriesGameInputs { // Very similar to SeriesInfoMLB(type in mlb.ts), but with extra info
  [gameNumber: number]: MLBGameInputs2;
}

export interface MLBGameInputs2 { // Very similar to MLBGameData(type in mlb.ts), but with extra info. Also like MLBGameSimInputData(type in simHistory.ts)
  lineups: MatchupLineups;
  simInputs: MLBGameSimInputs;
  gameInfo: GameMetadataMLB;
} 

export interface MLBGameContainer { // Very similar to MLBGameDataResponse(type in mlb.ts), but with extra info. Used as redux store type for single game.
  currentGame: MLBGameInputs2 | null;
  seriesGames?: SeriesGameInputs;

  // Thunk info
  gameDataStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  gameDataError: string | null;
  statsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  statsError: string | null;

  // Sim mode
  simMode: SimType

  // Custom game info
  customModeData?: MLBGameCustomModeData
}

