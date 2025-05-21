import { EventType } from "@/types/mlb";
import { GameStateMLB } from "@/types/mlb";






/**
 * Process event and advance runners
 */
function processEvent(event: EventType, gameState: GameStateMLB): {
  runsOnPlay: number;
  outsOnPlay: number;
  newBases: boolean[];
} {
  let runsOnPlay = 0;
  let outsOnPlay = 0;
  const newBases = [...gameState.bases];
    
  if (event === 'BB') {
    // Walk - advance runners only if forced
    if (gameState.bases[0] && gameState.bases[1] && gameState.bases[2]) {  // Bases loaded
      runsOnPlay += 1;
    } else if (gameState.bases[0] && gameState.bases[1]) {  // First and second
      newBases[2] = gameState.bases[1];  // Runner on second to third
      newBases[1] = gameState.bases[0];  // Runner on first to second
      newBases[0] = true;               // Batter to first
    } else if (gameState.bases[0]) {  // Just first or first and third
      newBases[2] = gameState.bases[1] || gameState.bases[2];
      newBases[1] = gameState.bases[0];  // First to second
      newBases[0] = true;               // Batter to first
    } else {  // Empty or other combinations
      newBases[2] = gameState.bases[2];  // Third stays
      newBases[1] = gameState.bases[1];  // Second stays
      newBases[0] = true;               // Batter to first
    }
  } else if (event === '1B') {
    // Single - advance runners 1 base, runner on third scores
    if (gameState.bases[2]) {
      runsOnPlay += 1;  // Third scores
    }
    
    // 65% chance second scores
    if (gameState.bases[1] && Math.random() < 0.65) {
      runsOnPlay += 1;
      newBases[2] = false;  // Second scored
    } else {
      newBases[2] = gameState.bases[1];  // Second to third
    }
    
    newBases[1] = gameState.bases[0];  // First to second
    newBases[0] = true;               // Batter to first
  } else if (event === '2B') {
    // Double - advance runners 2 bases
    if (gameState.bases[2]) {
      runsOnPlay += 1;  // Third scores
    }
    
    if (gameState.bases[1]) {
      runsOnPlay += 1;  // Second scores
    }
    
    // 50% chance first scores
    if (gameState.bases[0] && Math.random() < 0.50) {
      runsOnPlay += 1;
      newBases[2] = false;  // First scored
    } else {
      newBases[2] = gameState.bases[0];  // First to third
    }
    
    newBases[1] = true;   // Batter to second
    newBases[0] = false;   // First now empty
  } else if (event === '3B') {
    // Triple - all runners score
    for (const base of gameState.bases) {
      if (base) {
        runsOnPlay += 1;
      }
    }
    
    newBases[0] = false;
    newBases[1] = false;
    newBases[2] = true;  // Batter to third
  } else if (event === 'HR') {
    // Home run - all runners score
    for (const base of gameState.bases) {
      if (base) {
        runsOnPlay += 1;
      }
    }
    
    runsOnPlay += 1;  // Batter scores
    
    newBases[0] = false;
    newBases[1] = false;
    newBases[2] = false;
  } else if (event === 'K') {
    outsOnPlay += 1;
  } else if (event === 'OUT') {
    outsOnPlay += 1;
  }
    
  return {
    runsOnPlay: runsOnPlay,
    outsOnPlay: outsOnPlay,
    newBases: newBases
  };
}

export { processEvent };
