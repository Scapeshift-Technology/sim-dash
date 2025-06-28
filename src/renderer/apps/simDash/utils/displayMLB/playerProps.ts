import { 
  PlayerPropsData, 
  AllPlayersPropsCountsMLB, 
  OutcomeCounts 
} from "@/types/bettingResults";

import { countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "@/apps/simDash/utils/oddsCalculations";
import { calculateROIDemandPrice } from "@/apps/simDash/utils/roiCalculations";
import { 
  sortWithConfig, 
  awayTeamFirstComparator, 
  playerNameComparator, 
  statNameComparator, 
  lineComparator,
  type SortConfig 
} from "./sorting";
import { teamNameToAbbreviationMLB } from "@@/services/mlb/utils/teamName";


// ---------- Main function ----------

function analyzeAllPlayerCountsMLB(propsCounts: AllPlayersPropsCountsMLB, awayTeamName: string, homeTeamName: string, roiDemandDecimal?: number): PlayerPropsData[] {
  const data = transformAllPlayerCountsMLB(propsCounts, roiDemandDecimal);
  return sortPlayerPropsData(data, awayTeamName);
}

export { analyzeAllPlayerCountsMLB };

// ---------- Helper functions ----------

function transformAllPlayerCountsMLB(propsCounts: AllPlayersPropsCountsMLB, roiDemandDecimal?: number): PlayerPropsData[] {
  const data: PlayerPropsData[] = [];

  // Loop through all of the players
  for (const playerID of Object.keys(propsCounts)) {
    const playerData = propsCounts[Number(playerID)];
    const playerName = playerData.playerName;
    const teamName = teamNameToAbbreviationMLB(playerData.teamName);
    // Loop through the player's stats
    for (const stat of Object.keys(playerData.stats)) {
      // Loop through the stat's lines
      for (const line of Object.keys(playerData.stats[stat])) {
        const lineNumber = parseFloat(line);
        const lineData = transformPlayerStatLinesPropsCountsMLB(playerName, stat, lineNumber, playerData.stats[stat][lineNumber], teamName, roiDemandDecimal);
        data.push(lineData);
      }
    }
  }

  return data;
}

function transformPlayerStatLinesPropsCountsMLB(playerName: string, statName: string, lineNumber: number, statData: OutcomeCounts, teamName: string, roiDemandDecimal?: number): PlayerPropsData {
  // Return values for the given line
  const { success, failure, push, total } = statData;
  const pushCt = push || 0;
  const overPercent = countsToProbability(success, failure, pushCt);
  const moe = marginOfError(total - pushCt, overPercent);
  const usaOdds = countsToAmericanOdds(success, failure, pushCt);
  const varianceProportion = Math.min(Math.max(overPercent - moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);
  const usaDemandPrice = typeof roiDemandDecimal === 'number' ? calculateROIDemandPrice(overPercent, moe, roiDemandDecimal) : null;

  return {
    playerName: playerName,
    teamName: teamName,
    statName: statName,
    line: lineNumber,
    overPercent: overPercent,
    marginOfError: moe,
    usaFair: usaOdds,
    varianceOdds: varianceOdds,
    usaDemandPrice: usaDemandPrice
  };
}

// ---------- Sorting ----------

const playerPropsDataSortConfig: SortConfig<PlayerPropsData> = [
  {
    key: 'teamName',
    direction: 'asc',
    compareFn: awayTeamFirstComparator
  },
  {
    key: 'playerName',
    direction: 'asc',
    compareFn: playerNameComparator
  },
  {
    key: 'statName',
    direction: 'asc',
    compareFn: statNameComparator
  },
  {
    key: 'line',
    direction: 'asc',
    compareFn: lineComparator
  }
];

function sortPlayerPropsData(data: PlayerPropsData[], awayTeamName: string): PlayerPropsData[] {
  return sortWithConfig(data, playerPropsDataSortConfig, { awayTeamName });
}

export { sortPlayerPropsData };
