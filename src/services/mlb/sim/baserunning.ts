import { GameStateMLB, EventType, PlayResult, Player } from "@/types/mlb";
import { BaseRunningModel } from "@/types/mlb/mlb-sim";
import rawTransitionDataNoSB from './data/baserunner_transitions_no_sb.json';
import rawTransitionDataWithSB from './data/baserunner_transitions.json';
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
  newBases: boolean[];
  runsOnPlay: number;
  outsOnPlay: number;
  probability: number;
  cumulativeProbability: number;  // For the binary search
}

let BATTING_TRANSITIONS_NO_SB: Map<string, PrecomputedOutcome[]> | null = null;
let BATTING_TRANSITIONS_WITH_SB: Map<string, PrecomputedOutcome[]> | null = null;

function getTransitionMap(baseRunningModel: BaseRunningModel): Map<string, PrecomputedOutcome[]> {
  if (baseRunningModel === 'state_transitions') {
    if (!BATTING_TRANSITIONS_WITH_SB) {
      BATTING_TRANSITIONS_WITH_SB = new Map<string, PrecomputedOutcome[]>();
      
      // Pre-compute transitions with stolen bases
      for (const [event, states] of Object.entries(rawTransitionDataWithSB as RawTransitionMap)) {
        for (const [baseState, outcomes] of Object.entries(states)) {
          const key = `${event}-${baseState}`;
          
          const precomputed = outcomes.map(outcome => {
            const [bases, _, runs] = outcome.end_state.split('-');
            return {
              newBases: [bases[0] === 'X', bases[1] === 'X', bases[2] === 'X'],
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
          
          BATTING_TRANSITIONS_WITH_SB.set(key, precomputed);
        }
      }
    }
    return BATTING_TRANSITIONS_WITH_SB;
  } else {
    // For 'avg_stolen_bases' and 'ind_stolen_bases'
    if (!BATTING_TRANSITIONS_NO_SB) {
      BATTING_TRANSITIONS_NO_SB = new Map<string, PrecomputedOutcome[]>();
      
      // Pre-compute transitions for no stolen bases
      for (const [event, states] of Object.entries(rawTransitionDataNoSB as RawTransitionMap)) {
        for (const [baseState, outcomes] of Object.entries(states)) {
          const key = `${event}-${baseState}`;
          
          const precomputed = outcomes.map(outcome => {
            const [bases, _, runs] = outcome.end_state.split('-');
            return {
              newBases: [bases[0] === 'X', bases[1] === 'X', bases[2] === 'X'],
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
  newBases: boolean[];
}

/**
 * Simulate stolen base attempts and return StolenBaseResult
 */
function simulateStolenBase(gameState: GameStateMLB): StolenBaseResult | null {
  const baseStateKey = gameStateToBaseStateKey(gameState);
  const outcomes = STOLEN_BASE_TRANSITIONS.get(baseStateKey);
  
  if (!outcomes) {
    return null;
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
  
  const selectedOutcome = outcomes[left];
  
  // If no runners attempt steals, return null
  if (selectedOutcome.runners.length === 0) {
    return null;
  }

  // Simulate success/failure for each runner
  const stolenBases: string[] = [];
  const caughtStealing: string[] = [];
  const newBases = [...gameState.bases];
  let runsScored = 0;

  for (const runner of selectedOutcome.runners) {
    const successRate = selectedOutcome.successRates[runner];
    const isSuccessful = Math.random() < successRate;
    
    if (isSuccessful) {
      stolenBases.push(runner);
      if (runner === '1B' && gameState.bases[0]) {
        newBases[0] = false;  // Remove from 1B
        newBases[1] = true;   // Add to 2B
      } else if (runner === '2B' && gameState.bases[1]) {
        newBases[1] = false;  // Remove from 2B
        newBases[2] = true;   // Add to 3B
      } else if (runner === '3B' && gameState.bases[2]) {
        newBases[2] = false;  // Remove from 3B (scored)
        runsScored += 1;
      }
    } else {
      caughtStealing.push(runner);
      if (runner === '1B' && gameState.bases[0]) {
        newBases[0] = false;
      } else if (runner === '2B' && gameState.bases[1]) {
        newBases[1] = false;
      } else if (runner === '3B' && gameState.bases[2]) {
        newBases[2] = false;
      }
    }
  }

  return {
    stolenBases,
    caughtStealing,
    runsScored,
    newBases
  };
}

/**
 * Process stolen base result and update game state, return PlayResult
 */
function processStolenBaseResult(
  stolenBaseResult: StolenBaseResult,
  gameState: GameStateMLB
): PlayResult {
  const basesBefore = [...gameState.bases];
  
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
  gameState.bases = stolenBaseResult.newBases;
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
    basesBefore,
    basesAfter: stolenBaseResult.newBases
  };
}

/**
 * Process batting event and advance runners
 */
function processBattingEvent(event: EventType, gameState: GameStateMLB, baseRunningModel: BaseRunningModel): {
  runsOnPlay: number;
  outsOnPlay: number;
  newBases: boolean[];
} {
  const transitionKey = gameStateToTransitionKey(gameState);
  return transitionKeyToOutcome(event, transitionKey, baseRunningModel);
}

export { simulateStolenBase, processStolenBaseResult, processBattingEvent };

// ---------- Helper functions ----------

function gameStateToBaseStateKey(gameState: GameStateMLB): string {
  function baseToLetter(base: boolean): string {
    return base ? 'X' : 'O';
  }

  return `${baseToLetter(gameState.bases[0])}${baseToLetter(gameState.bases[1])}${baseToLetter(gameState.bases[2])}-${gameState.outs}`;
}

function gameStateToTransitionKey(gameState: GameStateMLB): string {
  function baseToLetter(base: boolean): string {
    return base ? 'X' : 'O';
  }

  return `${baseToLetter(gameState.bases[0])}${baseToLetter(gameState.bases[1])}${baseToLetter(gameState.bases[2])}-${gameState.outs}`;
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

