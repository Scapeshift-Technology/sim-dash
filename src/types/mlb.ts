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
}

export interface MLBGameData { // Very similar to MLBGameInputs2(type in simInputs.ts), but with less info
  lineups: MatchupLineups;
  gameInfo: GameMetadataMLB;
}

export interface MLBGameDataResponse { // Very similar to MLBGameContainer(type in simInputs.ts), but with less info. Used when finding game data using MLB Api and swish.
  currentGame: MLBGameData;
  seriesGames?: SeriesInfoMLB;  // Optional series data for other games if current game is first game of series
}

// ---------- MLB sim types ----------

export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP' | 'TBD';

export interface GameStatePitcher {
  id: number;
  battersFaced: number;
  recentResults: number[];
  position: Position;
  // avgBF: number;
}

export interface GameStateMLB {
  inning: number;
  topInning: boolean;
  outs: number;
  bases: boolean[];
  awayScore: number;
  homeScore: number;

  awayLineup: Player[];
  homeLineup: Player[];
  awayLineupPos: number;
  homeLineupPos: number;

  awayBullpen: Player[];
  homeBullpen: Player[];

  awayPitcher: GameStatePitcher;
  homePitcher: GameStatePitcher;
}

export interface PlayResult {
  batterID: number;
  pitcherID: number;
  eventType: EventType;
  runsOnPlay: number;
  inning: number;
  topInning: boolean;
  outs: number;
  outsOnPlay: number;
  awayScore: number;
  homeScore: number;
  basesBefore: boolean[];  // Represents base state before the play
  basesAfter: boolean[];   // Represents base state after the play
}

export interface LeagueAvgStats {
  RhitLpitch: Stats;
  RhitRpitch: Stats;
  LhitLpitch: Stats;
  LhitRpitch: Stats;
}

export type EventType = 'K' | 'BB' | '1B' | '2B' | '3B' | 'HR' | 'OUT';

export interface Stats {
  adj_perc_K: number;
  adj_perc_BB: number;
  adj_perc_1B: number;
  adj_perc_2B: number;
  adj_perc_3B: number;
  adj_perc_HR: number;
  adj_perc_OUT: number;
}

export interface PlayerStats {
  statsDate?: string; // Date that the stats came from in the DB
  hitVsL?: Stats; // Optional: A pitcher won't have hitting stats
  hitVsR?: Stats; // Optional: A pitcher won't have hitting stats
  pitchVsL?: Stats; // Optional: A batter won't have pitching stats
  pitchVsR?: Stats; // Optional: A batter won't have pitching stats
}

export type Handedness = 'L' | 'R' | 'S';

export interface Player {
    id: number; // Unique player identifier (e.g., MLBAM ID)
    name?: string;
    position?: string; // e.g., 'P', 'C', '1B', 'SS', 'LF', etc.
    battingOrder?: number; // For players in the lineup
    stats?: PlayerStats; // Include if stats are readily available
    battingSide?: Handedness; // 'L' or 'R'
    pitchingSide?: Handedness; // 'L' or 'R'
}

export interface TeamLineup {
    lineup: Player[]; // Players in batting order
    startingPitcher: Player;
    bullpen: Player[]; // Relief pitchers available
    bench: Player[]; // Position players sitting
    teamName: string;
}

export interface MatchupLineups {
    home: TeamLineup;
    away: TeamLineup;
}

export interface TeamBatterMatchupProbabilities {
  batter: {
    [batterId: number]: {
      [pitcherId: number]: Stats;
    };
  }
}

export interface GameMatchupProbabilities {
  home: TeamBatterMatchupProbabilities;
  away: TeamBatterMatchupProbabilities;
}

// ----- MLB Leans Finder Types -----
// -- Market lines types --

export interface MarketLineDifferenceMLB {
  mlAway: {
    simValue: number;
    upperBound: number;
    lowerBound: number;
  };
  total: {
    simValue: number;
    upperBound: number;
    lowerBound: number;
  };
}

interface TotalLinesMLB {
  line: number;
  odds: number;
}

export interface MarketLinesMLB {
  awayML: number;
  homeML: number;
  over: TotalLinesMLB;
  under: TotalLinesMLB;
}

// -- Leans types --

export interface IndividualTeamLeansMLB {
  hitter: number;
  pitcher: number;
}

interface AllTeamLeansMLB {
  away: IndividualTeamLeansMLB;
  home: IndividualTeamLeansMLB;
}

export interface OptimalLeansMLB {
  teams: AllTeamLeansMLB;
}

// ---------- MLB API types ----------
// Follow this naming convention: Mlb{Endpoint}Api{Thing it describes}

// ----- Game endpoint -----
export interface MlbGameApiPosition {
  abbreviation: string;
}

export interface MlbGameApiPerson {
  id: number;
  fullName: string;
  batSide: {
    code: Handedness;
  };
  pitchHand: {
    code: Handedness;
  };
}

export interface MlbGameApiBatSide {
  code: Handedness;
}

export interface MlbGameApiPitchHand {
  code: Handedness;
}
export interface MlbGameApiPlayer {
  person: MlbGameApiPerson;
  position: MlbGameApiPosition;
  battingOrder?: number;
  batSide: MlbGameApiBatSide;
  pitchHand: MlbGameApiPitchHand;
}

export interface MlbGameApiTeamData {
  players: { [key: string]: MlbGameApiPlayer };
}

export interface MlbGameApiBoxscore {
  teams: {
    away: MlbGameApiTeamData;
    home: MlbGameApiTeamData;
  };
}

export interface MlbGameApiTeam {
  id: number;
  name: string;
}

export interface MlbGameApiGameDataPlayer {
  id: number;
  fullName: string;
  batSide: MlbGameApiBatSide;
  pitchHand: MlbGameApiPitchHand;
}

export interface MlbGameApiGameData {
  teams: {
    away: MlbGameApiTeam;
    home: MlbGameApiTeam;
  };
  probablePitchers: {
    away: MlbGameApiPerson;
    home: MlbGameApiPerson;
  };
  players: {
    [key: string]: MlbGameApiGameDataPlayer;
  }
}

export interface MlbGameApiResponse {
  gameData: MlbGameApiGameData;
  liveData: {
    boxscore: MlbGameApiBoxscore;
    linescore: MlbGameApiLinescore;
    plays: MlbGameApiPlays;
  };
}

// -- Websocket/linescore types --

interface MlbGameApiPlays {
  currentPlay: MlbGameApiPlay;
}

interface MlbGameApiPlay {
  matchup: MlbGameApiMatchup;
}

interface MlbGameApiMatchup {
  pitcher: MlbGameApiLinescorePlayer;
  batter: MlbGameApiLinescorePlayer;
}

interface MlbGameApiLinescoreTeam {
  runs: number;
  hits: number;
  errors: number;
}

interface MlbGameApiLinescorePlayer {
  id: number;
  fullName: string;
}

interface MlbGameApiLinescoreOffense {
  batter: MlbGameApiLinescorePlayer;
  first?: MlbGameApiLinescorePlayer;
  second?: MlbGameApiLinescorePlayer;
  third?: MlbGameApiLinescorePlayer;
}

interface MlbGameApiLinescoreDefense {
  pitcher: MlbGameApiLinescorePlayer;
}

export interface MlbGameApiLinescore {
  // Game state
  balls: number;
  strikes: number;
  outs: number;
  currentInning: number;
  currentInningOrdinal: string;
  inningHalf: string;
  teams: {
    away: MlbGameApiLinescoreTeam;
    home: MlbGameApiLinescoreTeam;
  };

  // Base situation & current players
  offense: MlbGameApiLinescoreOffense;
  defense: MlbGameApiLinescoreDefense;
}

// ----- Schedule endpoint -----
export interface MlbScheduleApiTeam {
  team: {
    id: number;
    name: string;
  };
  seriesNumber: number;
  probablePitcher: {
    id: number;
  }
}

export interface MlbScheduleApiGame {
  gamePk: number;
  officialDate: string;
  gameDate: string;
  gameNumber: number;
  gamesInSeries: number;
  teams: {
    away: MlbScheduleApiTeam;
    home: MlbScheduleApiTeam;
  };
  seriesGameNumber: number;
}

export interface MlbScheduleApiDate {
  date: string;
  games: MlbScheduleApiGame[];
}

export interface MlbScheduleApiResponse {
  dates: MlbScheduleApiDate[];
}

// ----- Roster endpoint -----

export interface MlbRosterApiPlayer {
  person: MlbGameApiPerson;
  position: MlbGameApiPosition;
  status: MlbRosterApiStatus;
}

export interface MlbRosterApiStatus {
  code: 'D60' | 'D15' | 'A' | 'RM';
}

export interface MlbRosterApiResponse {
  roster: MlbRosterApiPlayer[];
}

// ----- People endpoint -----

export interface MlbPeopleApiResponse {
  people: Array<{
    id: number;
    fullName: string;
    batSide: {
      code: Handedness;
    };
    pitchHand: {
      code: Handedness;
    };
  }>;
}

// ---------- FanGraphs API types ----------

export interface FgLeagueData {
  totalsHome: FgLeagueDataTotals;
  totalsAway: FgLeagueDataTotals;
  totalsNeutral: FgLeagueDataTotals;
}

export interface FgLeagueDataTotals {
  AB: number;
  PA: number;
  '1B': number;
  '2B': number;
  '3B': number;
  HR: number;
  BB: number;
  HBP: number;
  SO: number;
  SH: number;
  H?: number;
}

export interface Percentages {
  [key: string]: number;
}

