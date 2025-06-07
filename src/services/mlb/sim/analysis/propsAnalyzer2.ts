import { PlayResult, MatchupLineups } from "@/types/mlb";
import { SavedConfiguration } from "@/types/statCaptureConfig";
import { PropsCountsMLB, FirstInningScoreCountsMLB, ScoringOrderCountsMLB } from "@/types/bettingResults";

import { findAllPlayerStats, findPlayers } from "./playerStatsAnalyzer2";

// ---------- Main function ----------

export function calculatePropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups, statCaptureConfig: SavedConfiguration): PropsCountsMLB {
  const firstInningPropsCounts = calculateFirstInningScores(simPlays);
  const playerPropsCounts = calculatePlayerPropsCounts(simPlays, matchup, statCaptureConfig);
  const ynPropsResults = calculateYNProps(simPlays, statCaptureConfig);

  const results: PropsCountsMLB = {
    firstInning: firstInningPropsCounts,
    player: playerPropsCounts,
    ...ynPropsResults
  };

  return results;
}

// ---------- Helper functions ----------

// ----- Scoring order -----

function calculateScoringOrderPropsCounts(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): ScoringOrderCountsMLB {
  const totalGames = simPlays.length;
  const ynProps = statCaptureConfig.propsYN || [];
  
  const needsFirst = ynProps.some(prop => 
    prop.prop === 'FirstToScore' && prop.contestantType === 'TeamLeague'
  );
  const needsLast = ynProps.some(prop => 
    prop.prop === 'LastToScore' && prop.contestantType === 'TeamLeague'
  );

  if (!needsFirst && !needsLast) {
    return {
      away: {},
      home: {}
    };
  }

  // Initialize counts for only the needed props
  const counts: ScoringOrderCountsMLB = {
    away: {},
    home: {}
  };

  if (needsFirst) {
    counts.away.first = { success: 0, failure: 0, push: 0, total: totalGames };
    counts.home.first = { success: 0, failure: 0, push: 0, total: totalGames };
  }

  if (needsLast) {
    counts.away.last = { success: 0, failure: 0, push: 0, total: totalGames };
    counts.home.last = { success: 0, failure: 0, push: 0, total: totalGames };
  }

  for (const game of simPlays) {
    if (needsFirst) {
      const firstScoringTeam = findFirstScoringTeam(game);
      incrementTeamCount(counts, firstScoringTeam, 'first');
    }

    if (needsLast) {
      const lastScoringTeam = findLastScoringTeam(game);
      incrementTeamCount(counts, lastScoringTeam, 'last');
    }
  }
  
  return counts;
}

function findFirstScoringTeam(game: PlayResult[]): 'away' | 'home' | null {
  for (const play of game) {
    if (play.runsOnPlay > 0) {
      return play.topInning ? 'away' : 'home';
    }
  }
  return null;
}

function findLastScoringTeam(game: PlayResult[]): 'away' | 'home' | null {
  for (let i = game.length - 1; i >= 0; i--) {
    const play = game[i];
    if (play.runsOnPlay > 0) {
      return play.topInning ? 'away' : 'home';
    }
  }
  return null;
}

function incrementTeamCount(
  counts: ScoringOrderCountsMLB,
  team: 'away' | 'home' | null,
  type: 'first' | 'last'
): void {
  if (team === 'away') {
    if (counts.away[type]) counts.away[type].success++;
    if (counts.home[type]) counts.home[type].failure++;
  } else if (team === 'home') {
    if (counts.home[type]) counts.home[type].success++;
    if (counts.away[type]) counts.away[type].failure++;
  } else {
    if (counts.away[type]) counts.away[type].failure++;
    if (counts.home[type]) counts.home[type].failure++;
  }
}

// ----- First Inning Scores -----

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

// ----- Player props -----

function calculatePlayerPropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups, statCaptureConfig: SavedConfiguration) {
  // Find players
  const players = findPlayers(matchup);

  // For each player, find all stats
  return findAllPlayerStats(simPlays, players, statCaptureConfig);
}

// ---------- YN Props Calculator ----------

function calculateYNProps(simPlays: PlayResult[][], statCaptureConfig: SavedConfiguration): Partial<PropsCountsMLB> {
  const results: Partial<PropsCountsMLB> = {};
  
  // Check which YN props are configured
  const ynProps = statCaptureConfig.propsYN || [];
  
  // Determine which prop types are needed
  const needsScoringOrder = ynProps.some(prop => 
    (prop.prop === 'FirstToScore' || prop.prop === 'LastToScore') && 
    prop.contestantType === 'TeamLeague'
  );
  
  // Calculate scoring order props if needed
  if (needsScoringOrder) {
    results.scoringOrder = calculateScoringOrderPropsCounts(simPlays, statCaptureConfig);
  }
  
  // Future YN prop types can be added here! For now we just have the scoring order props tho

  return results;
} 
