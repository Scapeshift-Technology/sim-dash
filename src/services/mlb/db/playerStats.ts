import { MatchupLineups, Player, Stats, PlayerStats } from "@/types/mlb";
import { ConnectionPool } from "@/types/sql";

// ---------- Main function ----------

async function getPlayerStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<MatchupLineups> {
  // Get all hitter stats
  const hitterPlayers = await fetchHitterStatsMLB(matchupLineups, pool);

  // Get all pitcher stats
  const pitcherPlayers = await fetchPitcherStatsMLB(matchupLineups, pool);
  
  // Map them back to the MatchupLineups object
  const updatedMatchupLineups = mapPlayersToMatchupLineups(matchupLineups, hitterPlayers, pitcherPlayers);

  return updatedMatchupLineups;
}

export { getPlayerStatsMLB };

// ---------- Helper functions ----------

async function fetchPlayerStatsMLB(
  players: Player[], 
  pool: ConnectionPool, 
  tableName: 'BaseballHitterProjectionStatistic' | 'BaseballPitcherProjectionStatistic',
  errorMessage: string
): Promise<Player[]> {
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
    const groupingFields = tableName === 'BaseballPitcherProjectionStatistic' 
      ? 'Player, Statistic, PitcherType, SplitType, ParkNeutralType'
      : 'Player, Statistic, SplitType, ParkNeutralType';
    
    const joinConditions = tableName === 'BaseballPitcherProjectionStatistic'
      ? 'AND s.PitcherType = ld.PitcherType'
      : '';

    const query = `
      WITH LatestDates AS (
        SELECT 
          ${groupingFields},
          MAX(Date) as LatestDate
        FROM ${tableName}
        WHERE Player IN (${playerIdsString})
        GROUP BY ${groupingFields}
      )
      SELECT s.*
      FROM ${tableName} s
      INNER JOIN LatestDates ld 
        ON s.Player = ld.Player 
        AND s.Statistic = ld.Statistic 
        ${joinConditions}
        AND s.SplitType = ld.SplitType
        AND s.ParkNeutralType = ld.ParkNeutralType
        AND s.Date = ld.LatestDate
      WHERE s.Player IN (${playerIdsString})
    `;
    try {
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error(`Error executing ${errorMessage}:`, error);
      return [];
    }
  });

  // Wait for all queries to complete
  const allStats = await Promise.all(statsPromises).then(results => results.flat());

  return allStats;
}

async function fetchHitterStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<Player[]> {
  // Get all hitters
  const hitterPlayers = extractHittersFromMatchupLineups(matchupLineups);
  const allStats = await fetchPlayerStatsMLB(
    hitterPlayers, 
    pool, 
    'BaseballHitterProjectionStatistic',
    'hitter stats query'
  );
  
  // Map stats back to players
  const playersWithStats = mapStatsToHitters(hitterPlayers, allStats);
  return playersWithStats;
}

async function fetchPitcherStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<Player[]> {
  // Get all pitchers
  const pitcherPlayers = extractPitchersFromMatchupLineups(matchupLineups);
  const allStats = await fetchPlayerStatsMLB(
    pitcherPlayers, 
    pool, 
    'BaseballPitcherProjectionStatistic',
    'pitcher stats query'
  );
  
  // Map stats back to players
  const playersWithStats = mapStatsToPitchers(pitcherPlayers, allStats);
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
    }

    // Find and update player in away lineup
    const awayPlayerIndex = updatedMatchupLineups.away.lineup.findIndex(p => p.id === player.id);
    if (awayPlayerIndex !== -1) {
      updatedMatchupLineups.away.lineup[awayPlayerIndex] = player;
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
  });

  return updatedMatchupLineups;
}

function extractHittersFromMatchupLineups(matchupLineups: MatchupLineups): Player[] {
  // Extract hitters from both home and away lineups
  const homeHitters = matchupLineups.home.lineup;
  const awayHitters = matchupLineups.away.lineup;

  // Bench in future
  
  // Combine and return all hitters
  return [...homeHitters, ...awayHitters];
}

function extractPitchersFromMatchupLineups(matchupLineups: MatchupLineups): Player[] {
  // Starting pitchers
  const homeStarter = matchupLineups.home.startingPitcher;
  const awayStarter = matchupLineups.away.startingPitcher;

  // Extract pitchers from both home and away lineups
  const homeRelievers = matchupLineups.home.bullpen;
  const awayRelievers = matchupLineups.away.bullpen;

  // Combine and return all pitchers
  return [homeStarter, awayStarter, ...homeRelievers, ...awayRelievers];
}

/**
 * Maps stats from DB to hitters. 
 * @param players - The hitters to map the stats to
 * @param stats - The stats to map to the players
 * @returns The hitters with the stats mapped to them
 */
function mapStatsToHitters(players: Player[], stats: any[]): Player[] {
  // Group stats by player ID and split type
  const statsByPlayer = stats.reduce((acc, stat) => {
    const playerId = stat.Player;
    const splitType = stat.SplitType.trim();
    
    // Skip overall splits
    if (splitType === 'O') return acc;
    
    // Initialize player stats if not exists
    if (!acc[playerId]) {
      acc[playerId] = {
        hitVsR: {
          adj_perc_K: 0,
          adj_perc_BB: 0,
          adj_perc_1B: 0,
          adj_perc_2B: 0,
          adj_perc_3B: 0,
          adj_perc_HR: 0,
          adj_perc_OUT: 0
        },
        hitVsL: {
          adj_perc_K: 0,
          adj_perc_BB: 0,
          adj_perc_1B: 0,
          adj_perc_2B: 0,
          adj_perc_3B: 0,
          adj_perc_HR: 0,
          adj_perc_OUT: 0
        }
      };
    }
    
    // Map the statistic to the correct field based on split type
    const statName = stat.Statistic.trim();
    const targetStats = splitType === 'R' ? acc[playerId].hitVsR : acc[playerId].hitVsL;
    
    if (statName === 'adj_perc_K') targetStats.adj_perc_K = stat.Value;
    else if (statName === 'adj_perc_BB') targetStats.adj_perc_BB = stat.Value;
    else if (statName === 'adj_perc_1B') targetStats.adj_perc_1B = stat.Value;
    else if (statName === 'adj_perc_2B') targetStats.adj_perc_2B = stat.Value;
    else if (statName === 'adj_perc_3B') targetStats.adj_perc_3B = stat.Value;
    else if (statName === 'adj_perc_HR') targetStats.adj_perc_HR = stat.Value;
    else if (statName === 'adj_perc_OUT') targetStats.adj_perc_OUT = stat.Value;
    
    return acc;
  }, {} as Record<number, PlayerStats>);

  // Map the stats to each player
  return players.map(player => {
    const playerStats = statsByPlayer[player.id];

    if (!playerStats || !playerStats.hitVsR || !playerStats.hitVsL) {
      throw new Error(`Missing stats for player ${player.id}`);
    }

    return {
      ...player,
      stats: {
        hitVsR: playerStats?.hitVsR,
        hitVsL: playerStats?.hitVsL
      }
    };
  });
}

function mapStatsToPitchers(players: Player[], stats: any[]): Player[] {
  // Group stats by player ID and split type
  const statsByPlayer = stats.reduce((acc, stat) => {
    const playerId = stat.Player;
    const splitType = stat.SplitType.trim();
    const pitcherType = stat.PitcherType.trim();
    
    // Skip overall splits
    if (splitType === 'O') return acc;

    // Find the player to check their position
    const player = players.find(p => p.id === playerId);
    if (!player) return acc;

    // Skip if pitcher type doesn't match position
    const expectedPitcherType = player.position === 'RP' ? 'R' : 'S';
    if (pitcherType !== expectedPitcherType) return acc;
    
    // Initialize player stats if not exists
    if (!acc[playerId]) {
      acc[playerId] = {
        pitchVsR: {
          adj_perc_K: 0,
          adj_perc_BB: 0,
          adj_perc_1B: 0,
          adj_perc_2B: 0,
          adj_perc_3B: 0,
          adj_perc_HR: 0,
          adj_perc_OUT: 0
        },
        pitchVsL: {
          adj_perc_K: 0,
          adj_perc_BB: 0,
          adj_perc_1B: 0,
          adj_perc_2B: 0,
          adj_perc_3B: 0,
          adj_perc_HR: 0,
          adj_perc_OUT: 0
        }
      };
    }
    
    // Map the statistic to the correct field based on split type
    const statName = stat.Statistic.trim();
    const targetStats = splitType === 'R' ? acc[playerId].pitchVsR : acc[playerId].pitchVsL;
    
    if (statName === 'adj_perc_K') targetStats.adj_perc_K = stat.Value;
    else if (statName === 'adj_perc_BB') targetStats.adj_perc_BB = stat.Value;
    else if (statName === 'adj_perc_1B') targetStats.adj_perc_1B = stat.Value;
    else if (statName === 'adj_perc_2B') targetStats.adj_perc_2B = stat.Value;
    else if (statName === 'adj_perc_3B') targetStats.adj_perc_3B = stat.Value;
    else if (statName === 'adj_perc_HR') targetStats.adj_perc_HR = stat.Value;
    else if (statName === 'adj_perc_OUT') targetStats.adj_perc_OUT = stat.Value;
    
    return acc;
  }, {} as Record<number, PlayerStats>);

  // Map the stats to each player
  return players.map(player => {
    const playerStats = statsByPlayer[player.id];

    if (!playerStats || !playerStats.pitchVsR || !playerStats.pitchVsL) {
      throw new Error(`Missing stats for player ${player.id}`);
    }

    return {
      ...player,
      stats: {
        pitchVsR: playerStats.pitchVsR,
        pitchVsL: playerStats.pitchVsL
      }
    };
  });
}


