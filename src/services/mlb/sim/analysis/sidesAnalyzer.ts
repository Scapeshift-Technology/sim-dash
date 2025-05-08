import { PlayResult } from "@/types/mlb";
import { SidesCountsMLB, TeamSidesCountsMLB, OutcomeCounts } from "@/types/bettingResults";
import { GameTimeframe, getScoreAtTimeframe } from "./scoreTracker";

export function calculateSidesCounts(simPlays: PlayResult[][]): SidesCountsMLB {
  return {
    home: calculateSingleSideCounts(simPlays, 'home'),
    away: calculateSingleSideCounts(simPlays, 'away')
  };
}

function calculateSingleSideCounts(simPlays: PlayResult[][], side: 'home' | 'away'): TeamSidesCountsMLB {
  return {
    fullGame: calculateTimeframeCounts(simPlays, side, {}),
    firstFive: calculateTimeframeCounts(simPlays, side, { endInning: 5, topInningEnd: false })
  };
}

function calculateTimeframeCounts(
  simPlays: PlayResult[][],
  side: 'home' | 'away',
  timeframe: GameTimeframe
) {
  return {
    '0': calculateSideProbability(simPlays, side, 0, timeframe),
    '-1.5': calculateSideProbability(simPlays, side, -1.5, timeframe),
    '1.5': calculateSideProbability(simPlays, side, 1.5, timeframe)
  };
}

function calculateSideProbability(
  simPlays: PlayResult[][],
  side: 'home' | 'away',
  line: number,
  timeframe: GameTimeframe
): OutcomeCounts {
  let success = 0;
  let failure = 0;
  let push = 0;
  const totalGames = simPlays.length;

  for (const game of simPlays) {
    const { homeScore, awayScore } = getScoreAtTimeframe(game, timeframe);
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