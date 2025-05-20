import { 
  MatchupLineups, 
  MlbRosterApiResponse, 
  Player, 
  TeamLineup, 
  TeamType 
} from "@/types/mlb";
import { 
  extractBullPenFromMlbRoster, 
  findPlayerId, 
  getMlbRosterApiRoster, 
  getMlbTeamId,
  getProbablePitchers,
  extractBenchFromMlbRoster
} from "./mlbApi";
import { createTargetMatchup } from "../utils/teamName";

// ---------- Main function ----------
/**
 * Finds lineups for a given game using swish analytics
 * @param {string} date - The date of the game in YYYY-MM-DD format
 * @param {string} awayTeam - The full name of the away team
 * @param {string} homeTeam - The full name of the home team
 * @param {number} daySequenceNumber - The day sequence number
 * @returns {MatchupLineups} The lineups for the matchup
 * @example
 * getSwishLineups('2025-05-05', 'Los Angeles Dodgers', 'Miami Marlins', 1)
 */
async function getSwishLineups(date: string, awayTeam: string, homeTeam: string, daySequenceNumber: number): Promise<MatchupLineups> {
  // Get the desired url and info
  const html = await getSwishLineupsHtml(date);

  // Get the relevantlineup card
  const lineupCard = getSwishLineupsLineupCard(html, awayTeam, homeTeam, daySequenceNumber);

  // Extract team lineups
  const awayLineup = await extractTeamLineupFromSwishLineupCard(lineupCard, date, awayTeam, 'away');
  const homeLineup = await extractTeamLineupFromSwishLineupCard(lineupCard, date, homeTeam, 'home');

  // Return the lineups
  return {
    away: awayLineup,
    home: homeLineup
  };
}

export { getSwishLineups };

// ---------- Helper functions ---------- 
/**
 * Extracts a team's lineup from a swish analytics lineup card
 * @param {string} lineupCard - The HTML of the Swish Analytics lineup card
 * @param {string} date - The date of the game in YYYY-MM-DD format
 * @param {TeamType} teamType - The team type (away or home)
 * @returns {TeamLineup} The lineup for the given team
 * @example
 * extractTeamLineupFromSwishLineupCard(lineupCard, '2025-05-05', 'away')
 */
async function extractTeamLineupFromSwishLineupCard(lineupCard: string, date: string, teamName: string, teamType: TeamType): Promise<TeamLineup> {
  // Get the team's roster info
  const season = parseInt(date.split('-')[0]);
  const teamId = await getMlbTeamId(teamName, season);
  const rosterInfo = await getMlbRosterApiRoster(teamId, date, '40Man');
  const probablePitchers = await getProbablePitchers(teamId, date);
  
  // Get the team's starting pitcher
  const startingPitcher = await extractStartingPitcherFromSwishLineupCard(lineupCard, rosterInfo, teamId, teamType);

  // Get the lineup
  const lineup = await getLineupFromSwishLineupCard(lineupCard, rosterInfo, teamId, teamType);

  // Get the bench
  const bench = extractBenchFromMlbRoster(rosterInfo, lineup);

  // Get the bullpen
  const bullpen = extractBullPenFromMlbRoster(rosterInfo, teamType, probablePitchers);

  return {
    lineup: lineup,
    startingPitcher: startingPitcher,
    bullpen: bullpen,
    bench: bench,
    teamName: teamName
  };
}

/**
 * Extracts the starting lineup from the swish analytics lineup card
 * @param {string} lineupCard - The HTML of the Swish Analytics lineup card
 * @param {MlbRosterApiResponse} rosterInfo - The roster info for the team
 * @param {number} teamId - The team id
 * @param {TeamType} teamType - The team type (away or home)
 * @returns {Player[]} The lineup for the given team
 * @example
 * getLineupFromSwishLineupCard(lineupCard, rosterInfo, 'away')
 */
async function getLineupFromSwishLineupCard(lineupCard: string, rosterInfo: MlbRosterApiResponse, teamId: number, teamType: TeamType): Promise<Player[]> {
  // Get the lineup from the html
  const lineupSection = lineupCard.match(/<div[^>]*class="[^"]*mar-neg-chart[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);

  if (!lineupSection) {
    throw new Error('No lineup section found in lineup card');
  }

  // Get all tables from the lineup section
  const tables = lineupSection[1].match(/<table[^>]*>[\s\S]*?<\/table>/g) || [];
  
  if (tables.length < 2) {
    throw new Error('Expected at least 2 tables in lineup section');
  }

  // Select the appropriate table based on team type
  const tableIndex = teamType === 'away' ? 0 : 1;
  const table = tables[tableIndex];

  if (!table) {
    throw new Error(`No table found for ${teamType} team`);
  }

  // Get all rows from the table
  const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  
  // Process each row to extract player info
  const playerPromises = rows.map(async (row, index) => {
    const playerMatch = row.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    if (!playerMatch) {
      throw new Error(`Could not extract player data from row ${index + 1}`);
    }

    const content = playerMatch[1];
    let name = '';
    let position = '';

    if (teamType === 'away') {
      // Away team format: number followed by name followed by small tags
      const nameMatch = content.match(/>\d<\/b>&nbsp;&nbsp;&nbsp;([^<]*)/);
      name = nameMatch ? nameMatch[1].trim() : '';
      position = 'TBD';
    } else {
      // Home team format: position, handedness, name, number
      const nameMatch = content.match(/\([RLS]\)<\/small>\s*([^&]*?)&nbsp;&nbsp;&nbsp;<b/);
      name = nameMatch ? nameMatch[1].trim() : '';
      position = 'TBD';
    }

    // Convert to Player object
    const playerId = await findPlayerId(name, 'hitter', rosterInfo, teamId) || 999;

    const player: Player = {
      id: playerId,
      name: name,
      position: position,
      battingOrder: index + 1
    };

    return player;
  });

  return Promise.all(playerPromises);
}

/**
 * Extracts the starting pitcher player info from the swish analytics lineup card
 * @param {string} lineupCard - The HTML of the Swish Analytics lineup card
 * @param {MlbRosterApiResponse} rosterInfo - The roster info for the team
 * @param {number} teamId - The team id
 * @param {TeamType} teamType - The team type (away or home)
 * @returns {Player} The starting pitcher for the given team
 * @example
 * extractStartingPitcherFromSwishLineupCard(lineupCard, rosterInfo, 'away')
 */
async function extractStartingPitcherFromSwishLineupCard(lineupCard: string, rosterInfo: MlbRosterApiResponse, teamId: number, teamType: TeamType): Promise<Player> {
  // Get the starting pitcher from html
  const pitcherSection = lineupCard.match(/<div class="row text-muted mar-top-5 pitcher-card-row">([\s\S]*?)<\/div>\s*<\/div>/);

  if (!pitcherSection) {
    throw new Error('No pitcher section found in lineup card');
  }

  // Match content between > and < that contains (R/L/S)
  const handednessMatches = pitcherSection[1].match(/>[^<]*\([RLS]\)[^<]*|>\([RLS]\)[^<]*/g) || [];
  
  // Extract and clean pitcher names
  const pitchers = handednessMatches
    .map(match => {
      // Remove the leading > and trim
      const cleanedName = match.substring(1).trim();
      return extractPitcherName(cleanedName);
    })
    .filter(name => name && name !== "(R)" && name !== "(L)" && name !== "(S)"); // Filter out standalone handedness

  if (pitchers.length < 2) {
    throw new Error(`Swish: Expected 2 pitchers, found ${pitchers.length}`);
  }

  // Get the appropriate pitcher based on team type
  const pitcherName = teamType === 'away' ? pitchers[0] : pitchers[1];

  // Convert to player object
  const pitcherId = await findPlayerId(pitcherName, 'pitcher', rosterInfo, teamId) || 999;
  const player: Player = {
    id: pitcherId,
    name: pitcherName,
    position: 'SP'
  };

  return player;
}

/**
 * Extracts the pitcher name from the raw text
 * @param {string} pitcherText - The raw pitcher text from HTML
 * @returns {string} The cleaned pitcher name
 */
function extractPitcherName(pitcherText: string): string {
  pitcherText = pitcherText.trim();
  
  // For format "(R) Jordan Hicks (0-0, -)" - name is after handedness and before record
  if (pitcherText.startsWith('(')) {
    // Split on first closing parenthesis to remove handedness
    const nameAndRecord = pitcherText.split(') ', 2)[1];
    // Split on opening parenthesis to remove record
    const name = nameAndRecord.split(' (', 2)[0];
    return name.trim();
  }
  // For format "Cristopher Sánchez (L)(0-0, -)" - name is before handedness
  else {
    // Split on first opening parenthesis
    const name = pitcherText.split(' (', 2)[0];
    return name.trim();
  }
}

/**
 * Finds the lineup card for a given game
 * @param {string} html - The HTML of the Swish Analytics page
 * @param {string} awayTeam - The away team
 * @param {string} homeTeam - The home team
 * @param {number} daySequenceNumber - The day sequence number
 * @returns {string} The lineup card for the given game
 * @example
 * getSwishLineupsLineupCard(html, 'Los Angeles Dodgers', 'Miami Marlins', 1)
 */
function getSwishLineupsLineupCard(html: string, awayTeam: string, homeTeam: string, daySequenceNumber: number) {
  // Find all lineup cards using regex
  const lineupCardRegex = /<div[^>]*class="[^"]*lineup-card[^"]*"[^>]*>[\s\S]*?<div class="text-center text-muted definitions mar-bottom-5">[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
  const lineupCards = html.match(lineupCardRegex) || [];

  if (lineupCards.length === 0) {
    throw new Error('No lineup cards found in HTML response');
  }

  // Find the relevant lineup card
  let relevantCard = null;
  let matchupCt = 0;
  const targetMatchup = createTargetMatchup(awayTeam, homeTeam);
  
  for (const card of lineupCards) {
    const h4Regex = /<h4[\s\S]*?>([\s\S]*?)<\/h4>/;
    const h4Match = card.match(h4Regex);
    
    if (h4Match) {
      // Extract the matchup text and clean it
      let matchupStr = h4Match[1];
      // Replace multiple &nbsp; with a single space
      matchupStr = matchupStr.replace(/&nbsp;&nbsp;/g, ' ').trim();
      
      if (matchupStr === targetMatchup) {
        matchupCt++;
        if (matchupCt === daySequenceNumber) {
          relevantCard = card;
          break;
        }
      }
    }
  }
  
  if (!relevantCard) {
    throw new Error('No matching game found in Swish Analytics data');
  }

  return relevantCard;
}

async function getSwishLineupsHtml(date: string) {
  // Get the desired url and info
  const url = `https://swishanalytics.com/optimus/mlb/lineups?date=${date}`;
  const response = await fetch(url);
  const html = await response.text();

  return html;
}
