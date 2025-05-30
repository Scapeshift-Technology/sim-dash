import { 
  MlbLiveDataApiTeamBoxscorePlayerStatsPitching, TeamLineup, MlbLiveDataApiResponse, Player, GameStatePitcher, 
  Position, TeamType, GameStateMLB, MatchupLineups
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

  const awayBullpen = createCurrentBullpen(awayTeam, liveGameData.liveData.boxscore.teams.away.bullpen, liveGameData.liveData.boxscore.teams.away.pitchers);
  const homeBullpen = createCurrentBullpen(homeTeam, liveGameData.liveData.boxscore.teams.home.bullpen, liveGameData.liveData.boxscore.teams.home.pitchers);

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

function findPitcherById(teamData: TeamLineup | ReducedTeamLineup, playerId: number): Player | undefined {
  return teamData.bullpen.find(p => p.id === playerId) || 
         (teamData.startingPitcher.id === playerId ? teamData.startingPitcher : undefined) ||
         (teamData.unavailablePitchers.find(p => p.id === playerId) ? teamData.unavailablePitchers.find(p => p.id === playerId) : undefined);
}

export function createCurrentLineup(teamData: TeamLineup | ReducedTeamLineup, battingOrder: number[]): Player[] | ReducedPlayer[] {
  return battingOrder.map(id => {
    const player = findHitterById(teamData, id);
    if (!player) {
      throw new Error(`Could not find hitter with ID ${id} on this team's TeamLineup`);
    }
    return player;
  });
}

export function createCurrentBench(teamData: TeamLineup, bench: number[]): Player[] {
  return bench.map(id => {
    const player = findHitterById(teamData, id);
    if (!player) {
      throw new Error(`Could not find hitter with ID ${id} on this team's TeamLineup`);
    }
    return player;
  });
}

export function createCurrentUnavailableHitters(teamData: TeamLineup, liveGameData: MlbLiveDataApiResponse, teamType: TeamType): Player[] {
  // Our user's unavailable hitters(filtered to make sure they are still out of game)
  const allBatters = liveGameData.liveData.boxscore.teams[teamType].batters;
  const filteredUnavailableHitters = teamData.unavailableHitters.filter(player => !allBatters.includes(player.id));

  // Batters taken out already
  const battingOrder = liveGameData.liveData.boxscore.teams[teamType].battingOrder;
  const allPitchers = liveGameData.liveData.boxscore.teams[teamType].pitchers;
  const usedBatters = allBatters.filter(id => !battingOrder.includes(id) && !allPitchers.includes(id));
  const usedUnavailableHitters = usedBatters.map(id => {
    const player = findHitterById(teamData, id);
    if (!player) {
      throw new Error(`Could not find hitter with ID ${id} on this team's TeamLineup`);
    }
    return player;
  });

  return [...filteredUnavailableHitters, ...usedUnavailableHitters];
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

export function createCurrentStartingPitcher(teamData: TeamLineup, liveGameData: MlbLiveDataApiResponse, teamType: TeamType): Player {
  const pitcherId = liveGameData.liveData.boxscore.teams[teamType].pitchers[0];
  const startingPitcher = findPitcherById(teamData, pitcherId);
  if (!startingPitcher) {
    throw new Error(`Could not find starting pitcher with ID ${pitcherId} on this team's TeamLineup`);
  }
  return startingPitcher;
}

export function createCurrentBullpen(teamData: TeamLineup | ReducedTeamLineup, bullpen: number[], usedPitchers: number[]): Player[] | ReducedPlayer[] {
  const startingPitcherId = usedPitchers[0];
  const mostRecentPitcherId = usedPitchers[usedPitchers.length - 1];
  const usedBullpen = teamData.bullpen.filter(player => bullpen.includes(player.id) || (player.id !== startingPitcherId && player.id === mostRecentPitcherId)); // Overlap of our user's bullpen and the gamedata's bullpen
  return usedBullpen;
}

export function createCurrentUnavailablePitchers(teamData: TeamLineup, liveGameData: MlbLiveDataApiResponse, teamType: TeamType): Player[] {
  // Unavailable from game usage
  const usedPitchers = liveGameData.liveData.boxscore.teams[teamType].pitchers;
  const startingPitcherId = usedPitchers[0];
  const currentPitcherId = usedPitchers[usedPitchers.length - 1];
  const usedUnavailablePitchers = usedPitchers.filter(id => id !== startingPitcherId && id !== currentPitcherId);
  const usedUnavailablePitchersPlayersList = usedUnavailablePitchers.map(id => {
    const player = findPitcherById(teamData, id);
    if (!player) {
      throw new Error(`Could not find pitcher with ID ${id} on this team's TeamLineup`);
    }
    return player;
  });

  // Unavailable by designation
  const teamUnavailablePitchers = teamData.unavailablePitchers;
  const filteredTeamUnavailablePitchers = teamUnavailablePitchers.filter(player => !usedUnavailablePitchers.includes(player.id));

  // Return
  return [...filteredTeamUnavailablePitchers, ...usedUnavailablePitchersPlayersList];
}

/**
 * Enhanced conversion that combines GameStateMLB with MatchupLineups for more complete data.
 * This provides better team information, bench players, and other details not available in GameStateMLB alone.
 * 
 * REMAINING LIMITATIONS:
 * - balls/strikes: Set to 0 (not tracked in GameStateMLB)
 * - Hits/Errors: Set to 0 (not tracked in GameStateMLB)
 * - Innings array: Empty (no inning-by-inning data in GameStateMLB)
 * - Detailed player stats: Minimal placeholder data only
 * - Plays data: Empty (no play-by-play history in GameStateMLB)
 * - Base runners: Shows presence but no specific player details
 */
export function convertGameStateWithLineupsToLiveData(
  gameState: GameStateMLB,
  lineups: MatchupLineups,
  awayTeamName: string,
  homeTeamName: string
): MlbLiveDataApiResponse {
  
  // Helper to convert inning number to ordinal
  const getInningOrdinal = (inning: number): string => {
    const suffix = inning === 1 ? 'st' : inning === 2 ? 'nd' : inning === 3 ? 'rd' : 'th';
    return `${inning}${suffix}`;
  };

  // Helper to find player name by ID from lineups (more complete than gameState)
  const findPlayerName = (playerId: number): string => {
    // Check all possible player locations in lineups
    const allAwayPlayers = [
      ...lineups.away.lineup,
      ...lineups.away.bench,
      ...lineups.away.bullpen,
      lineups.away.startingPitcher,
      ...lineups.away.unavailableHitters,
      ...lineups.away.unavailablePitchers
    ];
    
    const allHomePlayers = [
      ...lineups.home.lineup,
      ...lineups.home.bench,
      ...lineups.home.bullpen,
      lineups.home.startingPitcher,
      ...lineups.home.unavailableHitters,
      ...lineups.home.unavailablePitchers
    ];
    
    const allPlayers = [...allAwayPlayers, ...allHomePlayers];
    const player = allPlayers.find((p: Player) => p.id === playerId);
    return player?.name || `Player ${playerId}`;
  };

  // Helper to find player handedness by ID from lineups
  const findPlayerHandedness = (playerId: number): { batSide: string; pitchHand: string } => {
    const allAwayPlayers = [
      ...lineups.away.lineup,
      ...lineups.away.bench,
      ...lineups.away.bullpen,
      lineups.away.startingPitcher,
      ...lineups.away.unavailableHitters,
      ...lineups.away.unavailablePitchers
    ];
    
    const allHomePlayers = [
      ...lineups.home.lineup,
      ...lineups.home.bench,
      ...lineups.home.bullpen,
      lineups.home.startingPitcher,
      ...lineups.home.unavailableHitters,
      ...lineups.home.unavailablePitchers
    ];
    
    const allPlayers = [...allAwayPlayers, ...allHomePlayers];
    const player = allPlayers.find((p: Player) => p.id === playerId);
    
    return {
      batSide: player?.battingSide || 'R',
      pitchHand: player?.pitchingSide || 'R'
    };
  };

  // Determine current pitcher and batter info based on inning state
  const inningOver = gameState.outs === 3;
  const isTopInningAdjusted = inningOver ? !gameState.topInning : gameState.topInning;

  // Determine current pitcher and batter info
  const currentPitcher = isTopInningAdjusted ? gameState.homePitcher : gameState.awayPitcher;
  const sittingPitcher = isTopInningAdjusted ? gameState.awayPitcher : gameState.homePitcher;
  const battingTeam = isTopInningAdjusted ? gameState.awayLineup : gameState.homeLineup;
  const battingPos = isTopInningAdjusted ? gameState.awayLineupPos : gameState.homeLineupPos;
  const currentBatter = battingTeam[battingPos];
  const onDeckBatter = battingTeam[(battingPos + 1) % 9];
  const sittingBatterPos = isTopInningAdjusted ? gameState.homeLineupPos : gameState.awayLineupPos;

  // Get all available players for batters/bench arrays
  const awayAllBatters = [
    ...gameState.awayLineup.map((p: Player) => p.id),
    ...lineups.away.bench.map((p: Player) => p.id)
  ];
  
  const homeAllBatters = [
    ...gameState.homeLineup.map((p: Player) => p.id),
    ...lineups.home.bench.map((p: Player) => p.id)
  ];

  // Get all pitchers (current + available bullpen)
  const awayAllPitchers = [
    gameState.awayPitcher.id,
    ...gameState.awayBullpen.map((p: Player) => p.id)
  ];
  
  const homeAllPitchers = [
    gameState.homePitcher.id,
    ...gameState.homeBullpen.map((p: Player) => p.id)
  ];

  // Create player stats objects for current pitchers
  const awayPitcherHandedness = findPlayerHandedness(gameState.awayPitcher.id);
  const awayPitcherStats = {
    [`ID${gameState.awayPitcher.id}`]: {
      person: {
        id: gameState.awayPitcher.id,
        fullName: findPlayerName(gameState.awayPitcher.id),
        batSide: {
          code: awayPitcherHandedness.batSide as 'L' | 'R' | 'S'
        },
        pitchHand: {
          code: awayPitcherHandedness.pitchHand as 'L' | 'R' | 'S'
        }
      },
      gameStatus: {
        isOnBench: false,
        isSubstitute: false
      },
      stats: {
        pitching: {
          gamesStarted: gameState.awayPitcher.position === 'SP' ? 1 : 0,
          battersFaced: gameState.awayPitcher.battersFaced
        }
      }
    }
  };

  const homePitcherHandedness = findPlayerHandedness(gameState.homePitcher.id);
  const homePitcherStats = {
    [`ID${gameState.homePitcher.id}`]: {
      person: {
        id: gameState.homePitcher.id,
        fullName: findPlayerName(gameState.homePitcher.id),
        batSide: {
          code: homePitcherHandedness.batSide as 'L' | 'R' | 'S'
        },
        pitchHand: {
          code: homePitcherHandedness.pitchHand as 'L' | 'R' | 'S'
        }
      },
      gameStatus: {
        isOnBench: false,
        isSubstitute: false
      },
      stats: {
        pitching: {
          gamesStarted: gameState.homePitcher.position === 'SP' ? 1 : 0,
          battersFaced: gameState.homePitcher.battersFaced
        }
      }
    }
  };

  return {
    gameData: {
      teams: {
        away: {
          name: awayTeamName
        },
        home: {
          name: homeTeamName
        }
      },
      status: {
        abstractGameState: "Live" as const
      }
    },
    liveData: {
      boxscore: {
        teams: {
          away: {
            battingOrder: gameState.awayLineup.map((p: Player) => p.id),
            batters: awayAllBatters, // Include bench players
            pitchers: awayAllPitchers, // Include available bullpen
            bullpen: gameState.awayBullpen.map((p: Player) => p.id),
            bench: lineups.away.bench.map((p: Player) => p.id), // Real bench data from lineups
            players: awayPitcherStats // Include pitcher stats from gameState
          },
          home: {
            battingOrder: gameState.homeLineup.map((p: Player) => p.id),
            batters: homeAllBatters, // Include bench players
            pitchers: homeAllPitchers, // Include available bullpen
            bullpen: gameState.homeBullpen.map((p: Player) => p.id),
            bench: lineups.home.bench.map((p: Player) => p.id), // Real bench data from lineups
            players: homePitcherStats // Include pitcher stats from gameState
          }
        }
      },
      linescore: {
        // Game state basics
        balls: 0, // LIMITATION: Not tracked in GameStateMLB
        strikes: 0, // LIMITATION: Not tracked in GameStateMLB
        outs: gameState.outs,
        currentInning: gameState.inning,
        currentInningOrdinal: getInningOrdinal(gameState.inning),
        inningHalf: gameState.topInning ? "Top" : "Bottom",
        
        // Innings data
        innings: [], // LIMITATION: No inning-by-inning data in GameStateMLB
        
        // Team scores
        teams: {
          away: {
            runs: gameState.awayScore,
            hits: 0, // LIMITATION: Not tracked in GameStateMLB
            errors: 0 // LIMITATION: Not tracked in GameStateMLB
          },
          home: {
            runs: gameState.homeScore,
            hits: 0, // LIMITATION: Not tracked in GameStateMLB
            errors: 0 // LIMITATION: Not tracked in GameStateMLB
          }
        },

        // Current game situation
        offense: {
          battingOrder: battingPos + 1, // Convert 0-based to 1-based
          batter: {
            id: currentBatter.id,
            fullName: currentBatter.name || `Player ${currentBatter.id}`
          },
          onDeck: {
            id: onDeckBatter.id,
            fullName: onDeckBatter.name || `Player ${onDeckBatter.id}`
          },
          pitcher: {
            id: sittingPitcher.id,
            fullName: findPlayerName(sittingPitcher.id)
          },
          // Base runners - simplified representation
          first: gameState.bases[0] ? { 
            id: 999999, // LIMITATION: Don't know which specific player is on base
            fullName: "Runner on 1st" 
          } : undefined,
          second: gameState.bases[1] ? { 
            id: 999998, // LIMITATION: Don't know which specific player is on base
            fullName: "Runner on 2nd" 
          } : undefined,
          third: gameState.bases[2] ? { 
            id: 999997, // LIMITATION: Don't know which specific player is on base
            fullName: "Runner on 3rd" 
          } : undefined
        },
        defense: {
          battingOrder: sittingBatterPos + 1,
          pitcher: {
            id: currentPitcher.id,
            fullName: findPlayerName(currentPitcher.id)
          }
        }
      },
      plays: {
        allPlays: [], // LIMITATION: No play history in GameStateMLB
        currentPlay: {
          matchup: {
            pitcher: {
              id: currentPitcher.id,
              fullName: findPlayerName(currentPitcher.id)
            },
            batter: {
              id: currentBatter.id,
              fullName: currentBatter.name || `Player ${currentBatter.id}`
            }
          },
          // LIMITATION: Following properties not available in GameStateMLB, using defaults
          result: {
            eventType: "field_out" as const, // Placeholder
            rbi: 0,
            awayScore: gameState.awayScore,
            homeScore: gameState.homeScore
          },
          about: {
            inning: gameState.inning,
            halfInning: gameState.topInning ? "top" : "bottom",
            isTopInning: gameState.topInning,
            outs: gameState.outs
          },
          count: {
            outs: gameState.outs,
            strikes: 0, // LIMITATION: Not tracked in GameStateMLB
            balls: 0 // LIMITATION: Not tracked in GameStateMLB
          },
          runners: [] // LIMITATION: No detailed runner movement(yet) in GameStateMLB
        }
      }
    }
  };
}

