import { PeriodKey } from "@@/types/statCaptureConfig";
import { 
    SidesData, 
    OutcomeCounts, 
    TeamSidesCountsMLB,
    SidesPeriodCountsMLB,
    SidesCountsMLB
} from "@/types/bettingResults";

import { countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "../oddsCalculations";
import { calculateROIDemandPrice } from "../roiCalculations";
import { 
  sortWithConfig, 
  periodOrderComparator, 
  absoluteLineComparator, 
  lineComparator, 
  coverPercentComparator,
  type SortConfig 
} from "./sorting";

import { periodKeyToDisplayPeriod } from "@@/services/statCaptureConfig/utils";

// ---------- Helper functions ----------

export function analyzeSidesCountsMLB(sidesCounts: SidesCountsMLB, awayTeamName: string, homeTeamName: string, roiDemandDecimal?: number): SidesData[] {
  const { home, away } = sidesCounts;
  const homeData = transformTeamSidesCountsMLB(home, homeTeamName, roiDemandDecimal);
  const awayData = transformTeamSidesCountsMLB(away, awayTeamName, roiDemandDecimal);

  const allPositiveLines = getUniquePositiveLines(homeData, awayData);
  
  const finalData: SidesData[] = [];
  
  for (const line of allPositiveLines) {
    const homePositive = homeData.filter(d => d.line === line);
    const awayPositive = awayData.filter(d => d.line === line);
    
    for (const homeSide of homePositive) {
      const awaySide = awayPositive.find(a => a.period === homeSide.period);
      
      if (awaySide) {
        const isHomeFavorite = homeSide.coverPercent >= awaySide.coverPercent;
        
        if (isHomeFavorite) {
          const homeNegative = homeData.find(d => d.line === -line && d.period === homeSide.period);
          if (homeNegative) finalData.push(homeNegative);
          finalData.push(awaySide); // away keeps positive
        } else {
          const awayNegative = awayData.find(d => d.line === -line && d.period === awaySide.period);
          if (awayNegative) finalData.push(awayNegative);
          finalData.push(homeSide); // home keeps positive
        }
      }
    }
  }
  
  return sortSidesData(finalData);
}

function getUniquePositiveLines(homeData: SidesData[], awayData: SidesData[]): number[] {
  const lines = new Set<number>();
  
  homeData.forEach(d => {
    if (d.line >= 0) lines.add(d.line);
  });
  awayData.forEach(d => {
    if (d.line >= 0) lines.add(d.line);
  });
  
  return Array.from(lines).sort((a, b) => a - b);
}

export function transformTeamSidesCountsMLB(teamSidesCounts: TeamSidesCountsMLB, teamName: string, roiDemandDecimal?: number): SidesData[] {
  const data: SidesData[] = [];
    
  for (const periodKey of Object.keys(teamSidesCounts)) {
    const periodData = teamSidesCounts[periodKey];
    const displayPeriod = periodKeyToDisplayPeriod(periodKey as PeriodKey);
    
    const periodTransformed = transformSidesPeriodCountsMLB(periodData, teamName, displayPeriod, roiDemandDecimal);
    data.push(...periodTransformed);
  }
    
  return data;
}
  
function transformSidesPeriodCountsMLB(gamePeriodCounts: SidesPeriodCountsMLB, teamName: string, period: string, roiDemandDecimal?: number): SidesData[] {
  const lines = Object.keys(gamePeriodCounts);
  
  const data: SidesData[] = [];
  
  for (const line of lines) {
    const lineData = transformSidesOutcomeCountsMLB(gamePeriodCounts[line], teamName, period, line, roiDemandDecimal);
    data.push(lineData);
  }
  
  return data;
}
  
function transformSidesOutcomeCountsMLB(outcomeCounts: OutcomeCounts, teamName: string, period: string, line: string, roiDemandDecimal?: number): SidesData {
  const { success, failure, push, total } = outcomeCounts;
  const pushCt = push || 0;
  
  // For Cover%: pushes count as losses (pushesFail = true)
  const coverPercent = countsToProbability(success, failure, pushCt, true);
  
  // For fair value calculations: pushes are refunds (pushesFail = false)
  const fairWinPercent = countsToProbability(success, failure, pushCt, false);
  
  // Push% is just the percentage of pushes
  const pushPercent = pushCt / total;
  
  // For margin of error: use total excluding pushes and the fair win percent (pushes as refunds)
  const moe = marginOfError(total - pushCt, fairWinPercent);
  
  // For USA-Fair odds: pushes are refunds, not losses (pushesFail = false) 
  const usaOdds = countsToAmericanOdds(success, failure, pushCt, false);
  
  // For variance odds: use fair win percent with margin of error
  const varianceProportion = Math.min(Math.max(fairWinPercent - moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);
  const lineNumber = parseFloat(line);
  
  // For ROI demand price: use fair win percent and margin of error
  const usaDemandPrice = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(fairWinPercent, moe, roiDemandDecimal) : null;

  return {
    team: teamName,
    period: period,
    line: lineNumber,
    coverPercent: coverPercent,
    pushPercent: pushPercent,
    marginOfError: moe,
    usaFair: usaOdds,
    varianceOdds: varianceOdds,
    usaDemandPrice: usaDemandPrice
  }
}

// ----- Sorting -----


const sidesDataSortConfig: SortConfig<SidesData> = [
  {
    key: 'period',
    direction: 'asc',
    compareFn: periodOrderComparator
  },
  {
    key: 'line',
    direction: 'asc',
    compareFn: absoluteLineComparator
  },
  {
    key: 'line',
    direction: 'asc',
    compareFn: lineComparator // Favorite before underdog (negative before positive)
  },
  {
    key: 'coverPercent',
    direction: 'desc',
    compareFn: coverPercentComparator
  }
];

function sortSidesData(data: SidesData[]): SidesData[] {
  return sortWithConfig(data, sidesDataSortConfig);
}

export { sortSidesData };

  