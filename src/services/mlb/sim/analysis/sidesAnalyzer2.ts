import { PlayResult } from "@/types/mlb";
import { 
    SidesCountsMLB, 
    TeamSidesCountsMLB, 
    OutcomeCounts
} from "@/types/bettingResults";
import { SavedConfiguration, PeriodTypeCode, PeriodKey } from "@/types/statCaptureConfig";
import { getScoreForPeriod } from "./scoreTracker2";
import { getPeriodCode } from "../../../statCaptureConfig/utils";

// ---------- Main function ----------

function calculateSidesCounts(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): SidesCountsMLB {
  return {
    home: calculateSingleSideCounts(simPlays, 'home', statCaptureConfig),
    away: calculateSingleSideCounts(simPlays, 'away', statCaptureConfig)
  };
}

export { calculateSidesCounts }

// ---------- Helper functions ----------

function calculateSingleSideCounts(simPlays: PlayResult[][], side: 'home' | 'away', statCaptureConfig: SavedConfiguration): TeamSidesCountsMLB {
  const sidesMarkets = statCaptureConfig.mainMarkets.filter(market => market.marketType === 'Spread');
  const dynamicResults: { [periodKey: string]: { [strike: string]: OutcomeCounts } } = {};
  
  for (const market of sidesMarkets) {
    const periodKey: PeriodKey = getPeriodCode(market.periodTypeCode, market.periodNumber);
    const strike = parseFloat(market.strike);
    
    if (!dynamicResults[periodKey]) {
      dynamicResults[periodKey] = {};
    }
    
    const result = calculateSideProbability(
      simPlays, 
      side, 
      strike, 
      market.periodTypeCode, 
      market.periodNumber
    );
    
    dynamicResults[periodKey][market.strike] = result;
  }
  
  return dynamicResults;
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
