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

  