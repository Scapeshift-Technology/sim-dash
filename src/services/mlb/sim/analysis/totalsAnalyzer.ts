import { PlayResult } from "@/types/mlb";
import { TotalsCountsMLB, GamePeriodTotalsMLB, OutcomeCounts } from "@/types/bettingResults";
import { getScoreForType } from "./scoreTracker";

export function calculateTotalsCounts(simPlays: PlayResult[][]): TotalsCountsMLB {
  return {
    combined: calculateGamePeriodTotals(simPlays, 'combined'),
    home: calculateGamePeriodTotals(simPlays, 'home'),
    away: calculateGamePeriodTotals(simPlays, 'away')
  };
}

function calculateGamePeriodTotals(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away'
): GamePeriodTotalsMLB {
  return {
    fullGame: {
      over: calculateTotalLines(simPlays, type, 'fullGame', 'over'),
      under: calculateTotalLines(simPlays, type, 'fullGame', 'under')
    },
    firstFive: {
      over: calculateTotalLines(simPlays, type, 'firstFive', 'over'),
      under: calculateTotalLines(simPlays, type, 'firstFive', 'under')
    }
  };
}

function calculateTotalLines(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away',
  period: 'fullGame' | 'firstFive',
  direction: 'over' | 'under'
): { [key: number]: OutcomeCounts } {
  const lines = getLines(type, period);
  const results: { [key: number]: OutcomeCounts } = {};

  for (const line of lines) {
    let success = 0;
    let failure = 0;
    let push = 0;
    const totalGames = simPlays.length;

    for (const game of simPlays) {
      const score = getScoreForType(game, type, period);
      
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