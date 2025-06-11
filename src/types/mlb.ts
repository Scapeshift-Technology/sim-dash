// Define types related to MLB lineups and player stats

import { MLBGameSimInputs } from "./simInputs";

export type TeamType = 'away' | 'home';

// ---------- MLB game data types ----------

export interface SeriesInfoMLB {
  [key: number]: MLBGameData;
}

export type LineupsSource = 'MLB' | 'Swish' | 'Manual';

export interface GameMetadataMLB {
  seriesGameNumber?: number;
  lineupsSource?: LineupsSource;
  bettingBounds?: MarketLinesMLB;
  automatedLeans?: MLBGameSimInputs;
  mlbGameId?: number;
  gameTimestamp?: string;
  venueId?: number;
}

export interface MLBGameData { // Very similar to MLBGameInputs2(type in simInputs.ts), but with less info
  lineups: MatchupLineups;
  gameInfo: GameMetadataMLB;
}

export interface MLBGameDataResponse { // Very similar to MLBGameContainer(type in simInputs.ts), but with less info. Used when finding game data using MLB Api and swish.
  currentGame: MLBGameData;
  seriesGames?: SeriesInfoMLB;  // Optional series data for other games if current game is first game of series
}

// ---------- Barrel file types ----------
// ----- MLB Sim types -----
import {
  Handedness,
  MatchupLineups,
  Position,
  GameStatePitcher,
  GameStateMLB,
  PlayResult,
  LeagueAvgStats,
  EventType,
  Stats,
  PlayerStats,
  Player,
  TeamLineup,
  TeamBatterMatchupProbabilities,
  GameMatchupProbabilities
} from "./mlb/mlb-sim";

export {
  Position,
  GameStatePitcher,
  GameStateMLB,
  PlayResult,
  LeagueAvgStats,
  EventType,
  Stats,
  PlayerStats,
  Handedness,
  Player,
  TeamLineup,
  MatchupLineups,
  TeamBatterMatchupProbabilities,
  GameMatchupProbabilities
};

// ----- MLB API types -----
import {
  MlbGameApiPosition,
  MlbGameApiPerson,
  MlbGameApiBatSide,
  MlbGameApiPitchHand,
  MlbGameApiPlayer,
  MlbGameApiTeamData,
  MlbGameApiBoxscore,
  MlbGameApiTeam,
  MlbGameApiGameDataPlayer,
  MlbGameApiGameData,
  MlbGameApiResponse,
  MlbLiveDataApiResponse,
  MlbLiveDataApiTeamBoxscorePlayerStatsPitching,
  MlbLiveDataApiTeamBoxscoreData,
  MlbGameApiPlayResultEvent,
  MlbLiveDataApiLinescore,
  MlbScheduleApiTeam,
  MlbScheduleApiGame,
  MlbScheduleApiDate,
  MlbScheduleApiResponse,
  MlbRosterApiPlayer,
  MlbRosterApiStatus,
  MlbRosterApiResponse,
  MlbPeopleApiResponse
} from "./mlb/mlb-api";

export {
  MlbGameApiPosition,
  MlbGameApiPerson,
  MlbGameApiBatSide,
  MlbGameApiPitchHand,
  MlbGameApiPlayer,
  MlbGameApiTeamData,
  MlbGameApiBoxscore,
  MlbGameApiTeam,
  MlbGameApiGameDataPlayer,
  MlbGameApiGameData,
  MlbGameApiResponse,
  MlbLiveDataApiTeamBoxscorePlayerStatsPitching,
  MlbLiveDataApiTeamBoxscoreData,
  MlbLiveDataApiResponse,
  MlbGameApiPlayResultEvent,
  MlbLiveDataApiLinescore,
  MlbScheduleApiTeam,
  MlbScheduleApiGame,
  MlbScheduleApiDate,
  MlbScheduleApiResponse,
  MlbRosterApiPlayer,
  MlbRosterApiStatus,
  MlbRosterApiResponse,
  MlbPeopleApiResponse
}

// ---------- FanGraphs API types ----------
import {
  FgLeagueData,
  FgLeagueDataTotals,
  Percentages
} from "./mlb/fangraphs";

export {
  FgLeagueData,
  FgLeagueDataTotals,
  Percentages
};

// ---------- Leans Finder types ----------
import {
  MarketLineDifferenceMLB,
  MarketLinesMLB,
  IndividualTeamLeansMLB,
  OptimalLeansMLB
} from "./mlb/leans-finder";

export {
  MarketLineDifferenceMLB,
  MarketLinesMLB,
  IndividualTeamLeansMLB,
  OptimalLeansMLB
};

