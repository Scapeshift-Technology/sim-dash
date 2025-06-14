import { SimResultsMLB } from "./bettingResults";
import { MLBGameSimInputs } from "./simInputs";
import { GameStatePitcher, LineupsSource, MarketLinesMLB } from "./mlb";

// ---------- Main type ----------
// This will be the type for the sim history entry that is saved to the database.

export interface SimHistoryEntry {
    matchId: number;
    timestamp: string;
    simResults: SimResultsMLB; // Sim results for whatever league. This will need to have each league's type.
    inputData: MLBGameSimInputData; // Input data for whatever league. This will need to have each league's type.
}

// ---------- Sub-types ----------

export interface MLBGameSimInputData { // Much like MLBGameInputs2 from ./simInputs.ts, but with data specific to what should be stored in the db
    lineups: ReducedMatchupLineups;
    simInputs: MLBGameSimInputs;
    gameInfo: SimMetadataMLB;
}

export interface SimMetadataMLB { // Much like GameMetadataMLB from ./mlb.ts, but with data specific to what should be stored in the db
    lineupsSource: LineupsSource;
    bettingBounds?: MarketLinesMLB;
    automatedLeans?: MLBGameSimInputs;
    gameTimestamp?: string;

    gameState?: ReducedGameStateMLB; // For games not starting from the beginning
}

// ----- Reduced types for storage in db -----

export interface ReducedGameStateMLB {
    inning: number;
    topInning: boolean;
    outs: number;
    baseRunners: (number | null)[];
    awayScore: number;
    homeScore: number;
  
    awayPitcher: GameStatePitcher;
    homePitcher: GameStatePitcher;
}

export interface ReducedMatchupLineups { // Like MatchupLineups from ./mlb.ts with less info
    home: ReducedTeamLineup
    away: ReducedTeamLineup
}

export interface ReducedTeamLineup { // Like TeamLineup from ./mlb.ts with less info
    lineup: ReducedPlayer[];
    startingPitcher: ReducedPlayer;
    bullpen: ReducedPlayer[];
    bench: ReducedPlayer[];

    unavailablePitchers: ReducedPlayer[];
    unavailableHitters: ReducedPlayer[];
}

export interface ReducedPlayer { // Like Player from ./mlb.ts with less info
    id: number
    name: string;
}

