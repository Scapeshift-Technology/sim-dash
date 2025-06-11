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

export type OfficialType = 'Home Plate' | 'First Base' | 'Second Base' | 'Third Base' | 'Left Field' | 'Right Field';

export interface MlbApiOfficial {
  official: {
    id: number;
    fullName: string;
  }
  officialType: OfficialType;
}
  
export interface MlbGameApiBoxscore {
  teams: {
    away: MlbGameApiTeamData;
    home: MlbGameApiTeamData;
  };
  officials?: MlbApiOfficial[];
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

// -- I'm not confident that the MlbLiveDataApi___ and MlbGameApi___ types shouldn't be one and the same. -- 

interface MlbLiveDataApiTeam {
  name: string;
}

interface MlbLiveDataApiGameData {
  teams: {
    away: MlbLiveDataApiTeam;
    home: MlbLiveDataApiTeam;
  }
  status: {
    abstractGameState: "Preview" | "Live" | "Final" | "Postponed" | "Delayed" | "Suspended" | "Cancelled";
    detailedState: "Warmup" | "Final" | "In Progress";
  }
  weather?: MlbApiWeather;
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
  pitchers: number[]; // List of player ids. All used pitchers are listed here for a team
  bullpen: number[]; // List of player ids. Updates in-game, so pitchers will be removed when used. 
  batters: number[]; // List of player ids. Has used batters + pitchers.
  battingOrder: number[]; // List of player ids. Updates in-game, so pinch hitters can be in here.
  bench: number[]; // List of player ids. Updates in-game, so pinch hitters will be removed.
}

interface MlbLiveDataApiBoxscore {
  teams: {
    away: MlbLiveDataApiTeamBoxscoreData;
    home: MlbLiveDataApiTeamBoxscoreData;
  }
  officials?: MlbApiOfficial[];
}

export interface MlbLiveDataApiResponse {  // Similar to MlbGameApiResponse, but different liveData
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

interface MlbGameApiPlayRunner {
  movement: {
    originBase: string | null; // '1B', '2B', '3B', null
  }
}

interface MlbGameApiPlayResult {
  eventType: MlbGameApiPlayResultEvent;
  rbi: number;
  awayScore: number;
  homeScore: number;
}

export type MlbGameApiPlayResultEvent = "single" | "double" | "triple" | "home_run" | "walk" | "hit_by_pitch" | 
  "strikeout" | "field_out" | 'force_out' | 'fielders_choice' | 'fielders_choice_out' | 'grounded_into_double_play' |
  'sac_fly' | 'double_play' | 'triple_play' | 'sac_fly_double_play' | 'field_error';

interface MlbGameApiPlayAbout {
  inning: number;
  halfInning: string;
  isTopInning: boolean;
  outs: number;
}

interface MlbGameApiPlayCount {
  outs: number;
  strikes: number;
  balls: number;
}

export interface MlbGameApiPlay {
  matchup: MlbGameApiMatchup;
  result: MlbGameApiPlayResult;
  about: MlbGameApiPlayAbout;
  count: MlbGameApiPlayCount;
  runners: MlbGameApiPlayRunner[];
}

interface MlbGameApiMatchup {
  pitcher: MlbLiveDataApiLinescorePlayer;
  batter: MlbLiveDataApiLinescorePlayer;
  postOnFirst?: MlbLiveDataApiLinescorePlayer;
  postOnSecond?: MlbLiveDataApiLinescorePlayer;
  postOnThird?: MlbLiveDataApiLinescorePlayer;
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
  onDeck: MlbLiveDataApiLinescorePlayer;
  first?: MlbLiveDataApiLinescorePlayer;
  second?: MlbLiveDataApiLinescorePlayer;
  third?: MlbLiveDataApiLinescorePlayer;

  pitcher: MlbLiveDataApiLinescorePlayer;
  battingOrder: number;
}

interface MlbLiveDataApiLinescoreDefense {
  pitcher: MlbLiveDataApiLinescorePlayer;
  battingOrder: number;
  onDeck?: MlbLiveDataApiLinescorePlayer;
}

interface MlbLiveDataApiLinescoreInningTeam {
  runs: number;
}

export interface MlbLiveDataApiLinescoreInning {
  num: number;
  home: MlbLiveDataApiLinescoreInningTeam;
  away: MlbLiveDataApiLinescoreInningTeam;
}

export interface MlbLiveDataApiLinescore {
  // Game state
  balls: number;
  strikes: number;
  outs: number;
  currentInning: number;
  currentInningOrdinal: string;
  inningHalf: string;
  innings: MlbLiveDataApiLinescoreInning[];
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
  gameDate: string; // Timestamp string
  gameNumber: number;
  gamesInSeries: number;
  teams: {
    away: MlbScheduleApiTeam;
    home: MlbScheduleApiTeam;
  };
  seriesGameNumber: number;
  venue: {
    id: number;
  }
  officials?: MlbApiOfficial[];
  weather?: MlbApiWeather;
}

export interface MlbApiWeather {
  condition: string;
  temp: string;
  wind: string;
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

  