import { TotalsLinesMLB, TotalsData, GamePeriodTotalsMLB, OutcomeCounts } from "@@/types/bettingResults";
import { countsToProbability, countsToAmericanOdds, marginOfError, proportionToAmericanOdds } from "../oddsCalculations";
import { periodKeyToDisplayPeriod } from "@@/services/statCaptureConfig/utils";
import { PeriodKey } from "@@/types/statCaptureConfig";

// ---------- Helper functions ----------

export function transformGamePeriodTotalsMLB(gamePeriodTotals: GamePeriodTotalsMLB, teamName: string): TotalsData[] {
  const allData: TotalsData[] = [];
  
  for (const periodKey in gamePeriodTotals) {
    const typedPeriodKey = periodKey as PeriodKey;
    const totalsLines = gamePeriodTotals[typedPeriodKey];
    const displayPeriod = periodKeyToDisplayPeriod(typedPeriodKey);
    const periodData = transformTotalsLinesMLB(totalsLines, teamName, displayPeriod);
    allData.push(...periodData);
  }
  
  return allData;
}
  
function transformTotalsLinesMLB(totalsLines: TotalsLinesMLB, teamName: string, period: string): TotalsData[] {
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
      lineNumber.toString()
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
  line: string
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
    varianceOddsUnder: varianceOddsUnder
  };
}
