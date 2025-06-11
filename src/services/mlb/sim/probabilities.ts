import { 
  MatchupLineups, 
  LeagueAvgStats, 
  GameMatchupProbabilities, 
  TeamType, 
  TeamLineup,
  Handedness,
  PlayerStats,
  Player,
  Stats,
  TeamBatterMatchupProbabilities
} from "@/types/mlb";
import { getHomeFieldMultipliers } from "./homeFieldAdvantage";
import { ParkEffectsResponse, StatsMultiplier } from "@/types/mlb/mlb-sim";
import log from "electron-log";

// ---------- Main matchup probability function ----------
/**
 * Get the probabilities of a given batter-pitcher matchup in a given game(matchup)
 * @param matchup - The game data for the given matchup
 * @param leagueAvgStats - The league average stats
 * @returns The probabilities of the matchup
 */
function getMatchupProbabilities(matchup: MatchupLineups, leagueAvgStats: LeagueAvgStats, parkEffects?: ParkEffectsResponse): GameMatchupProbabilities {
  // Calculate for each team
  const homeTeamProbabilities = getTeamMatchupProbabilities(matchup.home, matchup.away, leagueAvgStats, 'home', parkEffects);
  const awayTeamProbabilities = getTeamMatchupProbabilities(matchup.away, matchup.home, leagueAvgStats, 'away', parkEffects);

  return {
    home: homeTeamProbabilities,
    away: awayTeamProbabilities
  };
}

export { getMatchupProbabilities };

// ---------- Helper functions ----------
function getTeamMatchupProbabilities(teamLineup: TeamLineup, opponentLineup: TeamLineup, leagueAvgStats: LeagueAvgStats, teamType: TeamType, parkEffects?: ParkEffectsResponse): TeamBatterMatchupProbabilities {
  const teamBatterMatchupProbabilities: TeamBatterMatchupProbabilities = {
    batter: {}
  };

  // Calculate for each batter-pitcher matchup
  const allBatters = [...teamLineup.lineup, ...teamLineup.bench, ...teamLineup.unavailableHitters];
  const allPitchers = [opponentLineup.startingPitcher, ...opponentLineup.bullpen, ...opponentLineup.unavailablePitchers];

  // Adjust stats
  const adjustedLeagueAvgStats = adjustLeagueAvgStats(leagueAvgStats, parkEffects);
  const adjustedBatters = adjustBatters(allBatters, parkEffects);
  const adjustedPitchers = adjustPitchers(allPitchers, parkEffects);  
  
  for (const batter of adjustedBatters) {
    teamBatterMatchupProbabilities.batter[batter.id] = {};
    for (const pitcher of adjustedPitchers) {
      const matchupProbabilities = getBatterPitcherMatchupProbabilities(batter, pitcher, adjustedLeagueAvgStats, teamType);
      teamBatterMatchupProbabilities.batter[batter.id][pitcher.id] = matchupProbabilities;
    }
  }

  return teamBatterMatchupProbabilities;
}

/**
 * Get the probabilities of events fora given batter-pitcher matchup
 * @param batter - The batter
 * @param pitcher - The pitcher
 * @param leagueAvgStats - The league average stats
 * @returns The probabilities of the matchup
 */
function getBatterPitcherMatchupProbabilities(batter: Player, pitcher: Player, leagueAvgStats: LeagueAvgStats, batterTeamType: TeamType): Stats {
  // Determine which stats to use based on matchup
  const matchupHandedness = determineMatchupHandedness(batter, pitcher);

  // Get corresponding stats
  const leagueAvgMatchupString = handednessToLeagueAvgString(matchupHandedness.battingSide, matchupHandedness.pitchingSide);
  const leagueAvgProbability = leagueAvgStats[leagueAvgMatchupString];
  const batterStatsKey = handednessToPlayerStatsString(matchupHandedness.pitchingSide, 'hit')
  const batterStats = batter.stats?.[batterStatsKey] as Stats;
  const pitcherStatsKey = handednessToPlayerStatsString(matchupHandedness.battingSide, 'pitch')
  const pitcherStats = pitcher.stats?.[pitcherStatsKey] as Stats;

  // console.log(`Batter stats: ${JSON.stringify(batterStats, null, 2)}`);
  // console.log(`Pitcher stats: ${JSON.stringify(pitcherStats, null, 2)}`);
  // console.log(`League avg probability: ${JSON.stringify(leagueAvgProbability, null, 2)}`);

  if (!batterStats || !pitcherStats || !leagueAvgProbability) {
    throw new Error('Missing required stats for matchup calculation');
  }
  
  // Plug into the formula
  const outcomeProbs = calculateAndNormalizeLog5(batterStats, pitcherStats, leagueAvgProbability);

  // Apply home field advantage
  const { homeMultipliers, awayMultipliers } = getHomeFieldMultipliers();

  if (batterTeamType === 'home') {
    Object.keys(outcomeProbs).forEach((key) => {
      const statKey = key as keyof Stats;
      outcomeProbs[statKey] *= homeMultipliers[statKey];
    });
  } else {
    Object.keys(outcomeProbs).forEach((key) => {
      const statKey = key as keyof Stats;
      outcomeProbs[statKey] *= awayMultipliers[statKey];
    });
  }
  const normalizedOutcomeProbs = normalizeStats(outcomeProbs);
  
  // Return the probabilities
  return normalizedOutcomeProbs;
}

function determineMatchupHandedness(batter: Player, pitcher: Player): {
  battingSide: Handedness;
  pitchingSide: Handedness;
} {
  let battingSide: Handedness | undefined, pitchingSide: Handedness | undefined;
    
  // Handle both switch (S)
  if (batter.battingSide === 'S' && pitcher.pitchingSide === 'S') {
      battingSide = 'L';
      pitchingSide = 'R';
  }
  
  // Handle switch pitcher
  if (pitcher.pitchingSide === 'S') {
      battingSide = batter.battingSide;
      pitchingSide = battingSide;  // Takes same side as batter
  }
  // Handle switch hitter
  else if (batter.battingSide === 'S') {
      pitchingSide = pitcher.pitchingSide;
      battingSide = pitchingSide === 'R' ? 'L' : 'R';  // Takes opposite of pitcher
  }
  // No switch pitchers/hitters
  else {
      battingSide = batter.battingSide;
      pitchingSide = pitcher.pitchingSide;
  }

  if (!battingSide || !pitchingSide) {
    throw new Error(`Invalid matchup handedness - Batter: ${batter.battingSide}, Pitcher: ${pitcher.pitchingSide}`);
  }
  
  return {
      battingSide: battingSide,
      pitchingSide: pitchingSide
  };
}

// ---------- Utility functions ----------

function calculateAndNormalizeLog5(batterStats: Stats, pitcherStats: Stats, leagueAvgStats: Stats): Stats {
  const outcomeProbs: Stats = {} as Stats;
  Object.keys(batterStats).forEach((key) => {
    const statKey = key as keyof Stats;
    outcomeProbs[statKey] = log5(
      batterStats[statKey],
      pitcherStats[statKey],
      leagueAvgStats[statKey]
    );
  });
  const normalizedOutcomeProbs = normalizeStats(outcomeProbs);
  return normalizedOutcomeProbs;
}

function log5(batterProb: number, pitcherProb: number, leagueProb: number): number {
  if (leagueProb === 0 || leagueProb === 1) {
    return leagueProb;
  }
  
  const numerator = batterProb * pitcherProb * (1 - leagueProb);
  const denominator = (batterProb * pitcherProb) - (leagueProb * batterProb) - 
                      (leagueProb * pitcherProb) + leagueProb;
  
  return numerator / denominator;
}

/**
 * Normalize the stats so that the sum of the stats is 1
 * @param stats - The stats to normalize
 * @returns The normalized stats
 */
export function normalizeStats(stats: Stats): Stats {
  const sum = Object.values(stats).reduce((acc, curr) => acc + curr, 0);
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, value / sum])
  ) as Record<keyof Stats, number> as Stats;
}

function handednessToLeagueAvgString(battingSide: Handedness, pitchingSide: Handedness): keyof LeagueAvgStats {
  return `${battingSide}hit${pitchingSide}pitch` as keyof LeagueAvgStats;
}

function handednessToPlayerStatsString(side: Handedness, hitOrPitch: 'hit' | 'pitch'): keyof PlayerStats {
  return `${hitOrPitch}Vs${side}` as keyof PlayerStats;
}

/**
 * Applies park effects multipliers to base stats
 * Walks and strikeouts are adjusted first, then hitting events are normalized to fit remaining space
 */
function applyStatsMultipliers(baseStats: Stats, multipliers: StatsMultiplier): Stats {
  // Apply walk & strikeout adjustments first
  const adjustedK = baseStats.adj_perc_K * multipliers.adj_perc_K;
  const adjustedBB = baseStats.adj_perc_BB * multipliers.adj_perc_BB;
  
  // Calculate remaining probability space for hitting events
  const remainingHittingSpace = 1.0 - (adjustedK + adjustedBB);

  // Apply multipliers to hitting events
  const temp1B = baseStats.adj_perc_1B * multipliers.adj_perc_1B;
  const temp2B = baseStats.adj_perc_2B * multipliers.adj_perc_2B;
  const temp3B = baseStats.adj_perc_3B * multipliers.adj_perc_3B;
  const tempHR = baseStats.adj_perc_HR * multipliers.adj_perc_HR;
  const tempOUT = baseStats.adj_perc_OUT * multipliers.adj_perc_OUT;
  
  // Normalize hitting events to fit remaining space
  const tempHittingTotal = temp1B + temp2B + temp3B + tempHR + tempOUT;
  const scalingFactor = remainingHittingSpace / tempHittingTotal;
  
  return {
    adj_perc_K: adjustedK,
    adj_perc_BB: adjustedBB,
    adj_perc_1B: temp1B * scalingFactor,
    adj_perc_2B: temp2B * scalingFactor,
    adj_perc_3B: temp3B * scalingFactor,
    adj_perc_HR: tempHR * scalingFactor,
    adj_perc_OUT: tempOUT * scalingFactor
  };
}

function adjustLeagueAvgStats(leagueAvgStats: LeagueAvgStats, parkEffects?: ParkEffectsResponse): LeagueAvgStats {
  if (!parkEffects) {
    return leagueAvgStats;
  }

  return {
    RhitLpitch: applyStatsMultipliers(leagueAvgStats.RhitLpitch, parkEffects.leagueAverage.RhitVsAll),
    RhitRpitch: applyStatsMultipliers(leagueAvgStats.RhitRpitch, parkEffects.leagueAverage.RhitVsAll),
    LhitLpitch: applyStatsMultipliers(leagueAvgStats.LhitLpitch, parkEffects.leagueAverage.LhitVsAll),
    LhitRpitch: applyStatsMultipliers(leagueAvgStats.LhitRpitch, parkEffects.leagueAverage.LhitVsAll)
  };
}

function adjustBatters(batters: Player[], parkEffects?: ParkEffectsResponse): Player[] {
  if (!parkEffects) {
    return batters;
  }

  return batters.map(batter => {
    const playerParkEffects = parkEffects.players.find((player) => player.playerId === batter.id);
    
    if (batter.stats) {
      const leagueEffectsVsL = batter.battingSide === 'S' || batter.battingSide == 'R'
        ? parkEffects.leagueAverage.RhitVsAll 
        : parkEffects.leagueAverage.LhitVsAll;
      const leagueEffectsVsR = batter.battingSide === 'S' || batter.battingSide === 'L'
        ? parkEffects.leagueAverage.LhitVsAll 
        : parkEffects.leagueAverage.RhitVsAll;

      return {
        ...batter,
        stats: {
          ...batter.stats,
          hitVsL: batter.stats.hitVsL 
            ? applyStatsMultipliers(batter.stats.hitVsL, playerParkEffects?.parkEffects.hitVsL || leagueEffectsVsL)
            : batter.stats.hitVsL,
          hitVsR: batter.stats.hitVsR 
            ? applyStatsMultipliers(batter.stats.hitVsR, playerParkEffects?.parkEffects.hitVsR || leagueEffectsVsR)
            : batter.stats.hitVsR
        }
      };
    }
    return batter;
  });
}

function adjustPitchers(pitchers: Player[], parkEffects?: ParkEffectsResponse): Player[] {
  if (!parkEffects) {
    return pitchers;
  }

  return pitchers.map(pitcher => {
    const playerParkEffects = parkEffects.players.find((player) => player.playerId === pitcher.id);
    
    if (pitcher.stats) {
      return {
        ...pitcher,
        stats: {
          ...pitcher.stats,
          pitchVsL: pitcher.stats.pitchVsL 
            ? applyStatsMultipliers(pitcher.stats.pitchVsL, playerParkEffects?.parkEffects.pitchVsL || parkEffects.leagueAverage.LhitVsAll)
            : pitcher.stats.pitchVsL,
          pitchVsR: pitcher.stats.pitchVsR 
            ? applyStatsMultipliers(pitcher.stats.pitchVsR, playerParkEffects?.parkEffects.pitchVsR || parkEffects.leagueAverage.RhitVsAll)
            : pitcher.stats.pitchVsR
        }
      };
    }
    return pitcher;
  });
}
