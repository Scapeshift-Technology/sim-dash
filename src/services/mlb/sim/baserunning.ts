import { GameStateMLB, EventType, PlayResult, Player } from "@/types/mlb";
import { BaseRunningModel } from "@/types/mlb/mlb-sim";
import { leagueAvgStats } from "./exampleMatchup";
import { MatchupLineups } from "@/types/mlb";
import rawTransitionDataNoSB from './data/baserunner_transitions_no_sb.json';
import rawStolenBaseData from './data/stolen_base_transitions.json';

// ---------- Batting event transitions (lazy loaded) ----------
interface RawOutcome {
  end_state: string;
  probability: number;
  runs_scored: number;
  outs_made: number;
}

type RawTransitionMap = {
  [K in EventType]: {
    [baseState: string]: RawOutcome[];
  };
};

type PrecomputedOutcome = {
  endState: string;  // Shows where players moved
  runsOnPlay: number;
  outsOnPlay: number;
  probability: number;
  cumulativeProbability: number;  // For the binary search
}

let BATTING_TRANSITIONS_NO_SB: Map<string, PrecomputedOutcome[]> | null = null;

function getTransitionMap(baseRunningModel: BaseRunningModel): Map<string, PrecomputedOutcome[]> {
  // For 'avg_stolen_bases' and 'ind_stolen_bases'
  if (!BATTING_TRANSITIONS_NO_SB) {
    BATTING_TRANSITIONS_NO_SB = new Map<string, PrecomputedOutcome[]>();
    
    // Pre-compute transitions for no stolen bases
    for (const [event, states] of Object.entries(rawTransitionDataNoSB as RawTransitionMap)) {
      for (const [baseState, outcomes] of Object.entries(states)) {
        const key = `${event}-${baseState}`;
        
        const precomputed = outcomes.map(outcome => {
          return {
            endState: outcome.end_state,  // Keep the full state like "B12-1"
            runsOnPlay: outcome.runs_scored,
            outsOnPlay: outcome.outs_made,
            probability: outcome.probability,
            cumulativeProbability: 0  // Will be set in next step
          };
        });

        // Compute cumulative probabilities
        let cumulative = 0;
        for (const outcome of precomputed) {
          cumulative += outcome.probability;
          outcome.cumulativeProbability = cumulative;
        }
        
        BATTING_TRANSITIONS_NO_SB.set(key, precomputed);
      }
    }
  }
  return BATTING_TRANSITIONS_NO_SB;
}

// ---------- Stolen base transitions ----------
interface StolenBaseOutcome {
  runners: string[];
  probability: number;
  success_rates: { [runner: string]: number };
}

type StolenBaseMap = {
  [baseState: string]: {
    outcomes: StolenBaseOutcome[];
  };
};

type PrecomputedStolenBaseOutcome = {
  runners: string[];
  successRates: { [runner: string]: number };
  probability: number;
  cumulativeProbability: number;
}

const STOLEN_BASE_TRANSITIONS = new Map<string, PrecomputedStolenBaseOutcome[]>();

// Pre-compute all possible stolen base transitions
for (const [baseState, data] of Object.entries(rawStolenBaseData as StolenBaseMap)) {
  const precomputed = data.outcomes.map(outcome => ({
    runners: outcome.runners,
    successRates: outcome.success_rates,
    probability: outcome.probability,
    cumulativeProbability: 0  // Will be set in next step
  }));

  // Compute cumulative probabilities
  let cumulative = 0;
  for (const outcome of precomputed) {
    cumulative += outcome.probability;
    outcome.cumulativeProbability = cumulative;
  }
  
  STOLEN_BASE_TRANSITIONS.set(baseState, precomputed);
}

// ---------- Main functions ----------

interface StolenBaseResult {
  stolenBases: string[];
  caughtStealing: string[];
  runsScored: number;
  newBaseRunners: (number | null)[];
}

/**
 * Simulate stolen base attempts and return StolenBaseResult
 */
function simulateStolenBase(gameState: GameStateMLB, matchup: MatchupLineups, baseRunningModel: BaseRunningModel): StolenBaseResult | null {
  const baseStateKey = gameStateToTransitionKey(gameState);
  const outcomes = STOLEN_BASE_TRANSITIONS.get(baseStateKey);
  
  if (!outcomes) {
    return null;
  }

  let adjustedOutcomes: PrecomputedStolenBaseOutcome[] = outcomes;
  if (baseRunningModel === 'ind_stolen_bases') {
    adjustedOutcomes = adjustOutcomeProbabilitiesWithIndividualMultipliers(outcomes, gameState, matchup);
  }

  const random = Math.random();
  
  // Binary search for the outcome
  let left = 0;
  let right = adjustedOutcomes.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (adjustedOutcomes[mid].cumulativeProbability <= random) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  const selectedOutcome = adjustedOutcomes[left];
  
  // If no runners attempt steals, return null
  if (selectedOutcome.runners.length === 0) {
    return null;
  }

  // Simulate success/failure for each runner
  const stolenBases: string[] = [];
  const caughtStealing: string[] = [];
  const newBaseRunners = [...gameState.baseRunners];
  let runsScored = 0;

  for (const runner of selectedOutcome.runners) {
    const baseSuccessRate = selectedOutcome.successRates[runner];

    let adjustedSuccessRate: number = baseSuccessRate;
    if (baseRunningModel === 'ind_stolen_bases') {
      const runnerPlayerId = getRunnerPlayerId(gameState, runner);
      const successMultiplier = runnerPlayerId ? getPlayerSuccessMultiplier(runnerPlayerId, matchup) : 1;
      adjustedSuccessRate = Math.max(0.1, Math.min(0.9, baseSuccessRate * successMultiplier)); // Constrain to avoid unrealistic probabilities
    }
    
    const isSuccessful = Math.random() < adjustedSuccessRate;
    
    if (isSuccessful) {
      stolenBases.push(runner);
      if (runner === '1B' && gameState.baseRunners[0]) {
        const runnerID = newBaseRunners[0];
        newBaseRunners[0] = null;  // Remove from 1B
        newBaseRunners[1] = runnerID;   // Add to 2B
      } else if (runner === '2B' && gameState.baseRunners[1]) {
        const runnerID = newBaseRunners[1];
        newBaseRunners[1] = null;  // Remove from 2B
        newBaseRunners[2] = runnerID;   // Add to 3B
      } else if (runner === '3B' && gameState.baseRunners[2]) {
        newBaseRunners[2] = null;  // Remove from 3B (scored)
        runsScored += 1;
      }
    } else {
      caughtStealing.push(runner);
      if (runner === '1B' && gameState.baseRunners[0]) {
        newBaseRunners[0] = null;
      } else if (runner === '2B' && gameState.baseRunners[1]) {
        newBaseRunners[1] = null;
      } else if (runner === '3B' && gameState.baseRunners[2]) {
        newBaseRunners[2] = null;
      }
    }
  }

  return {
    stolenBases,
    caughtStealing,
    runsScored,
    newBaseRunners
  };
}

/**
 * Process stolen base result and update game state, return PlayResult
 */
function processStolenBaseResult(
  stolenBaseResult: StolenBaseResult,
  gameState: GameStateMLB
): PlayResult {
  const baseRunnersBefore = [...gameState.baseRunners];
  
  // Get current batter and pitcher from gameState
  const { topInning } = gameState;
  let currentBatter: Player;
  let currentPitcherID: number;

  if (topInning) {
    currentBatter = gameState.awayLineup[gameState.awayLineupPos];
    currentPitcherID = gameState.homePitcher.id;
  } else {
    currentBatter = gameState.homeLineup[gameState.homeLineupPos];
    currentPitcherID = gameState.awayPitcher.id;
  }
  
  // Update game state
  gameState.baseRunners = stolenBaseResult.newBaseRunners;
  gameState.outs += stolenBaseResult.caughtStealing.length;
  if (gameState.topInning) {
    gameState.awayScore += stolenBaseResult.runsScored;
  } else {
    gameState.homeScore += stolenBaseResult.runsScored;
  }

  // Determine primary event type
  const eventType: EventType = stolenBaseResult.stolenBases.length > 0 ? 'SB' : 'CS';

  // Create PlayResult
  return {
    batterID: currentBatter.id,
    pitcherID: currentPitcherID,
    eventType,
    runsOnPlay: stolenBaseResult.runsScored,
    inning: gameState.inning,
    topInning: gameState.topInning,
    outs: gameState.outs - stolenBaseResult.caughtStealing.length, // Outs before the steal
    outsOnPlay: stolenBaseResult.caughtStealing.length,
    awayScore: gameState.awayScore,
    homeScore: gameState.homeScore,
    baseRunnersBefore,
    baseRunnersAfter: stolenBaseResult.newBaseRunners
  };
}

/**
 * Process batting event and advance runners
 */
function processBattingEvent(event: EventType, gameState: GameStateMLB, baseRunningModel: BaseRunningModel): {
  runsOnPlay: number;
  outsOnPlay: number;
  newBaseRunners: (number | null)[];
} {
  const transitionKey = gameStateToTransitionKey(gameState);
  const outcome = transitionKeyToOutcome(event, transitionKey, baseRunningModel);
  const batterID = gameState.topInning ? gameState.awayLineup[gameState.awayLineupPos].id : gameState.homeLineup[gameState.homeLineupPos].id;
  const newBaseRunners = applyEndStateToBaseRunners(gameState.baseRunners, outcome.endState, batterID);
  
  return {
    runsOnPlay: outcome.runsOnPlay,
    outsOnPlay: outcome.outsOnPlay,
    newBaseRunners: newBaseRunners
  };
}

export { simulateStolenBase, processStolenBaseResult, processBattingEvent };

// ---------- Helper functions ----------

function applyEndStateToBaseRunners(
  currentRunners: (number | null)[],
  endState: string,
  batterID: number
): (number | null)[] {
  // Parse endState like "B12-1" -> ["B", "1", "2"] and ignore the outs part
  const [statePart] = endState.split('-');
  const newBaseRunners: (number | null)[] = [null, null, null];
  
  // Create mapping: position number -> actual player ID
  const runnersByPosition: { [position: string]: number } = {};
  currentRunners.forEach((runner, index) => {
    if (runner !== null) {
      runnersByPosition[(index + 1).toString()] = runner;
    }
  });
  
  // Apply the transition
  for (let i = 0; i < 3; i++) {
    const positionChar = statePart[i];
    
    if (positionChar === 'X') {
      // Base is empty
      newBaseRunners[i] = null;
    } else if (positionChar === 'B') {
      // Batter goes to this base
      newBaseRunners[i] = batterID;
    } else if (positionChar >= '1' && positionChar <= '3') {
      // Runner from original position moves here
      const originalRunnerID = runnersByPosition[positionChar];
      newBaseRunners[i] = originalRunnerID || null;
    }
  }
  
  return newBaseRunners;
}

function gameStateToTransitionKey(gameState: GameStateMLB): string {
  function runnerToLetter(runner: number | null, baseNumber: number): string {
    return runner !== null ? `${baseNumber}` : 'X';
  }

  return `${runnerToLetter(gameState.baseRunners[0], 1)}${runnerToLetter(gameState.baseRunners[1], 2)}${runnerToLetter(gameState.baseRunners[2], 3)}-${gameState.outs}`;
}

function transitionKeyToOutcome(event: EventType, transitionKey: string, baseRunningModel: BaseRunningModel): PrecomputedOutcome {
  const key = `${event}-${transitionKey}`;
  
  const transitionMap = getTransitionMap(baseRunningModel);
    
  const outcomes = transitionMap.get(key);
  
  if (!outcomes) {
    throw new Error(`No batting transitions found for ${key} with model ${baseRunningModel}`);
  }

  const random = Math.random();
  
  // Binary search for the outcome
  let left = 0;
  let right = outcomes.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (outcomes[mid].cumulativeProbability <= random) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return outcomes[left];
}

// ---------- Helper functions for player-specific multipliers ----------

/**
 * Get player's attempt rate multiplier (player/league average, capped 0.1-0.9)
 */
function getPlayerAttemptMultiplier(playerId: number, matchup: MatchupLineups): number {
  const player = findPlayerById(playerId, matchup);
  if (!player?.stats?.baserunning?.att_perc_sb) {
    return 1; // Default to league average if no stats
  }
  
  const playerRate = player.stats.baserunning.att_perc_sb;
  const leagueRate = leagueAvgStats.baserunning.att_perc_sb;
  const multiplier = playerRate / leagueRate;
  
  return multiplier;
}

/**
 * Get player's success rate multiplier (player/league average, capped 0.1-0.9)
 */
function getPlayerSuccessMultiplier(playerId: number, matchup: MatchupLineups): number {
  const player = findPlayerById(playerId, matchup);
  if (!player?.stats?.baserunning?.sb_perc) {
    return 1; // Default to league average if no stats
  }
  
  const playerRate = player.stats.baserunning.sb_perc;
  const leagueRate = leagueAvgStats.baserunning.sb_perc;
  const multiplier = playerRate / leagueRate;
  
  return multiplier;
}

/**
 * Find player by ID in matchup lineups
 */
function findPlayerById(playerId: number, matchup: MatchupLineups): Player | null {
  // Flatten all players from both teams
  const allPlayers = [
    ...matchup.away.lineup,
    matchup.away.startingPitcher,
    ...matchup.away.bullpen,
    ...matchup.away.bench,
    ...matchup.away.unavailableHitters,
    ...matchup.away.unavailablePitchers,
    ...matchup.home.lineup,
    matchup.home.startingPitcher,
    ...matchup.home.bullpen,
    ...matchup.home.bench,
    ...matchup.home.unavailableHitters,
    ...matchup.home.unavailablePitchers
  ];
  
  return allPlayers.find(player => player.id === playerId) || null;
}

/**
 * Get the player ID for a specific runner position
 */
function getRunnerPlayerId(gameState: GameStateMLB, runnerBase: string): number | null {
  switch (runnerBase) {
    case '1B': return gameState.baseRunners[0];
    case '2B': return gameState.baseRunners[1]; 
    case '3B': return gameState.baseRunners[2];
    default: return null;
  }
}

/**
 * Adjust outcome probabilities with individual multipliers
 */
function adjustOutcomeProbabilitiesWithIndividualMultipliers(
  outcomes: PrecomputedStolenBaseOutcome[],
  gameState: GameStateMLB,
  matchup: MatchupLineups
): PrecomputedStolenBaseOutcome[] {
  // Separate steal vs no-steal
  const stealOutcomes: PrecomputedStolenBaseOutcome[] = [];
  let noStealOutcome: PrecomputedStolenBaseOutcome | undefined;
  
  outcomes.forEach(outcome => {
    if (outcome.runners.length === 0) {
      noStealOutcome = outcome;
    } else {
      stealOutcomes.push(outcome);
    }
  });

  // Apply multipliers only to steal outcomes
  const adjustedStealOutcomes = stealOutcomes.map(outcome => {
    let runnerPlayerId: number | null = null;
    
    if (outcome.runners.length === 1) {
      const runnerBase = outcome.runners[0];
      runnerPlayerId = getRunnerPlayerId(gameState, runnerBase);
    } else {
      // Multiple runners attempting - use lead runner's multiplier among those attempting
      const leadRunnerBase = getLeadRunnerAmongAttempting(outcome.runners);
      runnerPlayerId = getRunnerPlayerId(gameState, leadRunnerBase);
    }

    const attemptMultiplier = runnerPlayerId ? getPlayerAttemptMultiplier(runnerPlayerId, matchup) : 1;
    const newProbability = outcome.probability * attemptMultiplier;
    
    return {
      ...outcome,
      probability: newProbability
    };
  });

  // Calculate total steal probability after adjustment
  const totalStealProbability = adjustedStealOutcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  
  // Set no-steal outcome to fill remainder (1 - totalStealProbability)
  const remainingProbability = Math.max(0, 1 - totalStealProbability);

  // Combine outcomes
  const finalOutcomes = [...adjustedStealOutcomes];
  if (noStealOutcome) {
    finalOutcomes.push({
      runners: [],
      successRates: {},
      probability: remainingProbability,
      cumulativeProbability: 0
    });
  }

  // Recompute cumulative probabilities
  let cumulative = 0;
  for (const outcome of finalOutcomes) {
    cumulative += outcome.probability;
    outcome.cumulativeProbability = cumulative;
  }

  return finalOutcomes;
}

/**
 * Get the lead runner (closest to home) among those attempting steals
 */
function getLeadRunnerAmongAttempting(attemptingRunners: string[]): string {
  if (attemptingRunners.includes('3B')) return '3B';
  if (attemptingRunners.includes('2B')) return '2B';
  if (attemptingRunners.includes('1B')) return '1B';
  return attemptingRunners[0]; // Fallback
}

