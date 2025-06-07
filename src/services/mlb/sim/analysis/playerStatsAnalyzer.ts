import { Player, PlayResult, EventType, MatchupLineups } from "@/types/mlb";
import { PlayerPropsCountsMLB, PlayerStatPropsCountsMLB, AllPlayersPropsCountsMLB } from "@/types/bettingResults";
import { SavedConfiguration } from "@/types/statCaptureConfig";

// ---------- Types ----------

type StatType = 'EVENT_COUNT' | 'VALUE_SUM';

interface StatConfig {
  type: StatType;
  events?: EventType[];  // for EVENT_COUNT
  valueField?: keyof PlayResult;  // for VALUE_SUM (Ex: 'runsOnPlay' for RBI)
  lines: number[];
}

interface PlayerWithTeam extends Player {
  teamName: string;
}

// ---------- Functions ----------

export function findPlayerStats(simPlays: PlayResult[][], player: PlayerWithTeam, statCaptureConfig: SavedConfiguration): PlayerPropsCountsMLB {
  const playerStats: PlayerPropsCountsMLB = {
    playerName: player.name || '',
    teamName: player.teamName,
    stats: {}
  };

  const hittingStats = findPlayerHittingStats(simPlays, player, statCaptureConfig);
  const pitchingStats = findPlayerPitchingStats(simPlays, player, statCaptureConfig);

  playerStats.stats = {
    ...hittingStats,
    ...pitchingStats
  };

  return playerStats;
}

function processEventCountStats(
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
        Object.entries(relevantEvents).forEach(([stat, config]) => {
          if (config.type === 'EVENT_COUNT' && config.events && config.events.includes(play.eventType)) {
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
  
  Object.entries(relevantEvents).forEach(([stat, config]) => {
    if (config.type !== 'EVENT_COUNT') return;
    
    const gameStats: PlayerStatPropsCountsMLB = {};
    
    // For each line, calculate success/failure/push counts
    config.lines.forEach(line => {
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

function processValueSumStats(
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

  // Go through and sum the values for each game
  simPlays.forEach((game, gameIndex) => {
    game.forEach(play => {
      if (play[playerIdField] === player.id) {
        playerFound = true;
        Object.entries(relevantEvents).forEach(([stat, config]) => {
          if (config.type === 'VALUE_SUM' && config.valueField) {
            const value = play[config.valueField] as number;
            statArrays[stat][gameIndex] += value;
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
  
  Object.entries(relevantEvents).forEach(([stat, config]) => {
    if (config.type !== 'VALUE_SUM') return;
    
    const gameStats: PlayerStatPropsCountsMLB = {};
    
    // For each line, calculate success/failure/push counts
    config.lines.forEach(line => {
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

function processPlayerStats(
  simPlays: PlayResult[][],
  player: Player,
  relevantEvents: { [key: string]: StatConfig },
  playerIdField: 'batterID' | 'pitcherID'
): { [key: string]: PlayerStatPropsCountsMLB } | null {
  const eventCountStats = processEventCountStats(simPlays, player, relevantEvents, playerIdField);
  const valueSumStats = processValueSumStats(simPlays, player, relevantEvents, playerIdField);

  const combinedStats = { ...eventCountStats, ...valueSumStats };
  
  return Object.keys(combinedStats).length > 0 ? combinedStats : null;
}

function findPlayerHittingStats(simPlays: PlayResult[][], player: Player, statCaptureConfig: SavedConfiguration): { [key: string]: PlayerStatPropsCountsMLB } {
  const hitterStatConfigs: { [key: string]: { type: StatType; events?: EventType[]; valueField?: keyof PlayResult } } = {
    'H': { type: 'EVENT_COUNT', events: ['1B', '2B', '3B', 'HR'] },
    'HR': { type: 'EVENT_COUNT', events: ['HR'] },
    'RBI': { type: 'VALUE_SUM', valueField: 'runsOnPlay' }
  };

  const relevantEvents: { [key: string]: StatConfig } = {};

  // Filter propsOU for hitter events and convert to StatConfig
  statCaptureConfig.propsOU.forEach(propConfig => {
    const propName = propConfig.prop;
    
    if (hitterStatConfigs.hasOwnProperty(propName)) {
      if (!relevantEvents[propName]) {
        const config = hitterStatConfigs[propName];
        relevantEvents[propName] = {
          type: config.type,
          events: config.events,
          valueField: config.valueField,
          lines: []
        };
      }
      
      if (!relevantEvents[propName].lines.includes(propConfig.strike)) {
        relevantEvents[propName].lines.push(propConfig.strike);
      }
    }
  });

  // Sort lines for each stat
  Object.keys(relevantEvents).forEach(stat => {
    relevantEvents[stat].lines.sort((a, b) => a - b);
  });
  
  const stats = processPlayerStats(simPlays, player, relevantEvents, 'batterID');
  return stats || {};
}

function findPlayerPitchingStats(simPlays: PlayResult[][], player: Player, statCaptureConfig: SavedConfiguration): { [key: string]: PlayerStatPropsCountsMLB } {
  const pitcherStatConfigs: { [key: string]: { type: StatType; events?: EventType[]; valueField?: keyof PlayResult } } = {
    'Ks': { type: 'EVENT_COUNT', events: ['K'] }
  };

  const relevantEvents: { [key: string]: StatConfig } = {};

  statCaptureConfig.propsOU.forEach(propConfig => {
    const propName = propConfig.prop;
    
    if (pitcherStatConfigs.hasOwnProperty(propName)) {
      if (!relevantEvents[propName]) {
        const config = pitcherStatConfigs[propName];
        relevantEvents[propName] = {
          type: config.type,
          events: config.events,
          valueField: config.valueField,
          lines: []
        };
      }
      
      if (!relevantEvents[propName].lines.includes(propConfig.strike)) {
        relevantEvents[propName].lines.push(propConfig.strike);
      }
    }
  });

  // Sort lines for each stat
  Object.keys(relevantEvents).forEach(stat => {
    relevantEvents[stat].lines.sort((a, b) => a - b);
  });
  
  const stats = processPlayerStats(simPlays, player, relevantEvents, 'pitcherID');
  return stats || {};
}

export function findAllPlayerStats(simPlays: PlayResult[][], players: PlayerWithTeam[], statCaptureConfig: SavedConfiguration): AllPlayersPropsCountsMLB {
  const allPlayerStats: AllPlayersPropsCountsMLB = {};

  for (const player of players) {
    const playerStats = findPlayerStats(simPlays, player, statCaptureConfig);
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
};
