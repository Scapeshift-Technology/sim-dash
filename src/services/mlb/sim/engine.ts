import {
  LeagueAvgStats, 
  MatchupLineups, 
  GameMatchupProbabilities, 
  PlayResult, 
  GameStateMLB, 
  Player, 
  Stats, 
  EventType
} from "@/types/mlb";
import { leagueAvgStats } from "./exampleMatchup";
import { getMatchupProbabilities } from "./probabilities";
import { initializeHomeFieldMultipliers } from "./homeFieldAdvantage";
import { calculateSimCounts } from "./analysis/analyzeResults";
import { SimResultsMLB } from "@/types/bettingResults";
import { evaluatePitchingSubstitution } from "./pitcherSubstitution";

// ---------- MLB sim engine ----------
/**
 * Simulates a matchup between two teams
 * @param matchup - The team data for the given matchup
 * @returns The results of the matchup
 */
async function simulateMatchupMLB(
  matchup: MatchupLineups,
//   leagueAvgStats: LeagueAvgStats,
  num_games: number = 50000
) {
  // Matchup probabilities
  await initializeHomeFieldMultipliers();

  const simPlays = simulateGames(matchup, leagueAvgStats, num_games);

  // Get results
  const outputResults: SimResultsMLB = calculateSimCounts(simPlays, matchup);

  return outputResults;
}

function simulateGames(matchup: MatchupLineups, leagueAvgStats: LeagueAvgStats, num_games: number): PlayResult[][] {
  const matchupProbabilities: GameMatchupProbabilities = getMatchupProbabilities(matchup, leagueAvgStats);
  const allPlays: PlayResult[][] = [];

  for (let i = 0; i < num_games; i++) {
    const gamePlays = simulateGame(matchup, matchupProbabilities);
    allPlays.push(gamePlays);
  }

  return allPlays;
}

/**
 * 
 * @param matchup 
 * @param matchupProbabilities 
 * @returns {PlayResult[]} An array of plays that happened during the game
 */
function simulateGame(matchup: MatchupLineups, matchupProbabilities: GameMatchupProbabilities): PlayResult[] {
  const plays: PlayResult[] = [];
  const gameState = initializeGameState(matchup);

  while (true) {
    const playResult = simulatePlay(gameState, matchupProbabilities);
    plays.push(playResult);

    updateGameState(gameState, playResult);

    // Check if game should end
    if (checkGameEnd(gameState)) {
      break;
    }

    // Potentially substitute pitcher
    evaluatePitchingSubstitution(gameState);

    // Handle inning end
    handleInningEnd(gameState);
  }

  return plays;
}

function handleInningEnd(gameState: GameStateMLB) {
  if (gameState.outs >= 3) {
    // In extra innings, runner starts on second base
    if (gameState.inning > 9) {
      gameState.bases = [false, true, false];
    } else {
      gameState.bases = [false, false, false];
    }
    // If bottom of inning, increment inning counter
    if (!gameState.topInning) {
      gameState.inning += 1;
    }
    gameState.outs = 0;
    gameState.topInning = !gameState.topInning;
  }
}

function checkGameEnd(gameState: GameStateMLB): boolean {
  const endInning = 9;
  // Home team takes lead in 9th or later
  if (((gameState.inning === endInning && !gameState.topInning) || (gameState.inning > endInning)) && (gameState.homeScore > gameState.awayScore)) {
    return true;
  }
  // Game complete with different scores
  if ((gameState.inning >= endInning && !gameState.topInning && gameState.outs >= 3) && (gameState.awayScore !== gameState.homeScore)) {
    return true;
  }
  return false;
}

function updateGameState(gameState: GameStateMLB, playResult: PlayResult) {
  if (playResult.topInning) {
    gameState.awayScore += playResult.runsOnPlay;
    gameState.awayLineupPos = (gameState.awayLineupPos + 1) % 9;
    gameState.homePitcher.battersFaced += 1;
  } else {
    gameState.homeScore += playResult.runsOnPlay;
    gameState.homeLineupPos = (gameState.homeLineupPos + 1) % 9;
    gameState.awayPitcher.battersFaced += 1;
  }

  gameState.bases = playResult.basesAfter;
  gameState.outs += playResult.outsOnPlay;
}

function simulatePlay(gameState: GameStateMLB, matchupProbabilities: GameMatchupProbabilities): PlayResult {
  const { topInning } = gameState;
  let atBatMatchupProbabilities: Stats;
  let currentBatter: Player;
  let currentPitcherID: number;

  if (topInning) {
    currentBatter = gameState.awayLineup[gameState.awayLineupPos];
    currentPitcherID = gameState.homePitcher.id;
    atBatMatchupProbabilities = matchupProbabilities.away.batter[currentBatter.id][currentPitcherID];
  } else {
    currentBatter = gameState.homeLineup[gameState.homeLineupPos];
    currentPitcherID = gameState.awayPitcher.id;
    atBatMatchupProbabilities = matchupProbabilities.home.batter[currentBatter.id][currentPitcherID];
  }

  const playEvent = simulatePlayResult(atBatMatchupProbabilities);
  const result = processEvent(playEvent, gameState);
  const playResult: PlayResult = {
    batterID: currentBatter.id,
    pitcherID: currentPitcherID,
    eventType: playEvent,
    runsOnPlay: result.runsOnPlay,
    inning: gameState.inning,
    topInning: gameState.topInning,
    outs: gameState.outs,
    outsOnPlay: result.outsOnPlay,
    awayScore: gameState.awayScore,
    homeScore: gameState.homeScore,
    basesBefore: gameState.bases,
    basesAfter: result.newBases
  }

  return playResult;
}

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

function simulatePlayResult(atBatMatchupProbabilities: Stats): EventType {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  // Order of events to check (matches Stats interface)
  const events: EventType[] = ['K', 'BB', '1B', '2B', '3B', 'HR', 'OUT'];
  
  for (const event of events) {
    const prob = atBatMatchupProbabilities[eventTypeToEventKey(event)];
    cumulativeProbability += prob;
    if (random < cumulativeProbability) {
      return event;
    }
  }
  
  // Default to OUT if somehow we get here
  return 'OUT';
}

function initializeGameState(matchup: MatchupLineups): GameStateMLB {
  const { away, home } = matchup;

  const awayLineup = away.lineup;
  const homeLineup = home.lineup;

  const awayData = matchup.away;
  const homeData = matchup.home;

  return {
    inning: 1,
    topInning: true,
    outs: 0,
    bases: [false, false, false],  // [first, second, third]
    awayScore: 0,
    homeScore: 0,
    
    // Track batting order and current position
    awayLineup: awayLineup,
    homeLineup: homeLineup,
    awayLineupPos: 0,
    homeLineupPos: 0,

    // Bullpens
    awayBullpen: [...awayData.bullpen],
    homeBullpen: [...homeData.bullpen], 

    // Pitcher tracking
    awayPitcher: {
      id: awayData.startingPitcher.id,
      battersFaced: 0,
      recentResults: [],
    //   avgBF: awayData.startingPitcher.stats['avgBF'],
      position: 'SP'
    },
    homePitcher: {
      id: homeData.startingPitcher.id,
      battersFaced: 0,
      recentResults: [],
    //   avgBF: homeData.startingPitcher.stats['avgBF'],
      position: 'SP'
    }
  }
}

export { simulateMatchupMLB };

// ---------- Util functions ----------

function eventKeyToEventType(eventKey: keyof Stats): EventType {
  return eventKey.replace('adj_perc_', '') as EventType;
}

function eventTypeToEventKey(eventType: EventType): keyof Stats {
  return `adj_perc_${eventType}` as keyof Stats;
}
