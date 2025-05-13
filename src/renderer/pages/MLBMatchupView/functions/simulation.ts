import { MLBGameInputs } from "@@/types/simInputs";
import { applyMatchupLeansMLB } from "./leans";
import { SimResultsMLB } from "@@/types/bettingResults";

// ---------- Main function ----------

export async function runSimulation(
    gameInputs: MLBGameInputs,
    numGames: number = 50000
): Promise<SimResultsMLB> {
    const redoneLineups = applyMatchupLeansMLB({
        lineups: gameInputs.lineups,
        inputs: gameInputs.inputs
    });

    const results = await window.electronAPI.simulateMatchupMLB({
        matchupLineups: redoneLineups,
        numGames: numGames
    });

    return results;
}
