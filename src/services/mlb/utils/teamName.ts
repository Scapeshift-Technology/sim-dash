const teamAbbrevsObj: Record<string, string> = {
  "Arizona Diamondbacks": "AZ",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CWS",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  "Athletics": "ATH",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Saint Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WSH"
};
  
/**
  * Converts a team name to an abbreviation that is used by Swish analytics
  * @param {string} teamName - The name of the team
  * @returns {string} The abbreviation of the team
  * @example
  * convert_team_to_abbrev('Los Angeles Dodgers')
  */
function teamNameToAbbreviationMLB(teamName: string) {
  return teamAbbrevsObj[teamName.trim()] || teamName;
}
  
/**
  * Creates the target matchup string that is used by Swish analytics
  * @param {string} awayTeam - The name of the away team
   * @param {string} homeTeam - The name of the home team
   * @returns {string} The target matchup string
   * @example
   * createTargetMatchup('Los Angeles Dodgers', 'Miami Marlins')
   */
function createTargetMatchup(awayTeam: string, homeTeam: string) {
  const awayAbbrev = teamNameToAbbreviationMLB(awayTeam);
  const homeAbbrev = teamNameToAbbreviationMLB(homeTeam);
  return `${awayAbbrev} @ ${homeAbbrev}`;
}

export { teamNameToAbbreviationMLB, createTargetMatchup };