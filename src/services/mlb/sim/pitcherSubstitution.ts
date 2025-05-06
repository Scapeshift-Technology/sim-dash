import { GameStateMLB, GameStatePitcher } from "@/types/mlb";

// ---------- Pitching substitution main function -----------
function evaluatePitchingSubstitution(gameState: GameStateMLB) {
  const shouldSubstitute = shouldSubstitutePitcher(gameState);

  if (shouldSubstitute) {
    substitutePitcher(gameState);
  }

  return shouldSubstitute;
}

export { evaluatePitchingSubstitution };

// ------------ Helper functions ------------

function substitutePitcher(gameState: GameStateMLB) {
  const topInning = gameState.topInning;
  const pitcher = topInning ? gameState.homePitcher : gameState.awayPitcher;
  const gameBullpen = topInning ? gameState.homeBullpen : gameState.awayBullpen;
  
  // Get available pitchers from bullpen
  const availablePitchers = gameBullpen.filter(p => p.id !== pitcher.id);
  
  // If no pitchers available, return without making change
  if (availablePitchers.length === 0) return;
  
  // Select a random pitcher from available bullpen pitchers
  const randomIndex = Math.floor(Math.random() * availablePitchers.length);
  const selectedPitcher = availablePitchers[randomIndex];
  
  // Create new pitcher object
  const newPitcher: GameStatePitcher = {
    id: selectedPitcher.id,
    battersFaced: 0,
    recentResults: [],
    position: 'RP'
  };
  
  // Update the appropriate pitcher in state
  if (topInning) {
    gameState.homePitcher = newPitcher;
    gameState.homeBullpen = gameState.homeBullpen.filter(p => p.id !== selectedPitcher.id);
  } else {
    gameState.awayPitcher = newPitcher;
    gameState.awayBullpen = gameState.awayBullpen.filter(p => p.id !== selectedPitcher.id);
  }
}

function shouldSubstitutePitcher(gameState: GameStateMLB): boolean {
  const topInning = gameState.topInning;
  const pitcher = topInning ? gameState.homePitcher : gameState.awayPitcher;
  
  if (pitcher.battersFaced < 3) {
    return false;
  }

  const maxAllowedBattersFaced = pitcher.position === "SP" ? 27 : 5;
  if (pitcher.battersFaced >= maxAllowedBattersFaced) {
    return true;
  }

  return false;
}

