import { 
  TeamType, 
  MlbScheduleApiGame, 
  MlbGameApiResponse, 
  MlbRosterApiResponse,
  Player
} from '@/types/mlb';

const BASE_MLB_API_URL = 'https://statsapi.mlb.com/api/v1';

// ---------- Schedule endpoint ----------

async function getMlbScheduleApiGame(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MlbScheduleApiGame> {
  try {
    // Find gamePk given info
    const formattedDate = formatDateMlbApi(date);
    const scheduleUrl = `${BASE_MLB_API_URL}/schedule?startDate=${formattedDate}&endDate=${formattedDate}&sportId=1&hydrate=team,game(seriesStatus)`;
    const scheduleResponse = await fetch(scheduleUrl);
    const scheduleData = await scheduleResponse.json();
    // Find game
    const relevantGame = scheduleData.dates[0].games.find((game: MlbScheduleApiGame) => {
      return game.teams.away.team.name === awayTeam && 
             game.teams.home.team.name === homeTeam && 
             game.gameNumber === daySequenceNumber
    });
    
    if (!relevantGame) {
      throw new Error('Game not found');
    }

    return relevantGame;
  } catch (error) {
    console.error('Error finding game in MLB API schedule:', error);
    throw error;
  }
}

export { getMlbScheduleApiGame }

// ---------- Game endpoint ----------
// -- Functions to get info

async function getMlbGameApiGame(gamePk: number): Promise<MlbGameApiResponse> {
  try { 
    const url = `${BASE_MLB_API_URL}.1/game/${gamePk}/feed/live`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting game info from MLB API:', error);
    throw error;
  }
}

// -- Functions to reformat data

function extractStartingLineupFromMlbGameApiGame(gameData: MlbGameApiResponse, teamType: TeamType): Player[] {
  try {
    const boxscore = gameData.liveData.boxscore;
    const teamData = boxscore.teams[teamType];
    
    // Get all players and their batting order positions
    const players = Object.values(teamData.players);
    
    // Filter and sort starting lineup (players with battingOrder values of 100, 200, etc)
    const startingLineup = players
      .filter(player => player.battingOrder && player.battingOrder % 100 === 0)
      .sort((a, b) => (a.battingOrder || 9999) - (b.battingOrder || 9999));

    if (startingLineup.length !== 9) {
      throw new Error('Starting lineup must have 9 players');
    }

    // Convert battingOrder to 1-based index (100->1, 200->2, etc)
    return startingLineup.map(player => ({
      id: player.person.id,
      name: player.person.fullName,
      position: player.position.abbreviation,
      battingOrder: (player.battingOrder || 0) / 100 // Convert from MLB's format (100, 200, etc) to 1-9
    }));
  } catch (error) {
    console.error('Error extracting starting lineup from MLB API game:', error);
    throw error;
  }
}

function extractStartingPitcherFromMlbGameApiGame(gameData: MlbGameApiResponse, teamType: TeamType): Player {
  const probablePitchers = gameData.gameData.probablePitchers[teamType];
  if (!probablePitchers) {
    throw new Error('No probable pitcher found');
  }

  return {
    id: probablePitchers.id,
    name: probablePitchers.fullName,
    position: 'SP'
  };
}

function extractTeamIds(gameInfo: MlbGameApiResponse): { awayTeamId: number, homeTeamId: number } {
  return {
    awayTeamId: gameInfo.gameData.teams.away.id,
    homeTeamId: gameInfo.gameData.teams.home.id
  }
}

export { getMlbGameApiGame, extractStartingLineupFromMlbGameApiGame, extractStartingPitcherFromMlbGameApiGame, extractTeamIds };

// ---------- Roster endpoint ----------

async function getMlbRosterApiRoster(teamId: number, date: string, rosterType: string | null = '40Man'): Promise<MlbRosterApiResponse> {
  try {
    const url = `${BASE_MLB_API_URL}/teams/${teamId}/roster?date=${date}&rosterType=${rosterType}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.roster) {
      throw new Error('No roster found');
    }
    return data;
  } catch (error) {
    console.error(`Error getting roster for team ${teamId}: ${error}`);
    throw error;
  }
}

export { getMlbRosterApiRoster };

// ---------- Teams endpoint ----------

async function getMlbTeamId(teamName: string, season: number) {
  try {
    const response = await fetch(`${BASE_MLB_API_URL}/teams?sportId=1&season=${season}`);
    const data = await response.json();
    
    // Clean up the input team name to handle variations
    const cleanTeamName = teamName.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    // Search through teams to find a match
    const team = data.teams.find((team: any) => {
      const teamNameVariations = [
        team.name.toLowerCase(),                    // Full name (e.g., "St. Louis Cardinals")
        team.teamName.toLowerCase(),                // Team name (e.g., "Cardinals")
        `${team.locationName} ${team.teamName}`.toLowerCase() // Full name constructed
      ];
      return teamNameVariations.some(variation => cleanTeamName.includes(variation));
    });
    
    return team ? team.id : null;
  } catch (error) {
    console.error(`Error getting MLB team ID for ${teamName}: ${error}`);
    return null;
  }
}

export { getMlbTeamId };

// ---------- Cross-endpoint functions ----------

function extractBullpenFromMlbRosterAndGame(gameInfo: MlbGameApiResponse, roster: MlbRosterApiResponse, teamType: TeamType): Player[] {
  const startingPitcher = extractStartingPitcherFromMlbGameApiGame(gameInfo, teamType);
  return extractBullPenFromMlbRoster(roster, startingPitcher.id);
}

function extractBullPenFromMlbRoster(roster: MlbRosterApiResponse, startingPitcherId: number): Player[] {
  const bullpen = roster.roster.filter((player: any) => player.position.abbreviation === 'P' && player.person.id !== startingPitcherId);

  return bullpen.map((player: any) => ({
    id: player.person.id,
    name: player.person.fullName,
    position: 'RP'
  }));
}

export { extractBullpenFromMlbRosterAndGame, extractBullPenFromMlbRoster }

// ---------- Util type functions used with MLB API ----------

function findPlayerId(playerName: string, roster: MlbRosterApiResponse): number | null {
  // Clean up the name for comparison
  const cleanName = playerName.toLowerCase().trim();
  
  // Try to find the player in the roster
  const player = roster.roster.find((p: any) => {
    const rosterName = p.person.fullName.toLowerCase();
    return cleanName === rosterName;
  });
  
  if (player) {
    return player.person.id;
  }
  
  // Log if player not found
  console.log(`Could not find ID for player: ${playerName}`);
  return null;
}

function formatDateMlbApi(date: string | Date): string {
  let dateTime;
  if (typeof date === 'string') {
    dateTime = addNoonTime(date);
  } else {
    dateTime = date;
  }

  return formatDateYYYY_MM_DD(dateTime);
}

function formatDateYYYY_MM_DD(date: string | Date): string {
  // Format date like YYYY-MM-DD
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addNoonTime(dateStr: string): string {
  return `${dateStr}T12:00:00`;
}

export { formatDateMlbApi, findPlayerId };