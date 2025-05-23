// ---------- MLB API types ----------
// Follow this naming convention: Mlb{Endpoint}Api{Thing it describes}

import { Handedness } from "./mlb-sim";

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
    plays: MlbGameApiPlays;
  };
}
  
// -- Websocket/linescore types --

interface MlbLiveDataApiTeam {
  name: string;
}

interface MlbLiveDataApiGameData {
  teams: {
    away: MlbLiveDataApiTeam;
    home: MlbLiveDataApiTeam;
  }
};

interface MlbLiveDataApiTeamBoxscorePlayerGameStatus {
  isOnBench: boolean;
  isSubstitute: boolean;
}

interface MlbLiveDataApiTeamBoxscorePlayerStats {
  pitching: MlbLiveDataApiTeamBoxscorePlayerStatsPitching;
}

export interface MlbLiveDataApiTeamBoxscorePlayerStatsPitching {
  battersFaced: number;
  gamesStarted: number;
}

interface MlbLiveDataApiTeamBoxscorePlayer {
  person: MlbGameApiPerson;
  battingOrder?: number;
  gameStatus: MlbLiveDataApiTeamBoxscorePlayerGameStatus;
  stats: MlbLiveDataApiTeamBoxscorePlayerStats;
}

export interface MlbLiveDataApiTeamBoxscoreData {
  players: {
    [key: `ID${number}`]: MlbLiveDataApiTeamBoxscorePlayer;
  }
  bullpen: number[]; // List of player ids. Updates in-game, so pitchers will be removed when used. 
  battingOrder: number[]; // List of player ids. Updates in-game, so pinch hitters can be in here.
  bench: number[]; // List of player ids. Updates in-game, so pinch hitters will be removed.
}

interface MlbLiveDataApiBoxscore {
  teams: {
    away: MlbLiveDataApiTeamBoxscoreData;
    home: MlbLiveDataApiTeamBoxscoreData;
  }
}

export interface MlbLiveDataApiResponse {
  gameData: MlbLiveDataApiGameData;
  liveData: {
    boxscore: MlbLiveDataApiBoxscore;
    linescore: MlbLiveDataApiLinescore;
    plays: MlbGameApiPlays;
  };
}
  
interface MlbGameApiPlays {
  currentPlay: MlbGameApiPlay;
  allPlays: MlbGameApiPlay[];
}

interface MlbGameApiPlayResult {
  eventType: MlbGameApiPlayResultEvent;
}

export type MlbGameApiPlayResultEvent = "single" | "double" | "triple" | "home_run" | "walk" | "hit_by_pitch" | 
  "strikeout" | "field_out" | 'force_out' | 'fielders_choice' | 'fielders_choice_out' | 'grounded_into_double_play' |
  'sac_fly' | 'double_play' | 'triple_play' | 'sac_fly_double_play' | 'field_error';

interface MlbGameApiPlay {
  matchup: MlbGameApiMatchup;
  result: MlbGameApiPlayResult;
}

interface MlbGameApiMatchup {
  pitcher: MlbLiveDataApiLinescorePlayer;
  batter: MlbLiveDataApiLinescorePlayer;
}

interface MlbLiveDataApiLinescoreTeam {
  runs: number;
  hits: number;
  errors: number;
}

interface MlbLiveDataApiLinescorePlayer {
  id: number;
  fullName: string;
}
  
interface MlbLiveDataApiLinescoreOffense {
  batter: MlbLiveDataApiLinescorePlayer;
  first?: MlbLiveDataApiLinescorePlayer;
  second?: MlbLiveDataApiLinescorePlayer;
  third?: MlbLiveDataApiLinescorePlayer;

  pitcher: MlbLiveDataApiLinescorePlayer;
}

interface MlbLiveDataApiLinescoreDefense {
  pitcher: MlbLiveDataApiLinescorePlayer;
}

export interface MlbLiveDataApiLinescore {
  // Game state
  balls: number;
  strikes: number;
  outs: number;
  currentInning: number;
  currentInningOrdinal: string;
  inningHalf: string;
  teams: {
    away: MlbLiveDataApiLinescoreTeam;
    home: MlbLiveDataApiLinescoreTeam;
  };
  
  // Base situation & current players
  offense: MlbLiveDataApiLinescoreOffense;
  defense: MlbLiveDataApiLinescoreDefense;
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

  