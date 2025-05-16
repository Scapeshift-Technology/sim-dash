// src/services/mlb/external/lineups.ts
import type { 
  MlbGameApiResponse, 
  TeamLineup, 
  MlbScheduleApiGame,
  MlbRosterApiResponse,
  MatchupLineups,
  TeamType,
  Player,
  LineupsSource
} from '@/types/mlb';

import { 
  getMlbScheduleApiGame, 
  getMlbGameApiGame, 
  extractStartingLineupFromMlbGameApiGame, 
  extractStartingPitcherFromMlbGameApiGame,
  extractTeamIds,
  extractBullPenFromMlbRoster,
  getMlbRosterApiRoster,
  enrichPlayerWithHandedness,
  getProbablePitchers,
  extractBenchFromMlbRoster
} from './mlbApi';

import { getSwishLineups } from './swish';

// ---------- Main function ----------
/**
 * Gets the lineups for a given matchup. Attempts to fetch from MLB API first, falls back to swish analytics then to mock data if API fails.
 * @param {string} date - The date of the game
 * @param {string} awayTeam - The away team
 * @param {string} homeTeam - The home team
 * @param {number} daySequenceNumber - The day sequence number
 * @returns {MatchupLineups} The lineups for the matchup (either real data from MLB API or mock data if API fails)
 * @example
 * getLineupsMLB('2025-05-05', 'Los Angeles Dodgers', 'Miami Marlins', 1)
 */
async function getLineupsMLB(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number, scheduleApiGame?: MlbScheduleApiGame): Promise<{
  matchupLineups: MatchupLineups,
  lineupsSource: LineupsSource
}> {
  try {
    // Get MLB API response for a given game
    if (!scheduleApiGame) {
      scheduleApiGame = await getMlbScheduleApiGame(date, awayTeam, homeTeam, daySequenceNumber);
    }
    const gamePk = scheduleApiGame.gamePk;
    const gameInfo: MlbGameApiResponse = await getMlbGameApiGame(gamePk);

    // Find roster data for both teams
    const { awayTeamId, homeTeamId } = extractTeamIds(gameInfo);
    const awayRosterInfo: MlbRosterApiResponse = await getMlbRosterApiRoster(awayTeamId, date, '40Man');
    const homeRosterInfo: MlbRosterApiResponse = await getMlbRosterApiRoster(homeTeamId, date, '40Man');

    // Get past (and future) probable pitchers for both teams. This helps in the bullpen selection process.
    const awayProbablePitchers = await getProbablePitchers(awayTeamId, date);
    const homeProbablePitchers = await getProbablePitchers(homeTeamId, date);

    // Extract lineups
    const awayTeamLineup: TeamLineup = extractCompleteTeamLineup(gameInfo, awayRosterInfo, 'away', awayProbablePitchers);
    const homeTeamLineup: TeamLineup = extractCompleteTeamLineup(gameInfo, homeRosterInfo, 'home', homeProbablePitchers);

    const matchupLineups: MatchupLineups = {
      away: awayTeamLineup,
      home: homeTeamLineup
    }

    // Enrich matchup lineups with handedness
    const enrichedMatchupLineups: MatchupLineups = await enrichMatchupLineupsWithHandedness(matchupLineups);

    return {
      matchupLineups: enrichedMatchupLineups,
      lineupsSource: 'MLB'
    };
  } catch (error) {
    console.error('Error getting lineups from MLB API:', error);
    // If MLB API fails, use backup function
    const backupLineups: MatchupLineups = await getBackupLineups(date, awayTeam, homeTeam, daySequenceNumber);
    return {
      matchupLineups: backupLineups,
      lineupsSource: 'Swish'
    };
  }
}

// ---------- Helper functions ----------
/**
 * Gets the lineups for a given matchup from a backup source(Swish analytics first, then mock lineups)
 * @param {string} date - The date of the game in YYYY-MM-DD format
 * @param {string} awayTeam - The away team
 * @param {string} homeTeam - The home team
 * @param {number} daySequenceNumber - The day sequence number
 * @returns {MatchupLineups} The lineups for the matchup
 * @example
 * getBackupLineups('2025-05-05', 'Los Angeles Dodgers', 'Miami Marlins', 1)
 */
async function getBackupLineups(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MatchupLineups> {
  // Get Swish lineups. If that fails, use mock lineups
  try {
    const swishLineups: MatchupLineups = await getSwishLineups(date, awayTeam, homeTeam, daySequenceNumber);
    // Enrich matchup lineups with handedness
    const enrichedSwishLineups: MatchupLineups = await enrichMatchupLineupsWithHandedness(swishLineups);
    return enrichedSwishLineups;
  } catch(error) {
    console.error('Error getting lineups from Swish analytics:', error);
    const mockLineups: MatchupLineups = makeMockLineups(date, awayTeam, homeTeam, daySequenceNumber);
    return mockLineups;
  }
}

/**
 * Extracts the complete team lineup from the game info and roster info
 * @param {MlbGameApiResponse} gameInfo - The game info
 * @param {MlbRosterApiResponse} rosterInfo - The roster info
 * @param {TeamType} teamType - The team type (away or home)
 * @param {number[]} probablePitchers - A list of the ids of the probable pitchers for the team
 * @returns {TeamLineup} The complete team lineup
 * @example
 * extractCompleteTeamLineup(gameInfo, rosterInfo, '2025-05-05', 'away') // returns the away team lineup
 * @throws {Error} If either parameter is not a number
 */
function extractCompleteTeamLineup(
  gameInfo: MlbGameApiResponse, 
  rosterInfo: MlbRosterApiResponse,
  teamType: TeamType,
  probablePitchers: number[]
): TeamLineup {
  // Get starting lineup
  const startingLineup = extractStartingLineupFromMlbGameApiGame(gameInfo, teamType);

  // Get bench players
  const bench = extractBenchFromMlbRoster(rosterInfo, teamType, startingLineup);

  // Get starting pitcher
  const startingPitcher = extractStartingPitcherFromMlbGameApiGame(gameInfo, teamType);

  // Get bullpen
  const bullpen = extractBullPenFromMlbRoster(rosterInfo, teamType, probablePitchers);

  return {
    lineup: startingLineup,
    startingPitcher: startingPitcher,
    bullpen: bullpen,
    bench: bench,
    teamName: teamType === 'away' ? gameInfo.gameData.teams.away.name : gameInfo.gameData.teams.home.name
  };
}

/**
 * Generates mock lineups for a given matchup
 * @param {string} date - The date of the game
 * @param {string} awayTeam - The full name of the away team
 * @param {string} homeTeam - The full name of the home team
 * @param {number} daySequenceNumber - The day sequence number
 * @returns {MatchupLineups} The mock lineups for the matchup
 * @example
 * makeMockLineups('2025-05-05', 'Los Angeles Dodgers', 'Miami Marlins', 1)
 */
export function makeMockLineups(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number) {
    console.log(`Mocking MLB Lineups for: ${awayTeam} @ ${homeTeam} on ${date} (Seq: ${daySequenceNumber ?? 'N/A'})`);
    
    // Simple mock data structure
    const mockStats = {
        adj_perc_K: 0.2762629885,
        adj_perc_BB: 0.1595290032,
        adj_perc_1B: 0.09890445531,
        adj_perc_2B: 0.03389389766,
        adj_perc_3B: 0.002355036669,
        adj_perc_HR: 0.04064202892,
        adj_perc_OUT: 0.3884125898
    }

    const mockPlayer = (id: number, name: string, pos: string, order: number | undefined) => ({
        id: id,
        name: name,
        position: pos,
        battingOrder: order,
        stats: { // Basic placeholder stats
            hitVsL: mockStats,
            hitVsR: mockStats,
            pitchVsL: mockStats, 
            pitchVsR: mockStats,
        }
    });

    const awayLineup = Array.from({ length: 9 }, (_, i) => 
        mockPlayer(i + 100, `${awayTeam} Player ${i + 1}`, 'POS', i + 1)
    );
    const homeLineup = Array.from({ length: 9 }, (_, i) => 
        mockPlayer(i + 200, `${homeTeam} Player ${i + 1}`, 'POS', i + 1)
    );

    const awaySP = mockPlayer(199, `${awayTeam} SP`, 'P', undefined);
    const homeSP = mockPlayer(299, `${homeTeam} SP`, 'P', undefined);

    const awayBullpen = Array.from({ length: 5 }, (_, i) => mockPlayer(i + 1000, `${awayTeam} RP ${i+1}`, 'P', undefined));
    const homeBullpen = Array.from({ length: 5 }, (_, i) => mockPlayer(i + 2000, `${homeTeam} RP ${i+1}`, 'P', undefined));

    const awayBench = Array.from({ length: 5 }, (_, i) => mockPlayer(i + 3000, `${awayTeam} Bench ${i+1}`, 'CF', undefined));
    const homeBench = Array.from({ length: 5 }, (_, i) => mockPlayer(i + 4000, `${homeTeam} Bench ${i+1}`, 'CF', undefined));

    return {
        away: {
            lineup: awayLineup,
            startingPitcher: awaySP,
            bullpen: awayBullpen,
            bench: awayBench,
            teamName: awayTeam
        },
        home: {
            lineup: homeLineup,
            startingPitcher: homeSP,
            bullpen: homeBullpen,
            bench: homeBench,
            teamName: homeTeam
        }
    };
}

async function enrichMatchupLineupsWithHandedness(matchupLineups: MatchupLineups): Promise<MatchupLineups> {
  const enrichPlayer = async (player: Player): Promise<Player> => {
    if (!player.battingSide || !player.pitchingSide) {
      return await enrichPlayerWithHandedness(player);
    }
    return player;
  };

  // Enrich all players in parallel
  const [enrichedHomeLineup, enrichedHomeSP, enrichedHomeBullpen, enrichedHomeBench,
         enrichedAwayLineup, enrichedAwaySP, enrichedAwayBullpen, enrichedAwayBench] = await Promise.all([
    Promise.all(matchupLineups.home.lineup.map(enrichPlayer)),
    enrichPlayer(matchupLineups.home.startingPitcher),
    Promise.all(matchupLineups.home.bullpen.map(enrichPlayer)),
    Promise.all(matchupLineups.home.bench.map(enrichPlayer)),
    Promise.all(matchupLineups.away.lineup.map(enrichPlayer)),
    enrichPlayer(matchupLineups.away.startingPitcher),
    Promise.all(matchupLineups.away.bullpen.map(enrichPlayer)),
    Promise.all(matchupLineups.away.bench.map(enrichPlayer))
  ]);

  return {
    home: {
      ...matchupLineups.home,
      lineup: enrichedHomeLineup,
      startingPitcher: enrichedHomeSP,
      bullpen: enrichedHomeBullpen,
      bench: enrichedHomeBench
    },
    away: {
      ...matchupLineups.away,
      lineup: enrichedAwayLineup,
      startingPitcher: enrichedAwaySP,
      bullpen: enrichedAwayBullpen,
      bench: enrichedAwayBench
    }
  };
}

// Export functions to be used in main.js
export { getLineupsMLB };
