import {
  MatchupLineups, 
  MlbLiveDataApiResponse,
  GameStateMLB
} from "@/types/mlb";
import { createGameStateFromLiveDataHelper } from "../utils/gameState";

// ---------- Main function ----------

function initializeGameState(matchup: MatchupLineups, liveGameData?: MlbLiveDataApiResponse): GameStateMLB {
  if (liveGameData) {
    return createGameStateFromLiveData(matchup, liveGameData);
  }
  
  return createGameStateForNewGame(matchup);
};

export { initializeGameState };

// ---------- Helper functions ----------

function createGameStateForNewGame(matchup: MatchupLineups): GameStateMLB {
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

function createGameStateFromLiveData(matchup: MatchupLineups, liveGameData: MlbLiveDataApiResponse): GameStateMLB {
  return createGameStateFromLiveDataHelper(matchup.away, matchup.home, liveGameData) as GameStateMLB;
}

