import {
  LeagueAvgStats, 
  MatchupLineups, 
  GameMatchupProbabilities, 
  PlayResult, 
  GameStateMLB, 
  Player, 
  Stats, 
  EventType,
  MlbLiveDataApiResponse
} from "@/types/mlb";
import { SavedConfiguration } from "@/types/statCaptureConfig";
import { leagueAvgStats } from "./exampleMatchup";
import { getMatchupProbabilities } from "./probabilities";
import { initializeHomeFieldMultipliers } from "./homeFieldAdvantage";
import { calculateSimCounts } from "./analysis/analyzeResults";
import { SimResultsMLB } from "@/types/bettingResults";
import { evaluatePitchingSubstitution } from "./pitcherSubstitution";
import { simulateStolenBase, processStolenBaseResult, processBattingEvent } from "./baserunning";
import { initializeGameState } from "./gameState";
import log from "electron-log";
import { ParkEffectsResponse, UmpireEffectsResponse, BaseRunningModel } from "@/types/mlb/mlb-sim";

// ---------- MLB sim engine ----------
/**
 * Simulates a matchup between two teams
 * @param matchup - The team data for the given matchup
 * @returns The results of the matchup
 */
async function simulateMatchupMLB(
  matchup: MatchupLineups,
//   leagueAvgStats: LeagueAvgStats,
  num_games: number = 50000,
  baseRunningModel: BaseRunningModel,
  statCaptureConfig: SavedConfiguration,
  liveGameData?: MlbLiveDataApiResponse,
  parkEffects?: ParkEffectsResponse,
  umpireEffects?: UmpireEffectsResponse,
) {
  try {
    // Matchup probabilities
    await initializeHomeFieldMultipliers(); // Can we just remove this line???

    // Simulate games
    const simPlays = await simulateGames(matchup, leagueAvgStats, num_games, baseRunningModel, liveGameData, parkEffects, umpireEffects);
    // Get results
    const outputResults: SimResultsMLB = calculateSimCounts(simPlays, matchup, statCaptureConfig, liveGameData);

    return outputResults;
  } catch (error) {
    log.error('Error simulating games:', error);
  }
}

async function simulateGames(
  matchup: MatchupLineups, 
  leagueAvgStats: LeagueAvgStats, 
  num_games: number, 
  baseRunningModel: BaseRunningModel,
  liveGameData?: MlbLiveDataApiResponse, 
  parkEffects?: ParkEffectsResponse, 
  umpireEffects?: UmpireEffectsResponse
): Promise<PlayResult[][]> {
  const matchupProbabilities: GameMatchupProbabilities = getMatchupProbabilities(matchup, leagueAvgStats, parkEffects, umpireEffects);
  const allPlays: PlayResult[][] = [];

  for (let i = 0; i < num_games; i++) {
    const gamePlays = simulateGame(matchup, matchupProbabilities, baseRunningModel, liveGameData);
    allPlays.push(gamePlays);
    
    // Yield control every 100 games to allow worker termination
    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve)); // Prevent the CPU leakage bug
    }
  };

  return allPlays;
}

/**
 * 
 * @param matchup 
 * @param matchupProbabilities 
 * @returns {PlayResult[]} An array of plays that happened during the game
 */
function simulateGame(
  matchup: MatchupLineups, 
  matchupProbabilities: GameMatchupProbabilities, 
  baseRunningModel: BaseRunningModel,
  liveGameData?: MlbLiveDataApiResponse,
): PlayResult[] {
  const plays: PlayResult[] = [];
  const gameState = initializeGameState(matchup, liveGameData);

  while (true) {
    if (gameState.baseRunners[0] || gameState.baseRunners[1] || gameState.baseRunners[2]) {
      const stolenBaseResult = simulateStolenBase(gameState, matchup, baseRunningModel);
      if (stolenBaseResult) {
        const stolenBasePlay = processStolenBaseResult(stolenBaseResult, gameState);
        plays.push(stolenBasePlay);
        
        if (gameState.outs >= 3) {
          handleInningEnd(gameState);
          continue;
        }
      }
    }

    // Simulate the batting event
    const playResult = simulatePlay(gameState, matchupProbabilities, baseRunningModel);
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
      let ghostRunnerID: number;
      if (gameState.topInning) {
        const lastBatterIndex = (gameState.awayLineupPos - 1 + 9) % 9;
        ghostRunnerID = gameState.awayLineup[lastBatterIndex].id;
      } else {
        const lastBatterIndex = (gameState.homeLineupPos - 1 + 9) % 9;
        ghostRunnerID = gameState.homeLineup[lastBatterIndex].id;
      }
      gameState.baseRunners = [null, ghostRunnerID, null]; // Put ghost runner on 2B
    } else {
      gameState.baseRunners = [null, null, null];
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

  gameState.baseRunners = playResult.baseRunnersAfter;
  gameState.outs += playResult.outsOnPlay;
}

function simulatePlay(gameState: GameStateMLB, matchupProbabilities: GameMatchupProbabilities, baseRunningModel: BaseRunningModel): PlayResult {
  const { topInning } = gameState;
  let atBatMatchupProbabilities: Stats;
  let currentBatter: Player;
  let currentPitcherID: number;

  const awayLineupPos = gameState.awayLineupPos;
  const homeLineupPos = gameState.homeLineupPos;

  try {
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
    const result = processBattingEvent(playEvent, gameState, baseRunningModel);
    
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
      baseRunnersBefore: [...gameState.baseRunners],
      baseRunnersAfter: result.newBaseRunners
    }
  
    return playResult;
  } catch (error) {
    log.error('Error simulating play:', error);
    log.info('AWAY LINEUP POS ON ERROR:', awayLineupPos)
    log.info('HOME LINEUP POS ON ERROR:', homeLineupPos)
    throw error;
  }


}

function simulatePlayResult(atBatMatchupProbabilities: Stats): EventType {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  // Order of batting events to check (excludes SB/CS which are handled separately)
  const battingEvents: EventType[] = ['K', 'BB', '1B', '2B', '3B', 'HR', 'OUT'];
  
  for (const event of battingEvents) {
    const prob = atBatMatchupProbabilities[eventTypeToEventKey(event)];
    cumulativeProbability += prob;
    if (random < cumulativeProbability) {
      return event;
    }
  }
  
  // Default to OUT if somehow we get here
  return 'OUT';
}

export { simulateMatchupMLB };

// ---------- Util functions ----------

function eventKeyToEventType(eventKey: keyof Stats): EventType {
  return eventKey.replace('adj_perc_', '') as EventType;
}

function eventTypeToEventKey(eventType: EventType): keyof Stats {
  return `adj_perc_${eventType}` as keyof Stats;
}
