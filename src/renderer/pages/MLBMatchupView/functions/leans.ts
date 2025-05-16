import type { MLBGameInputs2, MLBGameSimInputs } from "@/types/simInputs";
import type { MatchupLineups, Player, Stats } from "@/types/mlb";
import { normalizeStats } from "@@/services/mlb/sim/probabilities";

// ---------- Base weight configurations ----------
const HITTER_WEIGHTS: StatWeights = {
  adj_perc_1B: 1,
  adj_perc_2B: 1,
  adj_perc_3B: 1,
  adj_perc_HR: 1,
  adj_perc_BB: 1,
  adj_perc_K: undefined,
  adj_perc_OUT: undefined
};

const PITCHER_WEIGHTS: StatWeights = {
  adj_perc_K: 1,
  adj_perc_OUT: 1,
  adj_perc_BB: undefined,
  adj_perc_1B: undefined,
  adj_perc_2B: undefined,
  adj_perc_3B: undefined,
  adj_perc_HR: undefined
};

// ---------- Main function ----------

/**
 * Applies the leans to the lineups.
 * @param {MLBGameInputs} gameInputs - The full set of game inputs. Includes lineups and leans.
 * @returns {MatchupLineups} The same set of lineups, but with the leans applied.
 */
function applyMatchupLeansMLB(gameInputs: MLBGameInputs2): MatchupLineups {
  const lineups = gameInputs.lineups;
  const inputs = gameInputs.simInputs;

  if (!lineups || !inputs) {
    return gameInputs.lineups;
  }

  // Apply matchup leans
  const redoneLineups = applyLeansToLineups(lineups, inputs);

  return redoneLineups;
}

export { applyMatchupLeansMLB };

// ---------- Helper functions ----------

// ----- Types -----

type TeamLeanMap = {
  [playerId: number]: number;
};

type TeamLeans = {
  hitters: TeamLeanMap;
  startingPitcher: TeamLeanMap;
  bullpen: TeamLeanMap;
};

type MatchupLeans = {
  home: TeamLeans;
  away: TeamLeans;
};

type StatWeights = {
  adj_perc_K?: number;
  adj_perc_BB?: number;
  adj_perc_1B?: number;
  adj_perc_2B?: number;
  adj_perc_3B?: number;
  adj_perc_HR?: number;
  adj_perc_OUT?: number;
};

// ----- Functions -----

function applyLeansToLineups(lineups: MatchupLineups, inputs: MLBGameSimInputs): MatchupLineups {
  // Calculate leans for each team
  const matchupLeans: MatchupLeans = {
    home: calculateTeamLeans(lineups.home, inputs.home),
    away: calculateTeamLeans(lineups.away, inputs.away)
  };

  // Apply the leans to the lineups
  const redoneLineups = applyPlayerLeansToLineups(lineups, matchupLeans);

  return redoneLineups;
}

function applyPlayerLeansToLineups(lineups: MatchupLineups, leans: MatchupLeans): MatchupLineups {
  // Create a deep copy of the lineups
  const newLineups = JSON.parse(JSON.stringify(lineups));

  newLineups.home.lineup = newLineups.home.lineup.map((hitter: Player) => 
    applyHitterLean(hitter, leans.home.hitters[hitter.id])
  );

  newLineups.away.lineup = newLineups.away.lineup.map((hitter: Player) => 
    applyHitterLean(hitter, leans.away.hitters[hitter.id])
  );

  // Apply the leans to the starting pitcher
  newLineups.home.startingPitcher = applyPitcherLean(
    newLineups.home.startingPitcher, 
    leans.home.startingPitcher[newLineups.home.startingPitcher.id]
  );
  newLineups.away.startingPitcher = applyPitcherLean(
    newLineups.away.startingPitcher, 
    leans.away.startingPitcher[newLineups.away.startingPitcher.id]
  );

  // Apply the leans to the bullpen
  newLineups.home.bullpen = newLineups.home.bullpen.map((pitcher: Player) => 
    applyPitcherLean(pitcher, leans.home.bullpen[pitcher.id])
  );
  newLineups.away.bullpen = newLineups.away.bullpen.map((pitcher: Player) => 
    applyPitcherLean(pitcher, leans.away.bullpen[pitcher.id])
  );

  return newLineups;
}

function calculateTeamLeans(teamLineup: MatchupLineups['home' | 'away'], teamInputs: MLBGameSimInputs['home' | 'away']): TeamLeans {
  const hitters: TeamLeanMap = {};
  const bullpen: TeamLeanMap = {};

  // Map hitters
  teamLineup.lineup.forEach(player => {
    if (teamInputs.individualHitterLeans[player.id]) {
      hitters[player.id] = clampLean(teamInputs.individualHitterLeans[player.id]);
    } else {
      hitters[player.id] = clampLean(teamInputs.teamHitterLean);
    }
  });

  // Map starting pitcher
  const startingPitcher: TeamLeanMap = {
    [teamLineup.startingPitcher.id]: clampLean(
      teamInputs.individualPitcherLeans[teamLineup.startingPitcher.id] || teamInputs.teamPitcherLean
    )
  };

  // Map bullpen
  teamLineup.bullpen.forEach(player => {
    if (teamInputs.individualPitcherLeans[player.id]) {
      bullpen[player.id] = clampLean(teamInputs.individualPitcherLeans[player.id]);
    } else {
      bullpen[player.id] = clampLean(teamInputs.teamPitcherLean);
    }
  });

  return {
    hitters,
    startingPitcher,
    bullpen
  };
}

function adjustStats(stats: Stats, lean: number, weights: StatWeights): Stats {
  // Create a new stats object
  const newStats = { ...stats };

  // Get weighted and unweighted stats
  const weightedStats: { [key: string]: number } = {};
  const unweightedStats: { [key: string]: number } = {};

  Object.entries(weights).forEach(([stat, weight]) => {
    if (weight !== undefined && weight !== null) {
      weightedStats[stat] = newStats[stat as keyof Stats];
    } else {
      unweightedStats[stat] = newStats[stat as keyof Stats];
    }
  });

  // Calculate totals
  const totalWeighted = Object.values(weightedStats).reduce((sum, val) => sum + val, 0);
  const totalUnweighted = Object.values(unweightedStats).reduce((sum, val) => sum + val, 0);

  // Calculate increase for weighted stats
  const positiveIncrease = lean / 100;
  const totalIncrease = totalWeighted * positiveIncrease;

  // Calculate decrease for unweighted stats
  const unweightedDecrease = totalIncrease;
  const unweightedScale = unweightedDecrease / totalUnweighted;

  // Apply changes
  Object.keys(weightedStats).forEach(stat => {
    newStats[stat as keyof Stats] *= (1 + positiveIncrease);
  });

  Object.keys(unweightedStats).forEach(stat => {
    newStats[stat as keyof Stats] -= newStats[stat as keyof Stats] * unweightedScale;
  });

  // Normalize just in case
  return normalizeStats(newStats);
}

function applyHitterLean(hitter: Player, lean: number): Player {
  if (!hitter.stats?.hitVsL || !hitter.stats?.hitVsR) return hitter;

  // Create a deep copy of the hitter
  const newHitter = JSON.parse(JSON.stringify(hitter));

  newHitter.stats.hitVsL = adjustStats(newHitter.stats.hitVsL, lean, HITTER_WEIGHTS);
  newHitter.stats.hitVsR = adjustStats(newHitter.stats.hitVsR, lean, HITTER_WEIGHTS);

  return newHitter;
}

function applyPitcherLean(pitcher: Player, lean: number): Player {
  if (!pitcher.stats?.pitchVsL || !pitcher.stats?.pitchVsR) return pitcher;

  // Create a deep copy of the pitcher
  const newPitcher = JSON.parse(JSON.stringify(pitcher));

  newPitcher.stats.pitchVsL = adjustStats(newPitcher.stats.pitchVsL, lean, PITCHER_WEIGHTS);
  newPitcher.stats.pitchVsR = adjustStats(newPitcher.stats.pitchVsR, lean, PITCHER_WEIGHTS);

  return newPitcher;
}

const clampLean = (value: number): number => {
  return Math.max(-10, Math.min(10, value));
};

