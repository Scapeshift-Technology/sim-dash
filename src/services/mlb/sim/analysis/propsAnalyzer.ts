// import { PlayResult, MatchupLineups } from "@/types/mlb";
// import { PropsCountsMLB, FirstInningScoreCountsMLB, ScoringOrderCountsMLB } from "@/types/bettingResults";
// import { findAllPlayerStats, findPlayers } from "./playerStatsAnalyzer";

// // ---------- Main function ----------

// export function calculatePropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups): PropsCountsMLB {
//   return {
//     firstInning: calculateFirstInningScores(simPlays),
//     player: calculatePlayerPropsCounts(simPlays, matchup),
//     scoringOrder: calculateScoringOrderPropsCounts(simPlays)
//   };
// }

// // ---------- Helper functions ----------

// // ----- Scoring order -----

// function calculateScoringOrderPropsCounts(simPlays: PlayResult[][]): ScoringOrderCountsMLB {
//   const totalGames = simPlays.length;
//   const counts = {
//     away: { 
//       first: { success: 0, failure: 0, push: 0, total: totalGames }, 
//       last: { success: 0, failure: 0, push: 0, total: totalGames } 
//     },
//     home: { 
//       first: { success: 0, failure: 0, push: 0, total: totalGames }, 
//       last: { success: 0, failure: 0, push: 0, total: totalGames } 
//     }
//   };

//   for (const game of simPlays) {
//     const firstScoringTeam = findFirstScoringTeam(game);
//     const lastScoringTeam = findLastScoringTeam(game);

//     incrementTeamCount(counts, firstScoringTeam, 'first');
//     incrementTeamCount(counts, lastScoringTeam, 'last');
//   }

//   return counts;
// }

// function findFirstScoringTeam(game: PlayResult[]): 'away' | 'home' | null {
//   for (const play of game) {
//     if (play.runsOnPlay > 0) {
//       return play.topInning ? 'away' : 'home';
//     }
//   }
//   return null;
// }

// function findLastScoringTeam(game: PlayResult[]): 'away' | 'home' | null {
//   for (let i = game.length - 1; i >= 0; i--) {
//     const play = game[i];
//     if (play.runsOnPlay > 0) {
//       return play.topInning ? 'away' : 'home';
//     }
//   }
//   return null;
// }

// function incrementTeamCount(
//   counts: ScoringOrderCountsMLB,
//   team: 'away' | 'home' | null,
//   type: 'first' | 'last'
// ): void {
//   if (team === 'away') {
//     counts.away[type].success++;
//     counts.home[type].failure++;
//   } else if (team === 'home') {
//     counts.home[type].success++;
//     counts.away[type].failure++;
//   } else {
//     counts.away[type].failure++;
//     counts.home[type].failure++;
//   }
// }

// // ----- First Inning Scores -----

// function calculateFirstInningScores(simPlays: PlayResult[][]): FirstInningScoreCountsMLB {
//   let awaySuccess = 0;
//   let homeSuccess = 0;
//   let overallSuccess = 0;
//   const totalGames = simPlays.length;

//   for (const game of simPlays) {
//     let awayScored = false;
//     let homeScored = false;

//     // Look at plays in first inning
//     for (const play of game) {
//       if (play.inning > 1) break;
      
//       if (play.topInning && play.runsOnPlay > 0) {
//         awayScored = true;
//       } else if (!play.topInning && play.runsOnPlay > 0) {
//         homeScored = true;
//       }
//     }

//     if (awayScored) awaySuccess++;
//     if (homeScored) homeSuccess++;
//     if (awayScored || homeScored) overallSuccess++;
//   }

//   return {
//     away: {
//       success: awaySuccess,
//       failure: totalGames - awaySuccess,
//       total: totalGames
//     },
//     home: {
//       success: homeSuccess,
//       failure: totalGames - homeSuccess,
//       total: totalGames
//     },
//     overall: {
//       success: overallSuccess,
//       failure: totalGames - overallSuccess,
//       total: totalGames
//     }
//   };
// }

// // ----- Player props -----

// function calculatePlayerPropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups) {
//   // Find players
//   const players = findPlayers(matchup);

//   // For each player, find all stats
//   return findAllPlayerStats(simPlays, players);
// } 