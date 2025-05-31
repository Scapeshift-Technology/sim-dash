import { MLBGameInputs2, SeriesGameInputs } from "@@/types/simInputs";
import { applyMatchupLeansMLB } from "./leans";
import { SimResultsMLB } from "@@/types/bettingResults";
import { calculateSeriesWinProbability } from "@@/services/mlb/sim/analysis/seriesAnalyzer";
import { MlbLiveDataApiResponse } from "@@/types/mlb";

// ---------- Main functions ----------

export async function runSimulation(
    gameInputs: MLBGameInputs2,
    numGames: number = 90000,
    liveGameData?: MlbLiveDataApiResponse
): Promise<SimResultsMLB> {
    const redoneLineups = applyMatchupLeansMLB(gameInputs);
    console.log('redoneLineups', redoneLineups);
    
    const results = await window.electronAPI.simulateMatchupMLB({
        matchupLineups: redoneLineups,
        numGames: numGames,
        liveGameData: liveGameData
    });

    return results;
}

export async function runSeriesSimulation(
    gameInputs: SeriesGameInputs,
    numGames: number = 90000
): Promise<SimResultsMLB> {
    const simResults: {[key: number]: SimResultsMLB} = {};
    
    // Only process first 3 games
    const seriesGames = Object.values(gameInputs)
      .filter(game => game.gameInfo.seriesGameNumber <= 3);
    
    for (const game of seriesGames) {
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
