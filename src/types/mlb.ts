// Define types related to MLB lineups and player stats

export type TeamType = 'away' | 'home';

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

export interface Player {
    id: number; // Unique player identifier (e.g., MLBAM ID)
    name?: string;
    position?: string; // e.g., 'P', 'C', '1B', 'SS', 'LF', etc.
    battingOrder?: number; // For players in the lineup
    stats?: PlayerStats; // Include if stats are readily available
}

export interface TeamLineup {
    lineup: Player[]; // Players in batting order
    startingPitcher: Player;
    bullpen: Player[]; // Relief pitchers available
    // bench?: Player[]; // Future: players on the bench
}

export interface MatchupLineups {
    home: TeamLineup;
    away: TeamLineup;
} 

export interface MLBMatchupViewProps {
    league: string;
    date: string;
    participant1: string; // Away Team
    participant2: string; // Home Team
    daySequence?: number;
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
