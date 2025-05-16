import { SimResultsMLB } from "./bettingResults";
import { MLBGameSimInputs } from "./simInputs";

export interface SimHistoryEntry {
    matchId: number;
    timestamp: string;
    simResults: SimResultsMLB; // Sim results for whatever league. This will need to have each league's type.
    inputData: MLBGameSimInputs; // Input data for whatever league. This will need to have each league's type.
}
