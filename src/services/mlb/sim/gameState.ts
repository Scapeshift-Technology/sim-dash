import { 
  TeamLineup,
  Player, 
  MatchupLineups, 
  MlbLiveDataApiResponse, 
  GameStatePitcher, 
  Position, 
  GameStateMLB,
  MlbLiveDataApiTeamBoxscorePlayerStatsPitching
} from "@/types/mlb";

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

function findHitterById(teamData: TeamLineup, playerId: number): Player | undefined {
  return teamData.lineup.find(p => p.id === playerId) || 
    teamData.bench.find(p => p.id === playerId);
}

// Helper function to create lineup for either team
function createCurrentLineup(teamData: TeamLineup, battingOrder: number[]): Player[] {
  return battingOrder.map(id => {
    const player = findHitterById(teamData, id);
    if (!player) {
      throw new Error(`Could not find player with ID ${id} in either lineup or bench`);
    }
    return player;
  });
}

function findPitcherById(teamData: TeamLineup, playerId: number): Player | undefined {
  return teamData.bullpen.find(p => p.id === playerId) || 
         (teamData.startingPitcher.id === playerId ? teamData.startingPitcher : undefined);
}

function createCurrentBullpen(teamData: TeamLineup, bullpen: number[]): Player[] {
  return teamData.bullpen.filter(player => bullpen.includes(player.id));
}

function findCurrentPitcher(lineups: TeamLineup, liveGameData: MlbLiveDataApiResponse, isHome: boolean): GameStatePitcher {
  const isTopInning = liveGameData.liveData.linescore.inningHalf.toLowerCase().startsWith('t');
  let pitcherId: number;
  if ((isHome && isTopInning) || (!isHome && !isTopInning)) {
    pitcherId = liveGameData.liveData.linescore.defense.pitcher.id;
  } else {
    pitcherId = liveGameData.liveData.linescore.offense.pitcher.id;
  }

  const pitcher = findPitcherById(lineups, pitcherId);
  if (!pitcher) {
    throw new Error(`Could not find pitcher with ID ${pitcherId} starting or in bullpen`);
  }

  const homeAwayString = isHome ? 'home' : 'away';
  const pitcherStats: MlbLiveDataApiTeamBoxscorePlayerStatsPitching = liveGameData.liveData.boxscore.teams[homeAwayString].players[`ID${pitcherId}`].stats.pitching;
  
  // const allPlays = liveGameData.liveData.plays.allPlays;
  // const pitcherPlays = allPlays.filter(play => play.matchup.pitcher.id === pitcherId);
  // const lastFewPlays = pitcherPlays.slice(-5);
  // const lastFewResults = lastFewPlays.map(play => play.result.eventType);
  // const recentResults: EventType[] = lastFewResults.map(mlbEventToSimEvent);
  

  return {
    id: pitcherId,
    battersFaced: pitcherStats.battersFaced,
    recentResults: [], // Recent results doesn't factor in yet
    position: (pitcherStats.gamesStarted > 0 ? 'SP' : 'RP') as Position
  }
};

function createGameStateFromLiveData(matchup: MatchupLineups, liveGameData: MlbLiveDataApiResponse): GameStateMLB {
  const bases = [
    !!liveGameData.liveData.linescore.offense.first,
    !!liveGameData.liveData.linescore.offense.second,
    !!liveGameData.liveData.linescore.offense.third,
  ];

  const isTopInning = liveGameData.liveData.linescore.inningHalf.toLowerCase().startsWith('t');

  const awayLineup = createCurrentLineup(matchup.away, liveGameData.liveData.boxscore.teams.away.battingOrder);
  const homeLineup = createCurrentLineup(matchup.home, liveGameData.liveData.boxscore.teams.home.battingOrder);

  const awayBullpen = createCurrentBullpen(matchup.away, liveGameData.liveData.boxscore.teams.away.bullpen);
  const homeBullpen = createCurrentBullpen(matchup.home, liveGameData.liveData.boxscore.teams.home.bullpen);

  const awayPitcher = findCurrentPitcher(matchup.away, liveGameData, false);
  const homePitcher = findCurrentPitcher(matchup.home, liveGameData, true);

  const gameState = {
    inning: liveGameData.liveData.linescore.currentInning,
    topInning: isTopInning,
    outs: liveGameData.liveData.linescore.outs,
    bases: bases,
    awayScore: liveGameData.liveData.linescore.teams.away.runs,
    homeScore: liveGameData.liveData.linescore.teams.home.runs,

    // Batting order and current position
    awayLineup: awayLineup,
    homeLineup: homeLineup,
    awayLineupPos: isTopInning ? liveGameData.liveData.linescore.offense.battingOrder - 1 : liveGameData.liveData.linescore.defense.battingOrder - 1,
    homeLineupPos: isTopInning ? liveGameData.liveData.linescore.defense.battingOrder - 1 : liveGameData.liveData.linescore.offense.battingOrder - 1,

    // Bullpens
    awayBullpen: awayBullpen,
    homeBullpen: homeBullpen,

    // Pitcher tracking
    awayPitcher: awayPitcher,
    homePitcher: homePitcher
  }
  return gameState;
}

