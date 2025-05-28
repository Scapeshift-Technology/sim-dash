import { 
  TeamType, 
  MlbScheduleApiGame, 
  MlbGameApiResponse, 
  MlbRosterApiResponse,
  Player,
  MlbPeopleApiResponse,
  MlbScheduleApiResponse
} from '@/types/mlb';

const BASE_MLB_API_URL = 'https://statsapi.mlb.com/api/v1';

// ---------- Schedule endpoint ----------

async function getProbablePitchers(teamId: number, date: string, daysBefore: number = 6, daysAfter: number = 1): Promise<number[]> {
  const startDate = new Date(`${date}T12:00:00`);  // Add noon time to ensure consistent date
  startDate.setDate(startDate.getDate() - daysBefore);
  const endDate = new Date(`${date}T12:00:00`);    // Add noon time to ensure consistent date
  endDate.setDate(endDate.getDate() + daysAfter);

  const startDateString = formatDateYYYY_MM_DD(startDate);
  const endDateString = formatDateYYYY_MM_DD(endDate);

  // Get the schedule for the team, but include probable pitchers
  const url = `${BASE_MLB_API_URL}/schedule?sportId=1&hydrate=probablePitcher,hydrations&startDate=${startDateString}&endDate=${endDateString}&teamId=${teamId}`;
  const response = await fetch(url);
  const data = await response.json();

  const probablePitchers = data.dates.flatMap((dateObj: { games: MlbScheduleApiGame[] }) => 
    dateObj.games.map((game: MlbScheduleApiGame) => {
      const isAwayTeam = game.teams.away.team.id === teamId;
      const team = isAwayTeam ? game.teams.away : game.teams.home;
      return team.probablePitcher?.id;
    })
  ).filter((id: number | undefined): id is number => id !== undefined); // Type guard to ensure we only return numbers

  return probablePitchers;
}

async function getMlbScheduleApiGame(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MlbScheduleApiGame> {
  try {
    // Find gamePk given info
    const formattedDate = formatDateMlbApi(date);
    const scheduleUrl = `${BASE_MLB_API_URL}/schedule?startDate=${formattedDate}&endDate=${formattedDate}&sportId=1&hydrate=team,game(seriesStatus)`;
    const scheduleResponse = await fetch(scheduleUrl);
    const scheduleData = await scheduleResponse.json();
    
    // Find game
    const relevantGame = scheduleData.dates[0].games.find((game: MlbScheduleApiGame) => {
      return game.teams.away.team.name === awayTeam.trim() && 
             game.teams.home.team.name === homeTeam.trim() && 
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

async function getMlbScheduleApiGames(startDate: string, endDate: string, teamId: number | null): Promise<MlbScheduleApiResponse> {
  // Get all team games in a date range
  const seriesGames = await hitMlbScheduleApi(startDate, endDate, teamId, ['game(seriesStatus)']);

  return seriesGames;
}

async function hitMlbScheduleApi(startDate: string, endDate: string, teamId: number | null, hydrate: string[] = []): Promise<MlbScheduleApiResponse> {
  const scheduleUrl = buildMlbScheduleUrl(startDate, endDate, teamId, hydrate);
  const scheduleResponse = await fetch(scheduleUrl);
  const scheduleData = await scheduleResponse.json();

  return scheduleData;
}

function buildMlbScheduleUrl(startDate: string, endDate: string, teamId: number | null, hydrate: string[] = []): string {
  const queryParams = new URLSearchParams({
    sportId: '1',
    startDate: startDate,
    endDate: endDate
  });

  if (teamId) queryParams.append('teamId', teamId.toString());
  if (hydrate?.length) queryParams.append('hydrate', hydrate.join(','));

  const scheduleUrl = `${BASE_MLB_API_URL}/schedule?${queryParams.toString()}`;

  return scheduleUrl;
}

export { getProbablePitchers, getMlbScheduleApiGame, getMlbScheduleApiGames }

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

/**
 * Extracts the bench players from the MLB API game data
 * @param {MlbRosterApiResponse} rosterInfo - The roster data from the MLB API
 * @param {TeamType} teamType - The team type (away or home)
 * @param {Player[]} startingLineup - The starting lineup for the team
 * @returns {Player[]} The bench players for the team in a list of player types
 */
function extractBenchFromMlbRoster(rosterInfo: MlbRosterApiResponse, startingLineup: Player[]): Player[] {
  const bench = rosterInfo.roster.filter((player: any) => 
    !startingLineup.some(startingPlayer => startingPlayer.id === player.person.id) && 
    player.position.abbreviation !== 'P' && 
    player.status.code === 'A'
  );

  const benchPlayers = bench.map((player: any) => ({
    id: player.person.id,
    name: player.person.fullName,
    position: player.position.abbreviation
  }));

  return benchPlayers;
}

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
    return startingLineup.map(player => {
      const gameDataPlayer = gameData.gameData.players[`ID${player.person.id}`];
      const batSide = gameDataPlayer.batSide.code;
      const pitchSide = gameDataPlayer.pitchHand.code;
      return {
        id: player.person.id,
        name: player.person.fullName,
        position: player.position.abbreviation,
        battingOrder: (player.battingOrder || 0) / 100, // Convert from MLB's format (100, 200, etc) to 1-9
        battingSide: batSide,
        pitchingSide: pitchSide
      }
    });
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

  const pitcher = gameData.gameData.players[`ID${probablePitchers.id}`];

  return {
    id: probablePitchers.id,
    name: probablePitchers.fullName,
    position: 'SP',
    battingSide: pitcher.batSide.code,
    pitchingSide: pitcher.pitchHand.code
  };
}

function extractTeamIds(gameInfo: MlbGameApiResponse): { awayTeamId: number, homeTeamId: number } {
  return {
    awayTeamId: gameInfo.gameData.teams.away.id,
    homeTeamId: gameInfo.gameData.teams.home.id
  }
}

function extractTeamIdsSchedule(scheduleInfo: MlbScheduleApiGame): { awayTeamId: number, homeTeamId: number } {
  return {
    awayTeamId: scheduleInfo.teams.away.team.id,
    homeTeamId: scheduleInfo.teams.home.team.id
  }
}

export { 
  getMlbGameApiGame, 
  extractStartingLineupFromMlbGameApiGame, 
  extractStartingPitcherFromMlbGameApiGame, 
  extractTeamIds,
  extractTeamIdsSchedule,
  extractBenchFromMlbRoster 
};

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

// ---------- People endpoint ----------

async function enrichPlayerWithHandedness(player: Player): Promise<Player> {
  try {
    const url = `${BASE_MLB_API_URL}/people/${player.id}`;
    const response = await fetch(url);
    const data: MlbPeopleApiResponse = await response.json();
    
    if (!data.people || data.people.length !== 1) {
      console.error('ERROR PLAYER', JSON.stringify(player, null, 2));
      throw new Error(`Unexpected number of people returned for player ${player.id}(not == 1): ${data.people.length}`);
    }

    const playerData = data.people[0];
    return {
      ...player,
      battingSide: playerData.batSide.code,
      pitchingSide: playerData.pitchHand.code
    };
  } catch (error) {
    console.error(`Error enriching player ${player.id} with handedness:`, error);
    throw error;
  }
}

async function findPlayerIdFromMlbApi(playerName: string, playerType: 'hitter' | 'pitcher', teamId: number): Promise<number | null> {
  try {
    const playerNameNoSpaces = playerName.replace(/\s+/g, '').toLowerCase();
    const url = `${BASE_MLB_API_URL}/people/search?names=${playerNameNoSpaces}&hydrate=currentTeam`;
    const response = await fetch(url);
    const data: MlbPeopleApiResponse = await response.json();

    // Search through to find the right person
    if (!data.people || data.people.length === 0) {
      return null;
    } else if (data.people.length === 1) {
      return data.people[0].id;
    } else {
      return extractPlayerIdFromPeopleList(data, playerType, teamId);
    }
  } catch (error) {
    console.error(`Error finding player ID from MLB API:`, error);
    return null;
  }
}

/**
 * Extracts the player id from the people list found by the MLB API people endpoint
 * @param {MlbPeopleApiResponse} peopleList - The people list from the MLB API
 * @param {string} playerType - The type of player(hitter or pitcher)
 * @param {number} teamId - The id of the team
 * @returns {number | null} The id of the player(or null if not found)
 */
function extractPlayerIdFromPeopleList(peopleList: MlbPeopleApiResponse, playerType: 'hitter' | 'pitcher', teamId: number): number | null {
  const player = peopleList.people.find((person: any) => {
    // Check position match
    const isPitcher = person.primaryPosition.abbreviation === 'P' || person.primaryPosition.abbreviation === 'TWP';
    const positionMatches = playerType === 'pitcher' ? isPitcher : !isPitcher;

    // Check team match (either direct team or parent org)
    const teamMatches = person.currentTeam?.id === teamId || person.currentTeam?.parentOrgId === teamId;

    return positionMatches && teamMatches;
  });

  return player ? player.id : null;
}

export { enrichPlayerWithHandedness };

// ---------- Cross-endpoint functions ----------

function extractBullpenFromMlbRosterAndGame(gameInfo: MlbGameApiResponse, roster: MlbRosterApiResponse, teamType: TeamType): Player[] {
  const startingPitcher = extractStartingPitcherFromMlbGameApiGame(gameInfo, teamType);
  return extractBullPenFromMlbRoster(roster, teamType, [startingPitcher.id]);
}

function extractBullPenFromMlbRoster(roster: MlbRosterApiResponse, teamType: TeamType, notBullpenIds: number[]): Player[] {
  const bullpen = roster.roster.filter((player: any) => 
    (player.position.abbreviation === 'P' || player.position.abbreviation === 'TWP') && 
    !notBullpenIds.includes(player.person.id) && 
    player.status.code === 'A');
  
  return bullpen.map((player: any) => {
    return {
      id: player.person.id,
      name: player.person.fullName,
      position: 'RP'
    };
  });
}

function extractUnavailablePitchersFromMlbRoster(roster: MlbRosterApiResponse, probablePitchers: number[], startingPitcherId: number): Player[] {
  const unavailablePitchers = roster.roster.filter((player: any) => 
    (player.position.abbreviation === 'P' || player.position.abbreviation === 'TWP') && 
    player.status.code === 'A' && 
    probablePitchers.includes(player.person.id) && 
    player.person.id !== startingPitcherId
  );
  
  return unavailablePitchers.map((player: any) => {
    return {
      id: player.person.id,
      name: player.person.fullName,
      position: 'RP'
    };
  });
}

export { extractBullpenFromMlbRosterAndGame, extractBullPenFromMlbRoster, extractUnavailablePitchersFromMlbRoster }

// ---------- Util type functions used with MLB API ----------

/**
 * Finds the MLBAM player id for a given player name
 * @param {string} playerName - The name of the player
 * @param {string} playerType - The type of player(hitter or pitcher)
 * @param {MlbRosterApiResponse} roster - The roster of that player's team
 * @param {number} teamId - The MLBAM id of that player's team
 * @returns {number | null} The MLBAM id of the player(or null if not found)
 * @example
 * findPlayerId('John Doe', 'hitter', roster, 123)
 */
async function findPlayerId(playerName: string, playerType: 'hitter' | 'pitcher', roster: MlbRosterApiResponse, teamId: number): Promise<number | null> {
  // Try roster
  const playerId = findPlayerIdFromRoster(playerName, roster);
  if (playerId) {
    return playerId;
  }

  // Try MLB API
  const backupPlayerId = await findPlayerIdFromMlbApi(playerName, playerType, teamId);
  if (backupPlayerId) {
    return backupPlayerId;
  }
  
  return null;
}

function findPlayerIdFromRoster(playerName: string, roster: MlbRosterApiResponse): number | null {
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

