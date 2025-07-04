import { TotalsLinesMLB, TotalsData, GamePeriodTotalsMLB, OutcomeCounts, TotalsCountsMLB } from "@@/types/bettingResults";
import { PeriodKey } from "@@/types/statCaptureConfig";

import { countsToProbability, countsToAmericanOdds, marginOfError, proportionToAmericanOdds } from "../oddsCalculations";
import { calculateROIDemandPrice } from "../roiCalculations";
import { 
  sortWithConfig, 
  teamOrderComparator, 
  periodOrderComparator, 
  lineComparator, 
  overPercentComparator,
  type SortConfig 
} from "./sorting";

import { periodKeyToDisplayPeriod } from "@@/services/statCaptureConfig/utils";

// ---------- Main function ----------

function analyzeTotalsCountsMLB(totalsCounts: TotalsCountsMLB, awayTeamName: string, homeTeamName: string, roiDemandDecimal?: number): TotalsData[] {
  const { combined, home, away } = totalsCounts;
  const combinedData = transformGamePeriodTotalsMLB(combined, 'Combined', roiDemandDecimal);
  const homeData = transformGamePeriodTotalsMLB(home, homeTeamName, roiDemandDecimal);
  const awayData = transformGamePeriodTotalsMLB(away, awayTeamName, roiDemandDecimal);

  return [...combinedData, ...homeData, ...awayData];
}

export { analyzeTotalsCountsMLB };

// ---------- Helper functions ----------

function transformGamePeriodTotalsMLB(gamePeriodTotals: GamePeriodTotalsMLB, teamName: string, roiDemandDecimal?: number): TotalsData[] {
  const allData: TotalsData[] = [];
  
  for (const periodKey in gamePeriodTotals) {
    const typedPeriodKey = periodKey as PeriodKey;
    const totalsLines = gamePeriodTotals[typedPeriodKey];
    const displayPeriod = periodKeyToDisplayPeriod(typedPeriodKey);
    const periodData = transformTotalsLinesMLB(totalsLines, teamName, displayPeriod, roiDemandDecimal);
    allData.push(...periodData);
  }
  
  return allData;
}
  
function transformTotalsLinesMLB(totalsLines: TotalsLinesMLB, teamName: string, period: string, roiDemandDecimal?: number): TotalsData[] {
  // Convert keys to numbers and sort them numerically
  const lines = Object.keys(totalsLines.over)
    .map(Number)
    .sort((a, b) => a - b);
  const data: TotalsData[] = [];

  for (const lineNumber of lines) {
    const lineData = transformTotalsOutcomeCountsMLB(
      totalsLines.over[lineNumber],
      totalsLines.under[lineNumber],
      teamName,
      period,
      lineNumber.toString(),
      roiDemandDecimal
    );
    data.push(lineData);
  }

  return data;
}

function transformTotalsOutcomeCountsMLB(
  overCounts: OutcomeCounts,
  underCounts: OutcomeCounts,
  teamName: string,
  period: string,
  line: string,
  roiDemandDecimal?: number
): TotalsData {
  const pushCt = overCounts.push || 0;
  
  // For display percentages: pushes count as losses (pushesFail = true)
  const overPercent = countsToProbability(overCounts.success, overCounts.failure, pushCt, true);
  const underPercent = countsToProbability(underCounts.success, underCounts.failure, pushCt, true);
  
  // For fair value calculations: pushes are refunds (pushesFail = false)
  const fairOverPercent = countsToProbability(overCounts.success, overCounts.failure, pushCt, false);
  const fairUnderPercent = countsToProbability(underCounts.success, underCounts.failure, pushCt, false);
  
  const pushPercent = pushCt / overCounts.total;
  
  // For margin of error: use total excluding pushes and the fair percentages (pushes as refunds)
  const moeOver = marginOfError(overCounts.total - pushCt, fairOverPercent);
  const moeUnder = marginOfError(underCounts.total - pushCt, fairUnderPercent);
  
  // For USA-Fair odds: pushes are refunds, not losses (pushesFail = false)
  const usaFairOver = countsToAmericanOdds(overCounts.success, overCounts.failure, pushCt, false);
  const usaFairUnder = countsToAmericanOdds(underCounts.success, underCounts.failure, pushCt, false);
  
  // For variance odds: use fair percentages with margin of error
  const varianceProportionOver = Math.min(Math.max(fairOverPercent - moeOver, 0), 1);
  const varianceProportionUnder = Math.min(Math.max(fairUnderPercent - moeUnder, 0), 1);
  const varianceOddsOver = proportionToAmericanOdds(varianceProportionOver);
  const varianceOddsUnder = proportionToAmericanOdds(varianceProportionUnder);
  
  const lineNumber = parseFloat(line);
  const displayTeamName = teamName;
  
  // For ROI demand price: use fair percentages and margin of error
  const usaDemandPriceOver = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(fairOverPercent, moeOver, roiDemandDecimal) : null;
  const usaDemandPriceUnder = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(fairUnderPercent, moeUnder, roiDemandDecimal) : null;

  return {
    team: displayTeamName,
    period: period,
    line: lineNumber,
    overPercent: overPercent,
    underPercent: underPercent,
    pushPercent: pushPercent,
    marginOfError: moeOver, // Use over MOE as representative
    usaFairOver: usaFairOver,
    usaFairUnder: usaFairUnder,
    varianceOddsOver: varianceOddsOver,
    varianceOddsUnder: varianceOddsUnder,
    usaDemandPriceOver: usaDemandPriceOver,
    usaDemandPriceUnder: usaDemandPriceUnder
  };
}

// ---------- Sort Configuration ----------

const totalsDataSortConfig: SortConfig<TotalsData> = [
  {
    key: 'team',
    direction: 'asc',
    compareFn: teamOrderComparator
  },
  {
    key: 'period',
    direction: 'asc', 
    compareFn: periodOrderComparator
  },
  {
    key: 'line',
    direction: 'asc',
    compareFn: lineComparator
  },
  {
    key: 'overPercent',
    direction: 'desc',
    compareFn: overPercentComparator
  }
];

export function sortTotalsData(data: TotalsData[], awayTeamName: string, homeTeamName: string): TotalsData[] {
  return sortWithConfig(data, totalsDataSortConfig, { awayTeamName, homeTeamName });
}


