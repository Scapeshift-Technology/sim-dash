// src/services/mlb/external/lineups.ts
import type { 
  MlbGameApiResponse, 
  TeamLineup, 
  MlbScheduleApiGame,
  MlbRosterApiResponse,
  MatchupLineups,
  TeamType
} from '@/types/mlb';

import { 
  getMlbScheduleApiGame, 
  getMlbGameApiGame, 
  extractStartingLineupFromMlbGameApiGame, 
  extractStartingPitcherFromMlbGameApiGame,
  extractTeamIds,
  extractBullpenFromMlbRosterAndGame,
  getMlbRosterApiRoster
} from './mlbApi';

async function getLineupsMLB(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MatchupLineups> {
  // Try MLB API
    // Find gamePk given info
    // Use gamePk and get game info
    // Use game info to generate lineups
  try {
    // Get MLB API response for a given game
    const game: MlbScheduleApiGame = await getMlbScheduleApiGame(date, awayTeam, homeTeam, daySequenceNumber);
    const gamePk = game.gamePk;
    console.log(`GAME PK: ${gamePk}`);
    const gameInfo: MlbGameApiResponse = await getMlbGameApiGame(gamePk);

    // Find roster data for both teams
    const { awayTeamId, homeTeamId } = extractTeamIds(gameInfo);
    const awayRosterInfo: MlbRosterApiResponse = await getMlbRosterApiRoster(awayTeamId, date, 'active');
    const homeRosterInfo: MlbRosterApiResponse = await getMlbRosterApiRoster(homeTeamId, date, 'active');

    // Extract lineups
    const awayTeamLineup = extractCompleteTeamLineup(gameInfo, awayRosterInfo, 'away');
    const homeTeamLineup = extractCompleteTeamLineup(gameInfo, homeRosterInfo, 'home');

    return {
      away: awayTeamLineup,
      home: homeTeamLineup
    };
  } catch (error) {
    console.error('Error getting lineups from MLB API:', error);

    // If MLB API fails, use backup function
      // Get Swish lineups
      // If that fails, use mock lineups

    const mockLineups = makeMockLineups(date, awayTeam, homeTeam, daySequenceNumber);
    console.log(`Lineups generated for ${awayTeam} @ ${homeTeam} on ${date} (Seq: ${daySequenceNumber ?? 'N/A'})`);


    return mockLineups; // Fallback to mock data on error
  }
}

function extractCompleteTeamLineup(
  gameInfo: MlbGameApiResponse, 
  rosterInfo: MlbRosterApiResponse,
  teamType: TeamType
): TeamLineup {
  // Get starting lineup
  const startingLineup = extractStartingLineupFromMlbGameApiGame(gameInfo, teamType);

  // Get starting pitcher
  const startingPitcher = extractStartingPitcherFromMlbGameApiGame(gameInfo, teamType);

  // Get bullpen
  const bullpen = extractBullpenFromMlbRosterAndGame(gameInfo, rosterInfo, teamType);

  return {
    lineup: startingLineup,
    startingPitcher: startingPitcher,
    bullpen: bullpen
  };
}

function makeMockLineups(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number) {
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

    return {
        away: {
            lineup: awayLineup,
            startingPitcher: awaySP,
            bullpen: awayBullpen,
        },
        home: {
            lineup: homeLineup,
            startingPitcher: homeSP,
            bullpen: homeBullpen,
        }
    };
}

// Export functions to be used in main.js
module.exports = { getLineupsMLB };
