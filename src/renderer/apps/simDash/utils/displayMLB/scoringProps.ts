import { 
    ScoringOrderCountsMLB, 
    ScoringOrderPropsData, 
    OutcomeCounts 
} from "@/types/bettingResults";

import { teamNameToAbbreviationMLB } from "@@/services/mlb/utils/teamName";

import { countsToProbability, marginOfError, proportionToAmericanOdds } from "../oddsCalculations";
import { 
  sortWithConfig, 
  propTypeOrderComparator, 
  percentComparator,
  type SortConfig 
} from "./sorting";

// ---------- Main function ----------

export function analyzeScoringOrderCountsMLB(scoringOrderCounts: ScoringOrderCountsMLB, awayTeamName: string, homeTeamName: string): ScoringOrderPropsData[] {
    const results: ScoringOrderPropsData[] = [];
    
    results.push(...processTeamScoringOrderData(scoringOrderCounts.away, awayTeamName));
    results.push(...processTeamScoringOrderData(scoringOrderCounts.home, homeTeamName));
    
    return sortScoringOrderPropsData(results);
}

// ---------- Helper functions ----------

function processTeamScoringOrderData(teamData: { first?: OutcomeCounts; last?: OutcomeCounts }, teamName: string): ScoringOrderPropsData[] {
    const results: ScoringOrderPropsData[] = [];
    
    if (teamData.first) {
        results.push(transformScoringOrderTeamCountsMLB(teamData.first, teamName, 'first'));
    }
    
    if (teamData.last) {
        results.push(transformScoringOrderTeamCountsMLB(teamData.last, teamName, 'last'));
    }
    
    return results;
}

function transformScoringOrderTeamCountsMLB(outcomeCounts: OutcomeCounts, teamName: string, propType: 'first' | 'last'): ScoringOrderPropsData {
    const { success, failure, push, total } = outcomeCounts;
    
    const teamAbbrev = teamNameToAbbreviationMLB(teamName);
    
    const pushCt = push || 0;
    const percent = countsToProbability(success, failure, pushCt);
    const moe = marginOfError(total - pushCt, percent);
    const usaFair = proportionToAmericanOdds(percent);
    const varianceProportion = Math.min(Math.max(percent - moe, 0), 1);
    const varianceOdds = proportionToAmericanOdds(varianceProportion);
    
    return {
        team: teamAbbrev,
        propType: propType,
        percent: percent,
        marginOfError: moe,
        usaFair: usaFair,
        varianceOdds: varianceOdds
    };
}

// ---------- Sorting ----------

// ---------- Sort Configuration ----------

const scoringOrderPropsSortConfig: SortConfig<ScoringOrderPropsData> = [
    {
      key: 'propType',
      direction: 'asc',
      compareFn: propTypeOrderComparator
    },
    {
      key: 'percent',
      direction: 'desc',
      compareFn: percentComparator
    }
  ];

function sortScoringOrderPropsData(data: ScoringOrderPropsData[]): ScoringOrderPropsData[] {
    return sortWithConfig(data, scoringOrderPropsSortConfig);
}

export { sortScoringOrderPropsData };
