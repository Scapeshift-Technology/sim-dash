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
  const overPercent = countsToProbability(overCounts.success, overCounts.failure, overCounts.push || 0);
  const underPercent = countsToProbability(underCounts.success, underCounts.failure, underCounts.push || 0);
  const pushPercent = (overCounts.push || 0) / overCounts.total;
  const moe = marginOfError(overCounts.total - (overCounts.push || 0), overPercent);
  
  const usaFairOver = countsToAmericanOdds(overCounts.success, overCounts.failure, overCounts.push || 0);
  const usaFairUnder = countsToAmericanOdds(underCounts.success, underCounts.failure, underCounts.push || 0);
  
  const varianceProportionOver = Math.min(Math.max(overPercent - moe, 0), 1);
  const varianceProportionUnder = Math.min(Math.max(underPercent - moe, 0), 1);
  const varianceOddsOver = proportionToAmericanOdds(varianceProportionOver);
  const varianceOddsUnder = proportionToAmericanOdds(varianceProportionUnder);
  
  const lineNumber = parseFloat(line);
  const displayTeamName = teamName;
  
  const usaDemandPriceOver = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(overPercent, moe, roiDemandDecimal) : null;
  const usaDemandPriceUnder = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(underPercent, moe, roiDemandDecimal) : null;

  return {
    team: displayTeamName,
    period: period,
    line: lineNumber,
    overPercent: overPercent,
    underPercent: underPercent,
    pushPercent: pushPercent,
    marginOfError: moe,
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


