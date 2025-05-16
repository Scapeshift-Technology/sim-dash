import { MLBGameInputs2, SeriesGameInputs } from "@@/types/simInputs";
import { applyMatchupLeansMLB } from "./leans";
import { SimResultsMLB } from "@@/types/bettingResults";
import { calculateSeriesWinProbability } from "@@/services/mlb/sim/analysis/seriesAnalyzer";
// ---------- Main functions ----------

export async function runSimulation(
    gameInputs: MLBGameInputs2,
    numGames: number = 50000
): Promise<SimResultsMLB> {
    const redoneLineups = applyMatchupLeansMLB(gameInputs);

    const results = await window.electronAPI.simulateMatchupMLB({
        matchupLineups: redoneLineups,
        numGames: numGames
    });

    return results;
}

export async function runSeriesSimulation(
    gameInputs: SeriesGameInputs,
    numGames: number = 50000
): Promise<SimResultsMLB> {
    console.log('Running series simulation');
    const simResults: {[key: number]: SimResultsMLB} = {};
    for (const game of Object.values(gameInputs)) {
        console.log('Running game simulation', game.gameInfo.seriesGameNumber);
      const gameSimResults = await runSimulation(game, numGames);
      simResults[game.gameInfo.seriesGameNumber] = gameSimResults;
    }

    // Calculate series probabilities
    const seriesProbs = calculateSeriesWinProbability(simResults);

    const calculatedResults: SimResultsMLB = {
      ...simResults[1],
      series: seriesProbs
    };
    console.log('Probabilities', calculatedResults);

    // Return
    return calculatedResults;
}
