import { 
  PlayerPropsData, 
  AllPlayersPropsCountsMLB, 
  OutcomeCounts 
} from "@/types/bettingResults";

import { countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "@/apps/simDash/utils/oddsCalculations";

// ---------- Main function ----------

function analyzeAllPlayerCountsMLB(propsCounts: AllPlayersPropsCountsMLB, awayTeamName: string, homeTeamName: string): PlayerPropsData[] {
  const data = transformAllPlayerCountsMLB(propsCounts);
  return sortPlayerPropsData(data, awayTeamName);
}

export { analyzeAllPlayerCountsMLB };

// ---------- Helper functions ----------

function transformAllPlayerCountsMLB(propsCounts: AllPlayersPropsCountsMLB): PlayerPropsData[] {
  const data: PlayerPropsData[] = [];

  // Loop through all of the players
  for (const playerID of Object.keys(propsCounts)) {
    const playerData = propsCounts[Number(playerID)];
    const playerName = playerData.playerName;
    const teamName = playerData.teamName;
    // Loop through the player's stats
    for (const stat of Object.keys(playerData.stats)) {
      // Loop through the stat's lines
      for (const line of Object.keys(playerData.stats[stat])) {
        const lineNumber = parseFloat(line);
        const lineData = transformPlayerStatLinesPropsCountsMLB(playerName, stat, lineNumber, playerData.stats[stat][lineNumber], teamName);
        data.push(lineData);
      }
    }
  }

  return data;
}

function transformPlayerStatLinesPropsCountsMLB(playerName: string, statName: string, lineNumber: number, statData: OutcomeCounts, teamName: string): PlayerPropsData {
  // Return values for the given line
  const { success, failure, push, total } = statData;
  const pushCt = push || 0;
  const overPercent = countsToProbability(success, failure, pushCt);
  const moe = marginOfError(total - pushCt, overPercent);
  const usaOdds = countsToAmericanOdds(success, failure, pushCt);
  const varianceProportion = Math.min(Math.max(overPercent - moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);

  return {
    playerName: playerName,
    teamName: teamName,
    statName: statName,
    line: lineNumber,
    overPercent: overPercent,
    marginOfError: moe,
    usaFair: usaOdds,
    varianceOdds: varianceOdds
  };
}

// ---------- Sorting ----------

function sortPlayerPropsData(data: PlayerPropsData[], awayTeamName: string): PlayerPropsData[] {
  return data.sort((a, b) => {
    // 1. Sort by team (away first)
    const aIsAway = a.teamName === awayTeamName;
    const bIsAway = b.teamName === awayTeamName;
    if (aIsAway && !bIsAway) return -1;
    if (!aIsAway && bIsAway) return 1;
    if (aIsAway === bIsAway && a.teamName !== b.teamName) {
      return a.teamName.localeCompare(b.teamName);
    }
    
    // 2. Sort by player name (alphabetically)
    const playerOrder = a.playerName.localeCompare(b.playerName);
    if (playerOrder !== 0) return playerOrder;
    
    // 3. Sort by stat name (alphabetically)
    const statOrder = a.statName.localeCompare(b.statName);
    if (statOrder !== 0) return statOrder;
    
    // 4. Sort by line (smallest first)
    return a.line - b.line;
  });
}

export { sortPlayerPropsData };
