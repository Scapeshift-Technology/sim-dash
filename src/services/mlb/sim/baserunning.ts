import { GameStateMLB, EventType } from "@/types/mlb";
import rawTransitionData from './data/baserunner_transitions.json';

// ---------- Pre-computed transitions ----------
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

const TRANSITIONS = new Map<string, PrecomputedOutcome[]>();

// Pre-compute all possible transitions
for (const [event, states] of Object.entries(rawTransitionData as RawTransitionMap)) {
  for (const [baseState, outcomes] of Object.entries(states)) {
    const key = `${event}-${baseState}`;
    
    // Convert outcomes array to PrecomputedOutcome array
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
    
    TRANSITIONS.set(key, precomputed);
  }
}

// ---------- Main function ----------

/**
 * Process event and advance runners
 */
function processEvent(event: EventType, gameState: GameStateMLB): {
  runsOnPlay: number;
  outsOnPlay: number;
  newBases: boolean[];
} {
  const transitionKey = gameStateToTransitionKey(gameState);
  return transitionKeyToOutcome(event, transitionKey);
}

export { processEvent };

// ---------- Helper functions ----------

function gameStateToTransitionKey(gameState: GameStateMLB): string {
  function baseToLetter(base: boolean): string {
    return base ? 'X' : 'O';
  }

  return `${baseToLetter(gameState.bases[0])}${baseToLetter(gameState.bases[1])}${baseToLetter(gameState.bases[2])}-${gameState.outs}`;
}

function transitionKeyToOutcome(event: EventType, transitionKey: string): PrecomputedOutcome {
  const key = `${event}-${transitionKey}`;
  const outcomes = TRANSITIONS.get(key);
  
  if (!outcomes) {
    throw new Error(`No transitions found for ${key}`);
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

