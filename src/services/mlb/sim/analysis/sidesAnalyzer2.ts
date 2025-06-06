import { PlayResult } from "@/types/mlb";
import {
    SidesCountsMLB,
    OutcomeCounts,
    TeamSidesCountsMLB
} from "@/types/bettingResults";
import { SavedConfiguration, PeriodTypeCode, PeriodKey } from "@/types/statCaptureConfig";
import { getScoreForPeriod } from "./scoreTracker2";
import { getPeriodKey } from "../../../statCaptureConfig/utils";

// ---------- Main function ----------

function calculateSidesCounts(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): SidesCountsMLB {
  const adjustedStatCaptureConfig = adjustStatCaptureConfig(statCaptureConfig);

  return {
    home: calculateSingleSideCounts(simPlays, 'home', adjustedStatCaptureConfig),
    away: calculateSingleSideCounts(simPlays, 'away', adjustedStatCaptureConfig)
  };
}

export { calculateSidesCounts }

// ---------- Helper functions ----------

function calculateSingleSideCounts(simPlays: PlayResult[][], side: 'home' | 'away', statCaptureConfig: SavedConfiguration): TeamSidesCountsMLB {
  const sidesMarkets = statCaptureConfig.mainMarkets.filter(market => market.marketType === 'Spread');
  const results: TeamSidesCountsMLB = {};
  
  for (const market of sidesMarkets) {
    // Initialize
    const originalStrike = parseFloat(market.strike);
    const periodKey: PeriodKey = getPeriodKey(market.periodTypeCode, market.periodNumber);
    
    if (!results[periodKey]) {
      results[periodKey] = {};
    }
    
    // Get lines 
    const positiveResult = calculateSideProbability(
      simPlays, 
      side, 
      originalStrike, 
      market.periodTypeCode, 
      market.periodNumber
    );
    results[periodKey][originalStrike.toString()] = positiveResult;
    
    if (originalStrike > 0) {
      const negativeResult = calculateSideProbability(
        simPlays, 
        side, 
        -originalStrike, 
        market.periodTypeCode, 
        market.periodNumber
      );
      results[periodKey][(-originalStrike).toString()] = negativeResult;
    }
  }
  
  return results;
}

function calculateSideProbability(
  simPlays: PlayResult[][],
  side: 'home' | 'away',
  line: number,
  periodTypeCode: PeriodTypeCode,
  periodNumber: number
): OutcomeCounts {
  let success = 0;
  let failure = 0;
  let push = 0;
  const totalGames = simPlays.length;

  for (const game of simPlays) {
    const { homeScore, awayScore } = getScoreForPeriod(game, periodTypeCode, periodNumber);
    const margin = side === 'home' ? awayScore - homeScore : homeScore - awayScore;
    
    if (margin < line) {
      success++;
    } else if (margin > line) {
      failure++;
    } else if (margin === line) {
      push++;
    }
  }

  return {
    success: success,
    failure: failure,
    push: push,
    total: totalGames
  };
} 

function adjustStatCaptureConfig(statCaptureConfig: SavedConfiguration): SavedConfiguration {
  const adjustedConfig = { ...statCaptureConfig };

  // If no moneyline market, add it
  if (!adjustedConfig.mainMarkets.find(market => (
    market.marketType === 'Spread' && market.periodTypeCode === 'M' && market.periodNumber === 0 && market.strike === '0'
  ))) {
    adjustedConfig.mainMarkets.push({
      marketType: 'Spread',
      periodTypeCode: 'M',
      periodNumber: 0,
      strike: '0'
    });
  }

  return adjustedConfig;
}

