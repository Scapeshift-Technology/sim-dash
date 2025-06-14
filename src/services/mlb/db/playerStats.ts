import { MatchupLineups, Player, PlayerStats, Stats, BaserunningStats } from "@/types/mlb/mlb-sim";
import { ConnectionPool } from "@/types/sql";

// ---------- Types ----------

interface StatsResult {
  Projector: string,
  Date: string,
  Player: number,
  SplitType: string,
  ParkNeutralType: number,
  PitcherType?: string,
  Statistic: string,
  Value: number
}

type StatType = 'hit' | 'pitch';

// ---------- Main function ----------

async function getPlayerStatsMLB(matchupLineups: MatchupLineups, date: string, pool: ConnectionPool): Promise<MatchupLineups> {
  // Get all hitter stats
  const hitterPlayers = await fetchHitterStatsMLB(matchupLineups, pool, date);

  // Get all pitcher stats
  const pitcherPlayers = await fetchPitcherStatsMLB(matchupLineups, pool, date);
  
  // Map them back to the MatchupLineups object
  const updatedMatchupLineups = mapPlayersToMatchupLineups(matchupLineups, hitterPlayers, pitcherPlayers);

  return updatedMatchupLineups;
}

export { getPlayerStatsMLB };

// ---------- Helper functions ----------

/**
 * Fetches baseball player projections using SQL table construction for table-valued parameters
 * @param players - Array of players to fetch stats for
 * @param pool - Database connection pool
 * @param date - The target date for projections
 * @param playerType - 'Hitters' or 'Pitchers'
 * @returns Array of player stats
 */
async function fetchPlayerProjectionsMLB(
  players: Player[], 
  pool: ConnectionPool, 
  date: string,
  playerType: 'Hitters' | 'Pitchers'
): Promise<StatsResult[]> {
  try {
    const playerIds = players.map(player => player.id);
    
    if (playerIds.length === 0) {
      return [];
    }
    
    const request = pool.request();
    
    // Add parameters for the stored procedure call
    request.input('Date', date);
    request.input('PlayerType', playerType);
    
    // Build SQL to manually construct table-valued parameter
    // Following the pattern from the Python example provided by the user
    let callSql = 'DECLARE @Players MLBPlayerTableType;\n';
    
    // Insert player IDs into the table variable
    for (const playerId of playerIds) {
      callSql += `INSERT INTO @Players (MLBPlayer) VALUES (${playerId});\n`;
    }
    
    // Call the stored procedure with the table variable using named parameters
    callSql += `
      EXEC dbo.UserAPICall_BaseballPlayerProjections_sp
        @Date = @Date,
        @PlayerType = @PlayerType,
        @Players = @Players;
    `;
    
    // Execute the constructed SQL
    const result = await request.query(callSql);
    
    return result.recordset;
  } catch (error) {
    console.error(`Error executing ${playerType} projections query:`, error);
    return [];
  }
}

async function fetchHitterStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool, date: string): Promise<Player[]> {
  // Get all hitters
  const hitterPlayers = extractHittersFromMatchupLineups(matchupLineups);
  
  // Return empty array if no hitters
  if (hitterPlayers.length === 0) {
    return [];
  }
  
  // Fetch hitter projections using the new stored procedure
  const allStats: StatsResult[] = await fetchPlayerProjectionsMLB(
    hitterPlayers, 
    pool,
    date,
    'Hitters'
  );

  // Map stats back to players
  const playersWithHittingStats = mapStatsToPlayer(hitterPlayers, allStats, 'hit');
  const playersWithBaserunning = mapBaserunningStatsToPlayer(playersWithHittingStats, allStats);
  return playersWithBaserunning;
}

async function fetchPitcherStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool, date: string): Promise<Player[]> {
  // Get all pitchers
  const pitcherPlayers = extractPitchersFromMatchupLineups(matchupLineups);
  
  // Return empty array if no pitchers
  if (pitcherPlayers.length === 0) {
    return [];
  }
  
  // Fetch pitcher projections using the new stored procedure
  const allStats: StatsResult[] = await fetchPlayerProjectionsMLB(
    pitcherPlayers, 
    pool,
    date,
    'Pitchers'
  );
  
  // Create validation function for current role
  const validateCurrentRole = (player: Player, stat: StatsResult): boolean => {
    if (!stat.PitcherType) return false;

    const pitcherType = stat.PitcherType.trim();
    if (player.position === 'SP' && pitcherType === 'S') return true;
    if (player.position === 'RP' && pitcherType === 'R') return true;

    return false;
  };

  // Create validation function for alternate role
  const validateAlternateRole = (player: Player, stat: StatsResult): boolean => {
    if (!stat.PitcherType) return false;

    const pitcherType = stat.PitcherType.trim();
    if (player.position === 'SP' && pitcherType === 'R') return true;
    if (player.position === 'RP' && pitcherType === 'S') return true;

    return false;
  };

  const playersWithCurrentStats = mapStatsToPlayer(pitcherPlayers, allStats, 'pitch', validateCurrentRole);
  const playersWithAlternateStats = mapStatsToPlayer(pitcherPlayers, allStats, 'pitch', validateAlternateRole);

  // Merge the results
  const playersWithBothStats = playersWithCurrentStats.map(player => {
    const alternatePlayer = playersWithAlternateStats.find((p: Player) => p.id === player.id);

    if (alternatePlayer && alternatePlayer.stats) {
      const alternateRole = player.position === 'SP' ? 'RP' : 'SP';

      return {
        ...player,
        alternateRoleStats: {
          [alternateRole]: alternatePlayer.stats
        }
      };
    }

    return player;
  });

  return playersWithBothStats;
}

function mapPlayersToMatchupLineups(matchupLineups: MatchupLineups, hitterPlayers: Player[], pitcherPlayers: Player[]): MatchupLineups {
  // Create a deep copy of the matchupLineups
  // const updatedMatchupLineups = JSON.parse(JSON.stringify(matchupLineups)) as MatchupLineups;
  const updatedMatchupLineups = matchupLineups;
  
  // Map hitters to lineup
  hitterPlayers.forEach(player => {
    // Find and update player in home lineup
    const homePlayerIndex = updatedMatchupLineups.home.lineup.findIndex(p => p.id === player.id);
    if (homePlayerIndex !== -1) {
      updatedMatchupLineups.home.lineup[homePlayerIndex] = player;
      return;
    } else {
      const homeBenchIndex = updatedMatchupLineups.home.bench.findIndex(p => p.id === player.id);
      if (homeBenchIndex !== -1) {
        updatedMatchupLineups.home.bench[homeBenchIndex] = player;
        return;
      }
    }

    // Find and update player in away lineup
    const awayPlayerIndex = updatedMatchupLineups.away.lineup.findIndex(p => p.id === player.id);
    if (awayPlayerIndex !== -1) {
      updatedMatchupLineups.away.lineup[awayPlayerIndex] = player;
      return;
    } else {
      const awayBenchIndex = updatedMatchupLineups.away.bench.findIndex(p => p.id === player.id);
      if (awayBenchIndex !== -1) {
        updatedMatchupLineups.away.bench[awayBenchIndex] = player;
        return;
      }
    }
  });

  // Map pitchers
  pitcherPlayers.forEach(player => {
    // Update starting pitchers
    if (updatedMatchupLineups.home.startingPitcher.id === player.id) {
      updatedMatchupLineups.home.startingPitcher = player;
    }
    if (updatedMatchupLineups.away.startingPitcher.id === player.id) {
      updatedMatchupLineups.away.startingPitcher = player;
    }

    // Update bullpen pitchers
    const homeBullpenIndex = updatedMatchupLineups.home.bullpen.findIndex(p => p.id === player.id);
    if (homeBullpenIndex !== -1) {
      updatedMatchupLineups.home.bullpen[homeBullpenIndex] = player;
    }

    const awayBullpenIndex = updatedMatchupLineups.away.bullpen.findIndex(p => p.id === player.id);
    if (awayBullpenIndex !== -1) {
      updatedMatchupLineups.away.bullpen[awayBullpenIndex] = player;
    }

    // Update unavailable pitchers
    const homeUnavailablePitchersIndex = updatedMatchupLineups.home.unavailablePitchers.findIndex(p => p.id === player.id);
    if (homeUnavailablePitchersIndex !== -1) {
      updatedMatchupLineups.home.unavailablePitchers[homeUnavailablePitchersIndex] = player;
    }

    const awayUnavailablePitchersIndex = updatedMatchupLineups.away.unavailablePitchers.findIndex(p => p.id === player.id);
    if (awayUnavailablePitchersIndex !== -1) {
      updatedMatchupLineups.away.unavailablePitchers[awayUnavailablePitchersIndex] = player;
    }
  });

  return updatedMatchupLineups;
}

function extractHittersFromMatchupLineups(matchupLineups: MatchupLineups): Player[] {
  // Extract hitters from both home and away lineups
  const homeHitters = matchupLineups.home.lineup;
  const awayHitters = matchupLineups.away.lineup;

  // Bench players
  const homeBench = matchupLineups.home.bench;
  const awayBench = matchupLineups.away.bench;
  
  // Combine and return all hitters
  return [...homeHitters, ...awayHitters, ...homeBench, ...awayBench];
}

function extractPitchersFromMatchupLineups(matchupLineups: MatchupLineups): Player[] {
  // Starting pitchers
  const homeStarter = matchupLineups.home.startingPitcher;
  const awayStarter = matchupLineups.away.startingPitcher;

  // Extract pitchers from both home and away lineups
  const homeRelievers = matchupLineups.home.bullpen;
  const awayRelievers = matchupLineups.away.bullpen;
  const homeUnavailablePitchers = matchupLineups.home.unavailablePitchers;
  const awayUnavailablePitchers = matchupLineups.away.unavailablePitchers;

  // Combine and return all pitchers
  return [homeStarter, awayStarter, ...homeRelievers, ...awayRelievers, ...homeUnavailablePitchers, ...awayUnavailablePitchers];
}

function mapStatsToPlayer<T extends StatType>(
  players: Player[],
  stats: StatsResult[],
  statType: T,
  validatePlayer?: (player: Player, stat: StatsResult) => boolean
): Player[] {
  const statsByPlayer = stats.reduce((acc, stat) => {
    const playerId = stat.Player;
    const splitType = stat.SplitType.trim();
    
    // Skip overall splits
    if (splitType === 'O') return acc;

    // Optional validation (used for pitcher type validation)
    if (validatePlayer && !validatePlayer(players.find(p => p.id === playerId)!, stat)) {
      return acc;
    }
    
    // Initialize player stats if not exists
    if (!acc[playerId]) {
      const statsObj = {
        statsDate: new Date(stat.Date).toISOString().split('T')[0],
        [`${statType}VsR`]: createEmptyStats(),
        [`${statType}VsL`]: createEmptyStats()
      };
      acc[playerId] = statsObj;
    }
    
    // Map the statistic
    const statName = stat.Statistic.trim();
    const targetStats = (splitType === 'R' ? acc[playerId][`${statType}VsR`] : acc[playerId][`${statType}VsL`])!;
    mapStatValue(targetStats, statName, stat.Value);
    
    return acc;
  }, {} as Record<number, PlayerStats>);

  return players.map(player => {
    const playerStats = statsByPlayer[player.id];
    if (!playerStats) {
      throw new Error(`Missing stats for player ${player.id}`);
    }

    return {
      ...player,
      stats: playerStats
    };
  });
}

// Helper functions
function createEmptyStats(): Stats {
  return {
    adj_perc_K: 0,
    adj_perc_BB: 0,
    adj_perc_1B: 0,
    adj_perc_2B: 0,
    adj_perc_3B: 0,
    adj_perc_HR: 0,
    adj_perc_OUT: 0
  };
}

function mapStatValue(targetStats: Stats, statName: string, value: number) {
  if (statName === 'adj_perc_K') targetStats.adj_perc_K = value;
  else if (statName === 'adj_perc_BB') targetStats.adj_perc_BB = value;
  else if (statName === 'adj_perc_1B') targetStats.adj_perc_1B = value;
  else if (statName === 'adj_perc_2B') targetStats.adj_perc_2B = value;
  else if (statName === 'adj_perc_3B') targetStats.adj_perc_3B = value;
  else if (statName === 'adj_perc_HR') targetStats.adj_perc_HR = value;
  else if (statName === 'adj_perc_OUT') targetStats.adj_perc_OUT = value;
}

function mapBaserunningStatsToPlayer(players: Player[], stats: StatsResult[]): Player[] {
  const baserunningStatsByPlayer = stats.reduce((acc, stat) => {
    const playerId = stat.Player;
    const statName = stat.Statistic.trim();
    
    // Only process baserunning statistics
    if (statName !== 'sb_perc' && statName !== 'att_perc_sb') {
      return acc;
    }
    
    // Initialize player baserunning stats if not exists
    if (!acc[playerId]) {
      acc[playerId] = {
        sb_perc: 0,
        att_perc_sb: 0
      };
    }
    
    // Map the statistic value
    if (statName === 'sb_perc') {
      acc[playerId].sb_perc = stat.Value;
    } else if (statName === 'att_perc_sb') {
      acc[playerId].att_perc_sb = stat.Value;
    }
    
    return acc;
  }, {} as Record<number, BaserunningStats>);

  return players.map(player => {
    const baserunningStats = baserunningStatsByPlayer[player.id];
    
    if (!baserunningStats) {
      // If no baserunning stats found, return player as-is
      return player;
    }

    return {
      ...player,
      stats: {
        ...player.stats!,
        baserunning: baserunningStats
      }
    };
  });
}