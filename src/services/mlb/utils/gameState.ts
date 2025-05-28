import { 
  MlbLiveDataApiTeamBoxscorePlayerStatsPitching, TeamLineup, MlbLiveDataApiResponse, Player, GameStatePitcher, 
  Position 
} from "@/types/mlb";
import { ReducedGameStateMLB, ReducedMatchupLineups, ReducedPlayer, ReducedTeamLineup } from "@/types/simHistory";

// ---------- Functions ----------

export function createReducedGameStateFromLiveData(lineups: ReducedMatchupLineups, liveGameData: MlbLiveDataApiResponse): ReducedGameStateMLB {
  return createGameStateFromLiveDataHelper(lineups.away, lineups.home, liveGameData, true) as ReducedGameStateMLB;
}

export function createGameStateFromLiveDataHelper<T extends TeamLineup | ReducedTeamLineup>(
  awayTeam: T, 
  homeTeam: T, 
  liveGameData: MlbLiveDataApiResponse,
  isReduced: boolean = false
) {
  const bases = [
    !!liveGameData.liveData.linescore.offense.first,
    !!liveGameData.liveData.linescore.offense.second,
    !!liveGameData.liveData.linescore.offense.third,
  ];

  const awayPitcher = findCurrentPitcher(awayTeam, liveGameData, false);
  const homePitcher = findCurrentPitcher(homeTeam, liveGameData, true);

  // Base game state that both full and reduced versions need
  const isTopInning = liveGameData.liveData.linescore.inningHalf.toLowerCase().startsWith('t');
  const inningOver = liveGameData.liveData.linescore.outs === 3;
  const isTopInningAdjusted = inningOver ? !isTopInning : isTopInning;
  
  const inning = inningOver && isTopInningAdjusted ? liveGameData.liveData.linescore.currentInning + 1 : liveGameData.liveData.linescore.currentInning;

  const baseGameState = {
    inning: inning,
    topInning: isTopInningAdjusted,
    outs: inningOver ? 0 : liveGameData.liveData.linescore.outs,
    bases: inningOver ? [false, false, false] : bases,
    awayScore: liveGameData.liveData.linescore.teams.away.runs,
    homeScore: liveGameData.liveData.linescore.teams.home.runs,
    awayPitcher: awayPitcher,
    homePitcher: homePitcher
  };

  if (isReduced) {
    return baseGameState;
  }

  // For full game state, include lineup information
  const awayLineup = createCurrentLineup(awayTeam, liveGameData.liveData.boxscore.teams.away.battingOrder);
  const homeLineup = createCurrentLineup(homeTeam, liveGameData.liveData.boxscore.teams.home.battingOrder);

  const awayBullpen = createCurrentBullpen(awayTeam, liveGameData.liveData.boxscore.teams.away.bullpen);
  const homeBullpen = createCurrentBullpen(homeTeam, liveGameData.liveData.boxscore.teams.home.bullpen);

  return {
    ...baseGameState,

    // Batting order and current position
    awayLineup: awayLineup,
    homeLineup: homeLineup,
    awayLineupPos: isTopInning ? liveGameData.liveData.linescore.offense.battingOrder - 1 : liveGameData.liveData.linescore.defense.battingOrder - 1,
    homeLineupPos: isTopInning ? liveGameData.liveData.linescore.defense.battingOrder - 1 : liveGameData.liveData.linescore.offense.battingOrder - 1,

    // Bullpens
    awayBullpen: awayBullpen,
    homeBullpen: homeBullpen,
  };
}

function findHitterById(teamData: TeamLineup | ReducedTeamLineup, playerId: number): Player | undefined {
  return teamData.lineup.find(p => p.id === playerId) || 
    teamData.bench.find(p => p.id === playerId) ||
    teamData.unavailableHitters.find(p => p.id === playerId);
}

// Helper function to create lineup for either team
export function createCurrentLineup(teamData: TeamLineup | ReducedTeamLineup, battingOrder: number[]): Player[] | ReducedPlayer[] {
  return battingOrder.map(id => {
    const player = findHitterById(teamData, id);
    if (!player) {
      throw new Error(`Could not find player with ID ${id} in either lineup or bench`);
    }
    return player;
  });
}

function findPitcherById(teamData: TeamLineup | ReducedTeamLineup, playerId: number): Player | undefined {
  return teamData.bullpen.find(p => p.id === playerId) || 
         (teamData.startingPitcher.id === playerId ? teamData.startingPitcher : undefined) ||
         (teamData.unavailablePitchers.find(p => p.id === playerId) ? teamData.unavailablePitchers.find(p => p.id === playerId) : undefined);
}

export function createCurrentBullpen(teamData: TeamLineup | ReducedTeamLineup, bullpen: number[]): Player[] | ReducedPlayer[] {
  return teamData.bullpen.filter(player => bullpen.includes(player.id));
}

export function findCurrentPitcher(lineups: TeamLineup | ReducedTeamLineup, liveGameData: MlbLiveDataApiResponse, isHome: boolean): GameStatePitcher {
  const inningOver = liveGameData.liveData.linescore.outs === 3;
  const isTopInning = liveGameData.liveData.linescore.inningHalf.toLowerCase().startsWith('t')
  const isTopInningAdjusted = inningOver ? !isTopInning : isTopInning;
  
  let pitcherId: number;
  if ((isHome && isTopInningAdjusted) || (!isHome && !isTopInningAdjusted)) {
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


