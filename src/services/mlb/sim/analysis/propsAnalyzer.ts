import { PlayResult, MatchupLineups } from "@/types/mlb";
import { PropsCountsMLB, FirstInningScoreCountsMLB } from "@/types/bettingResults";
import { findAllPlayerStats, findPlayers } from "./playerStatsAnalyzer";

export function calculatePropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups): PropsCountsMLB {
  return {
    firstInning: calculateFirstInningScores(simPlays),
    player: calculatePlayerPropsCounts(simPlays, matchup)
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

function calculatePlayerPropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups) {
  // Find players
  const players = findPlayers(matchup);

  // For each player, find all stats
  return findAllPlayerStats(simPlays, players);
} 