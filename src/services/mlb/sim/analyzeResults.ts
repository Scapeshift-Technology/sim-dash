import { Player, MatchupLineups, PlayerStats, PlayResult, EventType } from "@/types/mlb";
import { 
  SimResultsMLB, 
  SidesCountsMLB, 
  OutcomeCounts,
  TeamSidesCountsMLB,
  PropsCountsMLB,
  FirstInningScoreCountsMLB,
  TotalsCountsMLB,
  GamePeriodTotalsMLB,
  AllPlayersPropsCountsMLB,
  PlayerPropsCountsMLB,
  PlayerStatPropsCountsMLB
} from "@/types/bettingResults";

// ---------- Main function ----------
function calculateSimCounts(simPlays: PlayResult[][], matchup: MatchupLineups): SimResultsMLB {
  const sidesCounts: SidesCountsMLB = calculateSidesCounts(simPlays);
  const totalsCounts: TotalsCountsMLB = calculateTotalsCounts(simPlays);
  const propsCounts: PropsCountsMLB = calculatePropsCounts(simPlays, matchup);

  return {
    sides: sidesCounts,
    totals: totalsCounts,
    props: propsCounts
  };
}

export { calculateSimCounts };

// ---------- Helper functions ----------
// ----- Sides -----

interface GameTimeframe {
  endInning?: number;  // undefined means full game
  topInningEnd?: boolean;  // true means include top of inning
}

function calculateSidesCounts(simPlays: PlayResult[][]): SidesCountsMLB {
  return {
    home: calculateSingleSideCounts(simPlays, 'home'),
    away: calculateSingleSideCounts(simPlays, 'away')
  };
}

function calculateSingleSideCounts(simPlays: PlayResult[][], side: 'home' | 'away'): TeamSidesCountsMLB {
  return {
    fullGame: calculateTimeframeCounts(simPlays, side, {}),
    firstFive: calculateTimeframeCounts(simPlays, side, { endInning: 5, topInningEnd: false })
  };
}

function calculateTimeframeCounts(
  simPlays: PlayResult[][],
  side: 'home' | 'away',
  timeframe: GameTimeframe
) {
  return {
    '0': calculateSideProbability(simPlays, side, 0, timeframe),
    '-1.5': calculateSideProbability(simPlays, side, -1.5, timeframe),
    '1.5': calculateSideProbability(simPlays, side, 1.5, timeframe)
  };
}

function calculateSideProbability(
  simPlays: PlayResult[][],
  side: 'home' | 'away',
  line: number,
  timeframe: GameTimeframe
): OutcomeCounts {
  let success = 0;
  let failure = 0;
  let push = 0;
  const totalGames = simPlays.length;

  for (const game of simPlays) {
    const { homeScore, awayScore } = getScoreAtTimeframe(game, timeframe);
    const margin = side === 'home' ? awayScore - homeScore : homeScore - awayScore;
    
    if (margin < line) {
      success++;
    } else if (margin > line) {
      failure++;
    } else if (margin === line) {
      push++;
    }
  }

  return {
    success: success,
    failure: failure,
    push: push,
    total: totalGames
  };
}

function getScoreAtTimeframe(plays: PlayResult[], timeframe: GameTimeframe): { homeScore: number, awayScore: number } {
  if (!timeframe.endInning) {
    // Full game - use last play's score
    const lastPlay = plays[plays.length - 1];
    return {
      homeScore: lastPlay.homeScore + (!lastPlay.topInning ? lastPlay.runsOnPlay : 0),
      awayScore: lastPlay.awayScore + (lastPlay.topInning ? lastPlay.runsOnPlay : 0),
    };
  }

  // Find the last play before or at the specified inning
  for (let i = plays.length - 1; i >= 0; i--) {
    const play = plays[i];
    if (play.inning < timeframe.endInning || 
        (play.inning === timeframe.endInning && 
         (!timeframe.topInningEnd || !play.topInning))) {
      return {
        homeScore: play.homeScore + (!play.topInning ? play.runsOnPlay : 0),
        awayScore: play.awayScore + (play.topInning ? play.runsOnPlay : 0),
      };
    }
  }

  // Shouldn't get here if plays array is valid
  console.error('getScoreAtTimeframe: No play found at or before specified inning');
  return { homeScore: 0, awayScore: 0 };
}

// ----- Props -----

function calculatePropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups): PropsCountsMLB {
  return {
    firstInning: calculateFirstInningScores(simPlays),
    player: calculatePlayerPropsCounts(simPlays, matchup)
  };
}

// -- First Inning --

function calculateFirstInningScores(simPlays: PlayResult[][]): FirstInningScoreCountsMLB {
  let awaySuccess = 0;
  let homeSuccess = 0;
  let overallSuccess = 0;
  const totalGames = simPlays.length;

  for (const game of simPlays) {
    let awayScored = false;
    let homeScored = false;

    // Look at plays in first inning
    for (const play of game) {
      if (play.inning > 1) break;
      
      if (play.topInning && play.runsOnPlay > 0) {
        awayScored = true;
      } else if (!play.topInning && play.runsOnPlay > 0) {
        homeScored = true;
      }
    }

    if (awayScored) awaySuccess++;
    if (homeScored) homeSuccess++;
    if (awayScored || homeScored) overallSuccess++;
  }

  return {
    away: {
      success: awaySuccess,
      failure: totalGames - awaySuccess,
      total: totalGames
    },
    home: {
      success: homeSuccess,
      failure: totalGames - homeSuccess,
      total: totalGames
    },
    overall: {
      success: overallSuccess,
      failure: totalGames - overallSuccess,
      total: totalGames
    }
  };
}

// -- Player --

interface StatConfig {
  events: EventType[];
  lines: number[];
}

interface PlayerWithTeam extends Player {
  teamName: string;
}

function calculatePlayerPropsCounts(simPlays: PlayResult[][], matchup: MatchupLineups): AllPlayersPropsCountsMLB {
  // Find players
  const players = findPlayers(matchup);

  // For each player, find all stats
  const playerStats = findAllPlayerStats(simPlays, players);

  return playerStats;
}

function findPlayerStats(simPlays: PlayResult[][], player: PlayerWithTeam): PlayerPropsCountsMLB {
  const playerStats: PlayerPropsCountsMLB = {
    playerName: player.name || '',
    teamName: player.teamName,
    stats: {}
  };

  const hittingStats = findPlayerHittingStats(simPlays, player);
  const pitchingStats = findPlayerPitchingStats(simPlays, player);

  playerStats.stats = {
    ...hittingStats,
    ...pitchingStats
  };

  return playerStats;
}

function processPlayerStats(
  simPlays: PlayResult[][],
  player: Player,
  relevantEvents: { [key: string]: StatConfig },
  playerIdField: 'batterID' | 'pitcherID'
): { [key: string]: PlayerStatPropsCountsMLB } | null {
  // Initialize arrays for each stat type
  const statArrays: { [key: string]: number[] } = {};
  Object.keys(relevantEvents).forEach(stat => {
    statArrays[stat] = new Array(simPlays.length).fill(0);
  });

  let playerFound = false;

  // Go through and get the count for each game
  simPlays.forEach((game, gameIndex) => {
    game.forEach(play => {
      if (play[playerIdField] === player.id) {
        playerFound = true;
        Object.entries(relevantEvents).forEach(([stat, { events }]) => {
          if (events.includes(play.eventType)) {
            statArrays[stat][gameIndex]++;
          }
        });
      }
    });
  });

  // If player was never found, return null
  if (!playerFound) {
    return null;
  }

  // Convert arrays to PlayerStatPropsCountsMLB format
  const statCounts: { [key: string]: PlayerStatPropsCountsMLB } = {};
  
  Object.entries(relevantEvents).forEach(([stat, { lines }]) => {
    const gameStats: PlayerStatPropsCountsMLB = {};
    
    // For each line, calculate success/failure/push counts
    lines.forEach(line => {
      let success = 0;
      let failure = 0;
      let push = 0;
      
      statArrays[stat].forEach(count => {
        if (count > line) {
          success++;
        } else if (count < line) {
          failure++;
        } else {
          push++;
        }
      });
      
      gameStats[line] = {
        success,
        failure,
        push,
        total: simPlays.length
      };
    });
    
    statCounts[stat] = gameStats;
  });

  return statCounts;
}

function findPlayerHittingStats(simPlays: PlayResult[][], player: Player): { [key: string]: PlayerStatPropsCountsMLB } {
  const relevantEvents: { [key: string]: StatConfig } = {
    'H': {
      events: ['1B', '2B', '3B', 'HR'],
      lines: [0.5, 1.5, 2.5, 3.5]
    },
    'HR': {
      events: ['HR'],
      lines: [0.5, 1.5, 2.5]
    }
  };
  
  const stats = processPlayerStats(simPlays, player, relevantEvents, 'batterID');
  return stats || {};
}

function findPlayerPitchingStats(simPlays: PlayResult[][], player: Player): { [key: string]: PlayerStatPropsCountsMLB } {
  const relevantEvents: { [key: string]: StatConfig } = {
    'K': {
      events: ['K'],
      lines: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5]
    }
  };
  
  const stats = processPlayerStats(simPlays, player, relevantEvents, 'pitcherID');
  return stats || {};
}

function findAllPlayerStats(simPlays: PlayResult[][], players: PlayerWithTeam[]): AllPlayersPropsCountsMLB {
  const allPlayerStats: AllPlayersPropsCountsMLB = {};

  for (const player of players) {
    const playerStats = findPlayerStats(simPlays, player);
    allPlayerStats[player.id] = playerStats;
  }

  return allPlayerStats;
}

/**
 * Find all players in a matchup
 * @param matchup 
 * @returns 
 */
function findPlayers(matchup: MatchupLineups): PlayerWithTeam[] {
  const players: PlayerWithTeam[] = [];

  // Starting pitchers
  players.push({ ...matchup.home.startingPitcher, teamName: matchup.home.teamName });
  players.push({ ...matchup.away.startingPitcher, teamName: matchup.away.teamName });

  // Bullpens
  players.push(...matchup.home.bullpen.map(p => ({ ...p, teamName: matchup.home.teamName })));
  players.push(...matchup.away.bullpen.map(p => ({ ...p, teamName: matchup.away.teamName })));

  // Starting lineup
  players.push(...matchup.home.lineup.map(p => ({ ...p, teamName: matchup.home.teamName })));
  players.push(...matchup.away.lineup.map(p => ({ ...p, teamName: matchup.away.teamName })));

  return players
}


// ----- Totals -----

function calculateTotalsCounts(simPlays: PlayResult[][]): TotalsCountsMLB {
  return {
    combined: calculateGamePeriodTotals(simPlays, 'combined'),
    home: calculateGamePeriodTotals(simPlays, 'home'),
    away: calculateGamePeriodTotals(simPlays, 'away')
  };
}

function calculateGamePeriodTotals(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away'
): GamePeriodTotalsMLB {
  return {
    fullGame: {
      over: calculateTotalLines(simPlays, type, 'fullGame', 'over'),
      under: calculateTotalLines(simPlays, type, 'fullGame', 'under')
    },
    firstFive: {
      over: calculateTotalLines(simPlays, type, 'firstFive', 'over'),
      under: calculateTotalLines(simPlays, type, 'firstFive', 'under')
    }
  };
}

function calculateTotalLines(
  simPlays: PlayResult[][],
  type: 'combined' | 'home' | 'away',
  period: 'fullGame' | 'firstFive',
  direction: 'over' | 'under'
): { [key: number]: OutcomeCounts } {
  const lines = getLines(type, period);
  const results: { [key: number]: OutcomeCounts } = {};

  for (const line of lines) {
    let success = 0;
    let failure = 0;
    let push = 0;
    const totalGames = simPlays.length;

    for (const game of simPlays) {
      const score = getScoreForType(game, type, period);
      
      if (direction === 'over') {
        if (score > line) success++;
        else if (score < line) failure++;
        else push++;
      } else {
        if (score < line) success++;
        else if (score > line) failure++;
        else push++;
      }
    }

    results[line] = {
      success,
      failure,
      push,
      total: totalGames
    };
  }

  return results;
}

function getLines(type: 'combined' | 'home' | 'away', period: 'fullGame' | 'firstFive'): number[] {
  if (type === 'combined') {
    if (period === 'fullGame') {
      return [6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
    } else {
      return [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5];
    }
  } else {
    if (period === 'fullGame') {
      return [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    } else {
      return [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    }
  }
}

function getScoreForType(
  plays: PlayResult[],
  type: 'combined' | 'home' | 'away',
  period: 'fullGame' | 'firstFive'
): number {
  const timeframe: GameTimeframe = period === 'fullGame' 
    ? {} 
    : { endInning: 5, topInningEnd: false };

  const { homeScore, awayScore } = getScoreAtTimeframe(plays, timeframe);

  switch (type) {
    case 'combined':
      return homeScore + awayScore;
    case 'home':
      return homeScore;
    case 'away':
      return awayScore;
  }
}

