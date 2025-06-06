import { PlayResult } from "@/types/mlb";
import { TotalsCountsMLB, GamePeriodTotalsMLB, OutcomeCounts } from "@/types/bettingResults";
import { SavedConfiguration, PeriodTypeCode, PeriodKey, MarketType, MainMarketConfig } from "@/types/statCaptureConfig";
import { getScoreForPeriod } from "./scoreTracker2";
import { getPeriodKey, periodKeyToCodeAndNumber } from "../../../statCaptureConfig/utils";

// ---------- Main function ----------

function calculateTotalsCounts(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): TotalsCountsMLB {
  const adjustedStatCaptureConfig = adjustStatCaptureConfig(simPlays, statCaptureConfig);

  return {
    combined: calculateSingleTypeTotals(simPlays, 'combined', adjustedStatCaptureConfig),
    home: calculateSingleTypeTotals(simPlays, 'home', adjustedStatCaptureConfig),
    away: calculateSingleTypeTotals(simPlays, 'away', adjustedStatCaptureConfig)
  };
}

export { calculateTotalsCounts }

// ---------- Helper functions ----------

function calculateSingleTypeTotals(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away',
  statCaptureConfig: SavedConfiguration
): GamePeriodTotalsMLB {

  let marketType: MarketType;
  if (type === 'combined') {
    marketType = 'Total';
  } else {
    marketType = 'TeamTotal';
  }

  const markets = statCaptureConfig.mainMarkets.filter(market => market.marketType === marketType);
  const periods = [...new Set(markets.map(market => {
    return getPeriodKey(market.periodTypeCode, market.periodNumber);
  }))];

  const results: GamePeriodTotalsMLB = {};

  for (const period of periods) {
    const lines = getLines2(markets, period);

    if (!results[period]) {
      results[period] = {
        over: {},
        under: {}
      };
    }

    results[period].over = calculateTotalLines(simPlays, type, period, 'over', lines);
    results[period].under = calculateTotalLines(simPlays, type, period, 'under', lines);
  }

  return results;
}

function calculateTotalLines(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away',
  period: PeriodKey,
  direction: 'over' | 'under',
  lines: number[]
): { [key: number]: OutcomeCounts } {
  const results: { [key: number]: OutcomeCounts } = {};
  const { periodTypeCode, periodNumber } = periodKeyToCodeAndNumber(period);

  for (const line of lines) {
    let success = 0;
    let failure = 0;
    let push = 0;
    const totalGames = simPlays.length;

    for (const game of simPlays) {
      const score = getScoreForType(game, type, periodTypeCode, periodNumber);
      
      if (direction === 'over') {
        if (score > line) success++;
        else if (score < line) failure++;
        else push++;
      } else {
        if (score < line) success++;
        else if (score > line) failure++;
        else push++;
      }
    }

    results[line] = {
      success,
      failure,
      push,
      total: totalGames
    };
  }

  return results;
}

function getLines(type: 'combined' | 'home' | 'away', period: 'fullGame' | 'firstFive'): number[] {
  if (type === 'combined') {
    if (period === 'fullGame') {
      return [6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
    } else {
      return [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];
    }
  } else {
    if (period === 'fullGame') {
      return [2.0, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7.5, 8, 8.5];
    } else {
      return [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    }
  }
} 

function getLines2(markets: MainMarketConfig[], targetPeriod: PeriodKey): number[] {
  const periodMarkets = markets.filter(market => {
    const marketPeriod = getPeriodKey(market.periodTypeCode, market.periodNumber);
    return marketPeriod === targetPeriod;
  });
  
  const marketLines = periodMarkets.map(market => {
    return parseFloat(market.strike);
  });

  return [...new Set(marketLines)].sort((a, b) => a - b);
}

function getScoreForType(
  game: PlayResult[],
  type: 'combined' | 'home' | 'away',
  periodTypeCode: PeriodTypeCode,
  periodNumber: number
): number {
  const { homeScore, awayScore } = getScoreForPeriod(game, periodTypeCode, periodNumber);
  
  switch (type) {
    case 'combined':
      return homeScore + awayScore;
    case 'home':
      return homeScore;
    case 'away':
      return awayScore;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

function adjustStatCaptureConfig(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): SavedConfiguration {
  const adjustedConfig = { ...statCaptureConfig };

  const meanRunsScored = getMeanRunsScore(simPlays);

  // Add closest full-game totals lines to mean runs scored
  const baseTotal = Math.round(meanRunsScored * 2) / 2;
  const totalsToAdd = [
    baseTotal - 1,
    baseTotal - 0.5,
    baseTotal,
    baseTotal + 0.5,
    baseTotal + 1
  ];
  
  totalsToAdd.forEach(total => { // Duplicated lines do not cause issues for now, but maybe keep an eye out if there are big changes made
    adjustedConfig.mainMarkets.push({
      marketType: 'Total',
      periodTypeCode: 'M',
      periodNumber: 0,
      strike: total.toString(),
    });
  });

  return adjustedConfig;
};

function getMeanRunsScore(simPlays: PlayResult[][]): number {
  // Find the last play of each game
  const lastPlays = simPlays.map(game => game[game.length - 1]);

  // Get the runs scored in the last play
  const runsScored = lastPlays.map(play => play.homeScore + play.awayScore + play.runsOnPlay);

  // Get the mean total scored
  const meanRunsScored = runsScored.reduce((acc, runs) => acc + runs, 0) / runsScored.length;

  return meanRunsScored;
}

