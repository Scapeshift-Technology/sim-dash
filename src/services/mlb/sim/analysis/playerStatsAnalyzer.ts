import { Player, PlayResult, EventType, MatchupLineups } from "@/types/mlb";
import { PlayerPropsCountsMLB, PlayerStatPropsCountsMLB, AllPlayersPropsCountsMLB } from "@/types/bettingResults";

interface StatConfig {
  events: EventType[];
  lines: number[];
}

interface PlayerWithTeam extends Player {
  teamName: string;
}

export function findPlayerStats(simPlays: PlayResult[][], player: PlayerWithTeam): PlayerPropsCountsMLB {
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

export function findAllPlayerStats(simPlays: PlayResult[][], players: PlayerWithTeam[]): AllPlayersPropsCountsMLB {
  const allPlayerStats: AllPlayersPropsCountsMLB = {};

  for (const player of players) {
    const playerStats = findPlayerStats(simPlays, player);
    allPlayerStats[player.id] = playerStats;
  }

  return allPlayerStats;
}

export function findPlayers(matchup: MatchupLineups): PlayerWithTeam[] {
  const players: PlayerWithTeam[] = [];

  // Starting pitchers
  players.push({ ...matchup.home.startingPitcher, teamName: matchup.home.teamName });
  players.push({ ...matchup.away.startingPitcher, teamName: matchup.away.teamName });

  // Bullpens
  players.push(...matchup.home.bullpen.map((p: Player) => ({ ...p, teamName: matchup.home.teamName })));
  players.push(...matchup.away.bullpen.map((p: Player) => ({ ...p, teamName: matchup.away.teamName })));

  // Starting lineup
  players.push(...matchup.home.lineup.map((p: Player) => ({ ...p, teamName: matchup.home.teamName })));
  players.push(...matchup.away.lineup.map((p: Player) => ({ ...p, teamName: matchup.away.teamName })));

  return players;
} 