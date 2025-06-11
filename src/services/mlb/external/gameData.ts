import { GameMetadataMLB, MLBGameDataResponse, MlbScheduleApiGame, MlbScheduleApiResponse, SeriesInfoMLB } from '@/types/mlb'
import { getLineupsMLB } from './lineups';
import { teamNameToMLBApiTeamName } from '../utils/teamName';

import { MLBGameData } from "@/types/mlb";

import { formatDateMlbApi, getMlbScheduleApiGame, getMlbScheduleApiGames, getMlbTeamId } from './mlbApi';

// ---------- Main function ----------
/**
 * Gets the game data for a given matchup.
 * @param date - The date of the game
 * @param awayTeam - The away team
 * @param homeTeam - The home team
 * @param daySequenceNumber - The day sequence number
 * @returns The game data for the matchup
 */
async function getGameDataMLB(date: string, awayTeam: string, homeTeam: string, daySequenceNumber?: number): Promise<MLBGameDataResponse> {
  // Default to 1 if not provided
  daySequenceNumber = daySequenceNumber ?? 1;

  // Put date in YYYY-MM-DD format
  const formattedDate = formatDateMlbApi(date);
  const awayTeamNameMLB = teamNameToMLBApiTeamName(awayTeam.trim());
  const homeTeamNameMLB = teamNameToMLBApiTeamName(homeTeam.trim());

  try {
    const game: MlbScheduleApiGame = await getMlbScheduleApiGame(formattedDate, awayTeamNameMLB, homeTeamNameMLB, daySequenceNumber);

    // Potentially get series info and return
    let seriesInfo: SeriesInfoMLB = {};
    if (game.seriesGameNumber === 1 && game.gamesInSeries >= 3) {
      seriesInfo = await getSeriesInfoMLB(formattedDate, awayTeamNameMLB, homeTeamNameMLB);
      const currentGame = seriesInfo[game.seriesGameNumber as number];

      return {
        currentGame,
        seriesGames: seriesInfo
      }
    }

    const gameData = await fetchBasicGameData(formattedDate, awayTeamNameMLB, homeTeamNameMLB, daySequenceNumber, game);

    return {
      currentGame: gameData
    };
  } catch (error) {
    console.error('Error getting game data:', error);
    throw error;
  }
}

export { getGameDataMLB };

// ---------- Helper functions ----------

/**
 * Fetches the basic game data shared between different game data functions.
 * @private
 */
async function fetchBasicGameData(
  date: string,
  awayTeam: string,
  homeTeam: string,
  daySequenceNumber: number,
  game: MlbScheduleApiGame
): Promise<MLBGameData> {
  const { matchupLineups, lineupsSource } = await getLineupsMLB(date, awayTeam, homeTeam, daySequenceNumber, game);

  const gameInfo: GameMetadataMLB = {
    seriesGameNumber: game.seriesGameNumber,
    lineupsSource,
    mlbGameId: game.gamePk,
    gameTimestamp: game.gameDate,
    venueId: game.venue.id
  }

  return {
    lineups: matchupLineups,
    gameInfo
  };
}

/**
 * Gets the series info for a given matchup.
 * @param date - The date of the game
 * @param awayTeam - The away team
 * @param homeTeam - The home team
 * @param daySequenceNumber - The day sequence number
 */
async function getSeriesInfoMLB(date: string, awayTeamName: string, homeTeamName: string): Promise<SeriesInfoMLB> {
  // Make date range to look for
  const { startDate, endDate } = getMlbSeriesDateRange(date);

  // Get all games for one of the teams in the near future/past
  const awayTeamId = await getMlbTeamId(awayTeamName, 2025);
  const scheduleData: MlbScheduleApiResponse = await getMlbScheduleApiGames(startDate, endDate, awayTeamId);

  // Get series number for current game
  const currentAwaySeriesNumber = scheduleData.dates
    .find(dateEntry => dateEntry.date === date)
    ?.games.find(game => 
        game.teams.away.team.name === awayTeamName && 
        game.teams.home.team.name === homeTeamName
    )?.teams.away.seriesNumber;

  // Find all games in this series
  const seriesGames: SeriesInfoMLB = {};
  const seriesGamesPromises: Promise<{ gameNumber: number, data: MLBGameData }>[] = [];

  if (scheduleData.dates) {
    for (const scheduleDate of scheduleData.dates) {
      for (const game of scheduleDate.games) {
        if (game.teams.away.team.name === awayTeamName && game.teams.home.team.name === homeTeamName && game.teams.away.seriesNumber === currentAwaySeriesNumber) {
          // seriesGames[game.seriesGameNumber] = await getIndividualGameDataMLB(game.officialDate, awayTeamName, homeTeamName, game.gameNumber);
          seriesGamesPromises.push(
            getIndividualGameDataMLB(game.officialDate, awayTeamName, homeTeamName, game.gameNumber)
              .then(data => ({ gameNumber: game.seriesGameNumber, data }))
          );
        }
      }
    }

    const resolvedGames = await Promise.all(seriesGamesPromises);
    resolvedGames.forEach(resolvedGame => {
      seriesGames[resolvedGame.gameNumber] = resolvedGame.data;
    });
  }

  return seriesGames;
}

/**
 * Gets the game data for a given matchup.
 * @param date - The date of the game
 * @param awayTeam - The away team
 * @param homeTeam - The home team
 * @param daySequenceNumber - The day sequence number
 * @returns The game data for the matchup
 */
async function getIndividualGameDataMLB(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MLBGameData> {
  const game: MlbScheduleApiGame = await getMlbScheduleApiGame(date, awayTeam, homeTeam, daySequenceNumber);
  return fetchBasicGameData(date, awayTeam, homeTeam, daySequenceNumber, game);
}
  
/**
 * Gets the date range for a given date.
 * @param date - The date to get the date range for
 * @param startRange - The number of days to look before the date
 * @param endRange - The number of days to look after the date
 * @returns The start and end of the date range
 */
function getMlbSeriesDateRange(date: string, startRange: number = 5, endRange: number = 5): { startDate: string, endDate: string } {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startRange);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + endRange);

  return {
    startDate: formatDateMlbApi(startDate),
    endDate: formatDateMlbApi(endDate)
  }
}