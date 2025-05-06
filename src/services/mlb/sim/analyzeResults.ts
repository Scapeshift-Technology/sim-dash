import { PlayResult } from "@/types/mlb";
import { 
  SimResultsMLB, 
  SidesCountsMLB, 
  OutcomeCounts,
  TeamSidesCountsMLB,
  PropsCountsMLB,
  FirstInningScoreCountsMLB,
  TotalsCountsMLB,
  GamePeriodTotalsMLB
} from "@/types/bettingResults";

// ---------- Main function ----------
function calculateSimCounts(simPlays: PlayResult[][]): SimResultsMLB {
  const sidesCounts: SidesCountsMLB = calculateSidesCounts(simPlays);
  const propsCounts: PropsCountsMLB = calculatePropsCounts(simPlays);
  const totalsCounts: TotalsCountsMLB = calculateTotalsCounts(simPlays);

  return {
    sides: sidesCounts,
    props: propsCounts,
    totals: totalsCounts
  };
}

export { calculateSimCounts };

// ---------- Helper functions ----------
// ----- Sides -----

interface GameTimeframe {
  endInning?: number;  // undefined means full game
  topInningEnd?: boolean;  // true means include top of inning
}

function calculateSidesCounts(simPlays: PlayResult[][]): SidesCountsMLB {
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
    ML: calculateSideProbability(simPlays, side, 0, timeframe),
    RunLineMinus1_5: calculateSideProbability(simPlays, side, -1.5, timeframe),
    RunLinePlus1_5: calculateSideProbability(simPlays, side, 1.5, timeframe)
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

function getScoreAtTimeframe(plays: PlayResult[], timeframe: GameTimeframe): { homeScore: number, awayScore: number } {
  if (!timeframe.endInning) {
    // Full game - use last play's score
    const lastPlay = plays[plays.length - 1];
    return {
      homeScore: lastPlay.homeScore + (!lastPlay.topInning ? lastPlay.runsOnPlay : 0),
      awayScore: lastPlay.awayScore + (lastPlay.topInning ? lastPlay.runsOnPlay : 0),
    };
  }

  // Find the last play before or at the specified inning
  for (let i = plays.length - 1; i >= 0; i--) {
    const play = plays[i];
    if (play.inning < timeframe.endInning || 
        (play.inning === timeframe.endInning && 
         (!timeframe.topInningEnd || !play.topInning))) {
      return {
        homeScore: play.homeScore + (!play.topInning ? play.runsOnPlay : 0),
        awayScore: play.awayScore + (play.topInning ? play.runsOnPlay : 0),
      };
    }
  }

  // Shouldn't get here if plays array is valid
  console.error('getScoreAtTimeframe: No play found at or before specified inning');
  return { homeScore: 0, awayScore: 0 };
}

// ----- Props -----

function calculatePropsCounts(simPlays: PlayResult[][]): PropsCountsMLB {
  return {
    firstInning: calculateFirstInningScores(simPlays)
  };
}

function calculateFirstInningScores(simPlays: PlayResult[][]): FirstInningScoreCountsMLB {
  let awaySuccess = 0;
  let homeSuccess = 0;
  let overallSuccess = 0;
  const totalGames = simPlays.length;

  for (const game of simPlays) {
    let awayScored = false;
    let homeScored = false;

    // Look at plays in first inning
    for (const play of game) {
      if (play.inning > 1) break;
      
      if (play.topInning && play.runsOnPlay > 0) {
        awayScored = true;
      } else if (!play.topInning && play.runsOnPlay > 0) {
        homeScored = true;
      }
    }

    if (awayScored) awaySuccess++;
    if (homeScored) homeSuccess++;
    if (awayScored || homeScored) overallSuccess++;
  }

  return {
    away: {
      success: awaySuccess,
      failure: totalGames - awaySuccess,
      total: totalGames
    },
    home: {
      success: homeSuccess,
      failure: totalGames - homeSuccess,
      total: totalGames
    },
    overall: {
      success: overallSuccess,
      failure: totalGames - overallSuccess,
      total: totalGames
    }
  };
}

// ----- Totals -----

function calculateTotalsCounts(simPlays: PlayResult[][]): TotalsCountsMLB {
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
      return [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5];
    }
  } else {
    if (period === 'fullGame') {
      return [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    } else {
      return [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    }
  }
}

function getScoreForType(
  plays: PlayResult[],
  type: 'combined' | 'home' | 'away',
  period: 'fullGame' | 'firstFive'
): number {
  const timeframe: GameTimeframe = period === 'fullGame' 
    ? {} 
    : { endInning: 5, topInningEnd: false };

  const { homeScore, awayScore } = getScoreAtTimeframe(plays, timeframe);

  switch (type) {
    case 'combined':
      return homeScore + awayScore;
    case 'home':
      return homeScore;
    case 'away':
      return awayScore;
  }
}

