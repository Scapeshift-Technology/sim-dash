// Define types related to MLB lineups and player stats

export type TeamType = 'away' | 'home';

// ---------- MLB sim types ----------

export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP';

export interface SimInputDataMLB {
  testField: string;
}

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
  hitVsL?: Stats; // Optional: A pitcher won't have hitting stats
  hitVsR?: Stats; // Optional: A pitcher won't have hitting stats
  pitchVsL?: Stats; // Optional: A batter won't have pitching stats
  pitchVsR?: Stats; // Optional: A batter won't have pitching stats
}

export type Handedness = 'L' | 'R' | 'B';

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
    // bench?: Player[]; // Future: players on the bench
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

// 
// export interface MLBGameScheduleInfo {
//   gameId: number;
//   gameDt: string;
//   homeTeam: string;
//   awayTeam: string;
//   seriesGameNumber: number;
//   gameNumber: number;
// }


// Wait until making the DB structure to implement this.


// ---------- MLB API types ----------
// Follow this naming convention: Mlb{Endpoint}Api{Thing it describes}

// ----- Game endpoint -----
export interface MlbGameApiPosition {
  abbreviation: string;
}

export interface MlbGameApiPerson {
  id: number;
  fullName: string;
}

export interface MlbGameApiPlayer {
  person: MlbGameApiPerson;
  position: MlbGameApiPosition;
  battingOrder?: number;
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

export interface MlbGameApiGameData {
  teams: {
    away: MlbGameApiTeam;
    home: MlbGameApiTeam;
  };
  probablePitchers: {
    away: MlbGameApiPerson;
    home: MlbGameApiPerson;
  };
}

export interface MlbGameApiResponse {
  gameData: MlbGameApiGameData;
  liveData: {
    boxscore: MlbGameApiBoxscore;
  };
}

// ----- Schedule endpoint -----
export interface MlbScheduleApiTeam {
  team: {
    name: string;
  };
}

export interface MlbScheduleApiGame {
  gamePk: number;
  gameDate: string;
  gameNumber: number;
  teams: {
    away: MlbScheduleApiTeam;
    home: MlbScheduleApiTeam;
  };
}

// ----- Roster endpoint -----

export interface MlbRosterApiResponse {
  roster: MlbGameApiPlayer[];
}

// ----- FanGraphs API types -----

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
