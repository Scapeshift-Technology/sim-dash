import { SimResultsMLB } from "./bettingResults";
import { MLBSimInputs } from "./simInputs";

export interface SimHistoryEntry {
    matchId: number;
    timestamp: string;
    simResults: SimResultsMLB; // Sim results for whatever league. This will need to have each league's type.
    inputData: MLBSimInputs; // Input data for whatever league. This will need to have each league's type.
}
