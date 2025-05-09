import { MatchupLineups, Player, PlayerStats } from "@/types/mlb";
import { ConnectionPool } from "@/types/sql";

// ---------- Main function ----------

async function getPlayerStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<MatchupLineups> {
  // Get all hitter stats
  const hitterPlayers = await fetchHitterStatsMLB(matchupLineups, pool);

  // Get all pitcher stats
  // const pitcherPlayers = await fetchPitcherStatsMLB(matchupLineups, pool);
  
  // Map them back to the MatchupLineups object
  // const updatedMatchupLineups = mapPlayersToMatchupLineups(matchupLineups, hitterPlayers, pitcherPlayers);

  return matchupLineups; // Once the functions are finished, we can return the updated matchupLineups
}

export { getPlayerStatsMLB };

// ---------- Helper functions ----------

async function fetchHitterStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<Player[]> {
  // Get all hitters
  const hitterPlayers = extractHittersFromMatchupLineups(matchupLineups);

  // Fetch stats for each hitter
  const playerIds = hitterPlayers.map(player => player.id);
  const batchSize = 50; // Adjust based on your DB performance needs
  
  // Create batches of player IDs
  const batches: number[][] = [];
  for (let i = 0; i < playerIds.length; i += batchSize) {
    batches.push(playerIds.slice(i, i + batchSize));
  }

  // Execute batch queries
  const statsPromises = batches.map(async batch => {
    const playerIdsString = batch.join(',');
    const query = `SELECT * FROM BaseballHitterProjectionStatistic WHERE Player IN (${playerIdsString})`;
    try {
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error executing hitter stats query:', error);
      return [];
    }
  });

  // Wait for all queries to complete
  const allStats = await Promise.all(statsPromises).then(results => results.flat());

  // Map stats back to players
  // TODO: Implement mapping of DB results to PlayerStats
  // This will need to be implemented once we have the DB schema

  return hitterPlayers;
}

// async function fetchPitcherStatsMLB(matchupLineups: MatchupLineups, pool: ConnectionPool): Promise<Player[]> {
//   // Get all pitchers
//   const pitcherPlayers = extractPitchersFromMatchupLineups(matchupLineups);

//   // Fetch stats for each pitcher

//   return pitcherPlayers;
// }

// function mapPlayersToMatchupLineups(matchupLineups: MatchupLineups, hitterPlayers: Player[], pitcherPlayers: Player[]): MatchupLineups {
//   // Map hitters to matchupLineups
//   for (let i = 0; i <= hitterPlayers.length + pitcherPlayers.length; i++) {
//     const player = i < hitterPlayers.length ? hitterPlayers[i] : pitcherPlayers[i - hitterPlayers.length];
//     // Find player by id in matchupLineups
//   }

//   return updatedMatchupLineups;
// }


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


