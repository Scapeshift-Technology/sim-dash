import { MatchupLineups, Player, PlayerStats, Stats } from "@/types/mlb";
import { ConnectionPool } from "@/types/sql";

// ---------- Types ----------

interface StatsResult {
  Player: number,
  Date: string,
  SplitType: string,
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

async function fetchPlayerBatchStatsMLB(
  players: Player[], 
  pool: ConnectionPool, 
  date: string,
  tableName: 'BaseballHitterProjectionStatistic' | 'BaseballPitcherProjectionStatistic',
  columns: string[],
  errorMessage: string
): Promise<StatsResult[]> {
  // Create batches of player IDs
  const playerIds = players.map(player => player.id);
  const batchSize = 30;
  
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += batchSize) {
    batches.push(playerIds.slice(i, i + batchSize));
  }

  // Execute batch queries
  const statsPromises = batches.map(async batch => {
    const playerIdsString = batch.join(',');

    const query = `
      SELECT ${columns.join(', ')}
      FROM ${tableName} s
      WHERE s.Player IN (${playerIdsString})
      AND s.Date = '${date}'
    `;
    try {
      const result = await pool.request().query(query);
      
      // Check for missing players in this batch
      const foundPlayerIds = new Set(result.recordset.map(record => record.Player));
      const missingPlayerIds = batch.filter(id => !foundPlayerIds.has(id));
      
      if (missingPlayerIds.length > 0) {
        const historicalStats = await fetchHistoricalPlayerStats(
          missingPlayerIds,
          pool,
          date,
          tableName,
          columns
        );

        const allStats: StatsResult[] = [...result.recordset, ...historicalStats];
        
        return allStats
      }
      
      return result.recordset;
    } catch (error) {
      console.error(`Error executing ${errorMessage}:`, error);
      return [];
    }
  });

  // Wait for all queries to complete
  const allStats: StatsResult[] = await Promise.all(statsPromises).then(results => results.flat());

  return allStats;
}

/**
 * Fetches the most recent historical stats for players before a given date
 * @param playerIds - Array of player IDs to fetch historical stats for
 * @param pool - Database connection pool
 * @param date - The target date to look back from
 * @param tableName - The table to query from
 * @param columns - The columns to select
 * @returns Array of player stats from their most recent available date
 */
async function fetchHistoricalPlayerStats(
  playerIds: number[],
  pool: ConnectionPool,
  date: string,
  tableName: 'BaseballHitterProjectionStatistic' | 'BaseballPitcherProjectionStatistic',
  columns: string[]
): Promise<StatsResult[]> {
  const playerIdsString = playerIds.join(',');
  
  const query = `
    WITH LatestStats AS (
      SELECT ${columns.join(', ')}, 
             ROW_NUMBER() OVER (PARTITION BY Player, SplitType, Statistic 
                               ORDER BY Date DESC) as row_num
      FROM ${tableName}
      WHERE Player IN (${playerIdsString})
      AND Date <= '${date}'
    )
    SELECT ${columns.join(', ')}
    FROM LatestStats 
    WHERE row_num = 1
  `;

  try {
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error(`Error executing historical stats query:`, error);
    return [];
  }
}

async function fetchHitterStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool, date: string): Promise<Player[]> {
  // Get all hitters
  const hitterPlayers = extractHittersFromMatchupLineups(matchupLineups);
  const allStats: StatsResult[] = await fetchPlayerBatchStatsMLB(
    hitterPlayers, 
    pool,
    date,
    'BaseballHitterProjectionStatistic',
    ['Player', 'Date', 'SplitType', 'Statistic', 'Value'],
    'hitter stats query'
  );

  // Map stats back to players
  const playersWithStats = mapStatsToPlayer(hitterPlayers, allStats, 'hit');
  return playersWithStats;
}

async function fetchPitcherStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool, date: string): Promise<Player[]> {
  // Get all pitchers
  const pitcherPlayers = extractPitchersFromMatchupLineups(matchupLineups);
  const allStats: StatsResult[] = await fetchPlayerBatchStatsMLB(
    pitcherPlayers, 
    pool,
    date,
    'BaseballPitcherProjectionStatistic',
    ['Player', 'Date', 'SplitType', 'PitcherType', 'Statistic', 'Value'],
    'pitcher stats query'
  );
  
  // Map stats back to players
  const playersWithStats = mapStatsToPlayer(pitcherPlayers, allStats, 'pitch');
  return playersWithStats;
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

  // Bench in future
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


