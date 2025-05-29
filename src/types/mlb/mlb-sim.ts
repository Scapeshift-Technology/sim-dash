// ---------- MLB sim types ----------

export type SimType = 'game' | 'series' | 'live' | 'custom';

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

    // Ex: A starter who threw yesterday, a player already taken out of the game in a mid-game sim, etc.
    unavailableHitters: Player[]; // Hitters who are not in the lineup and will not be used in the sim.
    unavailablePitchers: Player[]; // Pitchers who are not in the lineup and will not be used in the sim.
    
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

