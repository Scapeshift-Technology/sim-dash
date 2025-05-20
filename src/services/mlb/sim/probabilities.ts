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

// ---------- Main matchup probability function ----------
/**
 * Get the probabilities of a given batter-pitcher matchup in a given game(matchup)
 * @param matchup - The game data for the given matchup
 * @param leagueAvgStats - The league average stats
 * @returns The probabilities of the matchup
 */
function getMatchupProbabilities(matchup: MatchupLineups, leagueAvgStats: LeagueAvgStats): GameMatchupProbabilities {
  // Calculate for each team
  const homeTeamProbabilities = getTeamMatchupProbabilities(matchup.home, matchup.away, leagueAvgStats, 'home');
  const awayTeamProbabilities = getTeamMatchupProbabilities(matchup.away, matchup.home, leagueAvgStats, 'away');

  return {
    home: homeTeamProbabilities,
    away: awayTeamProbabilities
  };
}

export { getMatchupProbabilities };

// ---------- Helper functions ----------
function getTeamMatchupProbabilities(teamLineup: TeamLineup, opponentLineup: TeamLineup, leagueAvgStats: LeagueAvgStats, teamType: TeamType): TeamBatterMatchupProbabilities {
  const teamBatterMatchupProbabilities: TeamBatterMatchupProbabilities = {
    batter: {}
  };

  // Calculate for each batter-pitcher matchup
  for (const batter of teamLineup.lineup) {
    teamBatterMatchupProbabilities.batter[batter.id] = {};
    // Calculate vs starting pitcher
    const startingPitcherProbs = getBatterPitcherMatchupProbabilities(batter, opponentLineup.startingPitcher, leagueAvgStats, teamType);
    teamBatterMatchupProbabilities.batter[batter.id][opponentLineup.startingPitcher.id] = startingPitcherProbs;
    
    // Calculate vs bullpen
    for (const pitcher of opponentLineup.bullpen) {
      const matchupProbabilities = getBatterPitcherMatchupProbabilities(batter, pitcher, leagueAvgStats, teamType);
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
