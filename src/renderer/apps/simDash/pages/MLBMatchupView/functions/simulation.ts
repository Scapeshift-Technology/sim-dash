import { applyMatchupLeansMLB } from "./leans";
import { calculateSeriesWinProbability } from "@@/services/mlb/sim/analysis/seriesAnalyzer";
import { MLBGameInputs2, SeriesGameInputs } from "@@/types/simInputs";
import { SimResultsMLB } from "@@/types/bettingResults";
import { MlbLiveDataApiResponse } from "@@/types/mlb";
import { SavedConfiguration } from "@/types/statCaptureConfig";
import { BaseRunningModel, ParkEffectsResponse, UmpireEffectsResponse } from "@@/types/mlb/mlb-sim";

// ---------- Main functions ----------

export async function runSimulation(
    gameInputs: MLBGameInputs2,
    numGames: number = 90000,
    baseRunningModel: BaseRunningModel,
    liveGameData?: MlbLiveDataApiResponse,
    activeConfig?: SavedConfiguration,
    parkEffects?: ParkEffectsResponse,
    umpireEffects?: UmpireEffectsResponse
): Promise<SimResultsMLB> {
    const config = activeConfig || await window.electronAPI.getActiveStatCaptureConfiguration('MLB');

    const redoneLineups = applyMatchupLeansMLB(gameInputs);
    
    const results = await window.electronAPI.simulateMatchupMLB({
        matchupLineups: redoneLineups,
        numGames: numGames,
        baseRunningModel: baseRunningModel,
        gameId: gameInputs.gameInfo.mlbGameId,
        statCaptureConfig: config,
        liveGameData: liveGameData,
        parkEffects: parkEffects,
        umpireEffects: umpireEffects
    });

    return results;
}

export async function runSeriesSimulation(
    gameInputs: SeriesGameInputs,
    numGames: number = 90000,
    baseRunningModel: BaseRunningModel,
    activeConfig?: SavedConfiguration,
    parkEffects?: ParkEffectsResponse,
    umpireEffects?: UmpireEffectsResponse
): Promise<SimResultsMLB> {
    const simResults: {[key: number]: SimResultsMLB} = {};
    
    // Only process first 3 games
    const seriesGames = Object.values(gameInputs)
      .filter(game => game.gameInfo.seriesGameNumber <= 3);
    
    for (const game of seriesGames) {
      const gameSimResults = await runSimulation(
        game, 
        numGames, 
        baseRunningModel,
        undefined, 
        activeConfig, 
        parkEffects, 
        game.gameInfo.seriesGameNumber === 1 ? umpireEffects : undefined
      );
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
