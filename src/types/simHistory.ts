import { SimResultsMLB } from "./bettingResults";
import { SimInputDataMLB } from "./mlb";

export interface SimHistoryEntry {
    matchId: number;
    timestamp: string;
    simResults: SimResultsMLB; // Sim results for whatever league. This will need to have each league's type.
    inputData: SimInputDataMLB; // Input data for whatever league. This will need to have each league's type.
}
