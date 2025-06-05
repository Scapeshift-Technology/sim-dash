import { MLBGameInputs2, SeriesGameInputs } from "@@/types/simInputs";
import { applyMatchupLeansMLB } from "./leans";
import { SimResultsMLB } from "@@/types/bettingResults";
import { calculateSeriesWinProbability } from "@@/services/mlb/sim/analysis/seriesAnalyzer";
import { MlbLiveDataApiResponse } from "@@/types/mlb";
import { SavedConfiguration } from "@/types/statCaptureConfig";

// ---------- Main functions ----------

export async function runSimulation(
    gameInputs: MLBGameInputs2,
    numGames: number = 90000,
    liveGameData?: MlbLiveDataApiResponse,
    activeConfig?: SavedConfiguration
): Promise<SimResultsMLB> {
    const config = activeConfig || await window.electronAPI.getActiveStatCaptureConfiguration('MLB');

    const redoneLineups = applyMatchupLeansMLB(gameInputs);
    
    const results = await window.electronAPI.simulateMatchupMLB({
        matchupLineups: redoneLineups,
        numGames: numGames,
        gameId: gameInputs.gameInfo.mlbGameId,
        statCaptureConfig: config,
        liveGameData: liveGameData
    });

    return results;
}

export async function runSeriesSimulation(
    gameInputs: SeriesGameInputs,
    numGames: number = 90000,
    activeConfig?: SavedConfiguration
): Promise<SimResultsMLB> {
    const simResults: {[key: number]: SimResultsMLB} = {};
    
    // Only process first 3 games
    const seriesGames = Object.values(gameInputs)
      .filter(game => game.gameInfo.seriesGameNumber <= 3);
    
    for (const game of seriesGames) {
      const gameSimResults = await runSimulation(game, numGames, undefined, activeConfig);
      simResults[game.gameInfo.seriesGameNumber] = gameSimResults;
    }

    // Calculate series probabilities
    const seriesProbs = calculateSeriesWinProbability(simResults);

    const calculatedResults: SimResultsMLB = {
      ...simResults[1],
      series: seriesProbs
    };

    // Return
    return calculatedResults;
}
