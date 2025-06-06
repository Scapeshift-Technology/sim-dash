import { 
  SidesCountsMLB, 
  SidesData, 
  OutcomeCounts, 
  TotalsData,
  TotalsCountsMLB, 
  SeriesData,
  PropsCountsMLB,
  FirstInningPropsData,
  FirstInningScoreCountsMLB,
  PropsData,
  PlayerPropsData,
  ScoringOrderPropsData,
  ScoringOrderCountsMLB,
  AllPlayersPropsCountsMLB,
  SeriesProbsMLB,
  TeamSeriesProbsMLB,
  ComparisonSidesData,
  ComparisonTotalsData,
  ComparisonFirstInningPropsData,
  ComparisonPlayerPropsData,
  ComparisonScoringOrderPropsData
} from "@/types/bettingResults";
import {
  teamNameToAbbreviationMLB
} from "@@/services/mlb/utils/teamName";

import { calculateUsaDiff, countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "./oddsCalculations";
import { sortSidesData, analyzeSidesCountsMLB } from "./displayMLB/sides";
import { analyzeTotalsCountsMLB, sortTotalsData } from "./displayMLB/totals";

export { teamNameToAbbreviationMLB };

// ---------- Tables ----------
// ----- Sides -----

function transformSidesCountsMLB(sidesCounts: SidesCountsMLB, awayTeamName: string, homeTeamName: string): SidesData[] {
  const allData = analyzeSidesCountsMLB(sidesCounts, awayTeamName, homeTeamName);
  return sortSidesData(allData);
}

export { transformSidesCountsMLB };

// ----- Totals -----

function transformTotalsCountsMLB(totalsCounts: TotalsCountsMLB, awayTeamName: string, homeTeamName: string): TotalsData[] {
  const allData = analyzeTotalsCountsMLB(totalsCounts, awayTeamName, homeTeamName);
  return sortTotalsData(allData);
}

export { transformTotalsCountsMLB };

// ----- Series -----

function transformSeriesProbsMLB(seriesProbs: SeriesProbsMLB, awayTeamName: string, homeTeamName: string): SeriesData[] {
  const { home, away } = seriesProbs;
  const homeData = transformTeamSeriesProbsMLB(home, homeTeamName);
  const awayData = transformTeamSeriesProbsMLB(away, awayTeamName);

  return [homeData, awayData];
}

function transformTeamSeriesProbsMLB(teamSeriesProbs: TeamSeriesProbsMLB, teamName: string): SeriesData {
  const { winPercent } = teamSeriesProbs;
  const usaFair = proportionToAmericanOdds(winPercent);

  return {
    team: teamName,
    winPercent: winPercent,
    usaFair: usaFair
  }
}

export { transformSeriesProbsMLB };

// ----- Props -----

function transformPropsCountsMLB(propsCounts: PropsCountsMLB, awayTeamName: string, homeTeamName: string): PropsData {
  const firstInningPropData = transformFirstInningCountsMLB(propsCounts.firstInning, awayTeamName, homeTeamName);
  const playerPropData = transformAllPlayerCountsMLB(propsCounts.player, awayTeamName, homeTeamName);
  const scoringOrderPropData = propsCounts.scoringOrder ? transformScoringOrderCountsMLB(propsCounts.scoringOrder, awayTeamName, homeTeamName) : undefined;

  return {
    firstInning: firstInningPropData,
    player: playerPropData,
    scoringOrder: scoringOrderPropData
  }
}

// -- Scoring order props --

function transformScoringOrderCountsMLB(scoringOrderCounts: ScoringOrderCountsMLB, awayTeamName: string, homeTeamName: string): ScoringOrderPropsData[] {
  const awayFirstData = transformScoringOrderTeamCountsMLB(scoringOrderCounts.away.first, awayTeamName, 'first');
  const homeFirstData = transformScoringOrderTeamCountsMLB(scoringOrderCounts.home.first, homeTeamName, 'first');
  const awayLastData = transformScoringOrderTeamCountsMLB(scoringOrderCounts.away.last, awayTeamName, 'last');
  const homeLastData = transformScoringOrderTeamCountsMLB(scoringOrderCounts.home.last, homeTeamName, 'last');

  return [awayFirstData, homeFirstData, awayLastData, homeLastData];
}

function transformScoringOrderTeamCountsMLB(outcomeCounts: OutcomeCounts, teamName: string, propType: 'first' | 'last'): ScoringOrderPropsData {
  const { success, failure, push, total } = outcomeCounts;
  
  const teamAbbrev = teamNameToAbbreviationMLB(teamName);

  const pushCt = push || 0;
  const percent = countsToProbability(success, failure, pushCt);
  const moe = marginOfError(total - pushCt, percent);
  const usaFair = proportionToAmericanOdds(percent);
  const varianceProportion = Math.min(Math.max(percent - moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);

  return {
    team: teamAbbrev,
    propType: propType,
    percent: percent,
    marginOfError: moe,
    usaFair: usaFair,
    varianceOdds: varianceOdds
  };
}

// -- Player props --

function transformAllPlayerCountsMLB(propsCounts: AllPlayersPropsCountsMLB, awayTeamName: string, homeTeamName: string): PlayerPropsData[] {
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

// -- First inning props --

function transformFirstInningCountsMLB(propsCounts: FirstInningScoreCountsMLB, awayTeamName: string, homeTeamName: string): FirstInningPropsData[] {
  const awayData = transformFirstInningScoreCountsMLB(propsCounts.away, awayTeamName);
  const homeData = transformFirstInningScoreCountsMLB(propsCounts.home, homeTeamName);
  const overallData = transformFirstInningScoreCountsMLB(propsCounts.overall, 'Overall');

  return [awayData, homeData, overallData];
}

function transformFirstInningScoreCountsMLB(outcomeCounts: OutcomeCounts, teamName: string): FirstInningPropsData {
  const { success, failure, push, total } = outcomeCounts;
  const pushCt = push || 0;
  const scorePercent = countsToProbability(success, failure, pushCt);
  const moe = marginOfError(total - pushCt, scorePercent);
  const usaOdds = countsToAmericanOdds(success, failure, pushCt);
  const varianceProportion = Math.min(Math.max(scorePercent - moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);
  const displayTeamName = teamName;

  return {
    team: displayTeamName,
    scorePercent: scorePercent,
    marginOfError: moe,
    usaFair: usaOdds,
    varianceOdds: varianceOdds
  };
}

export { transformPropsCountsMLB, transformFirstInningCountsMLB };

// ----- Comparison -----

// -- Sides --

function compareSidesDataRow(sidesData1: SidesData, sidesData2: SidesData): ComparisonSidesData {
  const { team, period, line, coverPercent: coverPercent1, usaFair: usaFair1 } = sidesData1;
  const { coverPercent: coverPercent2, usaFair: usaFair2 } = sidesData2;
  
  const diffCoverPercent = coverPercent2 - coverPercent1;
  const diffUsaFair = calculateUsaDiff(usaFair1, usaFair2);

  return {
    team: team,
    period: period,
    line: line,
    coverPercent: diffCoverPercent,
    usaFair: diffUsaFair
  }
}

function createComparisonSidesData(sim1SidesData: SidesData[], sim2SidesData: SidesData[]): ComparisonSidesData[] {
  const data: ComparisonSidesData[] = [];

  const sim2Map = new Map<string, SidesData>();
  sim2SidesData.forEach(sides => {
    const key = `${sides.team}|${sides.period}|${sides.line}`;
    sim2Map.set(key, sides);
  });

  sim1SidesData.forEach(sidesData1 => {
    const key = `${sidesData1.team}|${sidesData1.period}|${sidesData1.line}`;
    const sidesData2 = sim2Map.get(key);
    
    // Only compare if we have matching data in both simulations
    if (sidesData2) {
      const diffData = compareSidesDataRow(sidesData1, sidesData2);
      data.push(diffData);
    }
  });

  return data;
}

function transformComparisonSidesCountsMLB(sidesCounts1: SidesCountsMLB, sidesCounts2: SidesCountsMLB, awayTeamAbbrev: string, homeTeamAbbrev: string): ComparisonSidesData[] {
  const sim1SidesData: SidesData[] = transformSidesCountsMLB(sidesCounts1, awayTeamAbbrev, homeTeamAbbrev);
  const sim2SidesData: SidesData[] = transformSidesCountsMLB(sidesCounts2, awayTeamAbbrev, homeTeamAbbrev);

  const diffData = createComparisonSidesData(sim1SidesData, sim2SidesData);
  return diffData;
}

// -- Totals --

function compareTotalsDataRow(totalsData1: TotalsData, totalsData2: TotalsData): ComparisonTotalsData {
  const { team, period, line, overPercent: overPercent1, underPercent: underPercent1, pushPercent: pushPercent1, usaFairOver: usaFairOver1, usaFairUnder: usaFairUnder1 } = totalsData1;
  const { overPercent: overPercent2, underPercent: underPercent2, pushPercent: pushPercent2, usaFairOver: usaFairOver2, usaFairUnder: usaFairUnder2 } = totalsData2;

  const diffOverPercent = overPercent2 - overPercent1;
  const diffUnderPercent = underPercent2 - underPercent1;
  const diffPushPercent = pushPercent2 - pushPercent1;
  const diffUsaFairOver = calculateUsaDiff(usaFairOver1, usaFairOver2);
  const diffUsaFairUnder = calculateUsaDiff(usaFairUnder1, usaFairUnder2);

  return {
    team: team,
    period: period,
    line: line,
    overPercent: diffOverPercent,
    underPercent: diffUnderPercent,
    pushPercent: diffPushPercent,
    usaFairOver: diffUsaFairOver,
    usaFairUnder: diffUsaFairUnder
  }
}

function createComparisonTotalsData(sim1TotalsData: TotalsData[], sim2TotalsData: TotalsData[]): ComparisonTotalsData[] {
  const data: ComparisonTotalsData[] = [];

  const sim2Map = new Map<string, TotalsData>();
  sim2TotalsData.forEach(totals => {
    const key = `${totals.team}|${totals.period}|${totals.line}`;
    sim2Map.set(key, totals);
  });

  sim1TotalsData.forEach(totalsData1 => {
    const key = `${totalsData1.team}|${totalsData1.period}|${totalsData1.line}`;
    const totalsData2 = sim2Map.get(key);
    
    // Only compare if we have matching data in both simulations
    if (totalsData2) {
      const diffData = compareTotalsDataRow(totalsData1, totalsData2);
      data.push(diffData);
    }
  });

  return data;
}

function transformComparisonTotalsCountsMLB(totalsCounts1: TotalsCountsMLB, totalsCounts2: TotalsCountsMLB, awayTeamAbbrev: string, homeTeamAbbrev: string): ComparisonTotalsData[] {
  const sim1TotalsData: TotalsData[] = transformTotalsCountsMLB(totalsCounts1, awayTeamAbbrev, homeTeamAbbrev);
  const sim2TotalsData: TotalsData[] = transformTotalsCountsMLB(totalsCounts2, awayTeamAbbrev, homeTeamAbbrev);

  const diffData = createComparisonTotalsData(sim1TotalsData, sim2TotalsData);
  return diffData;
}

// -- Props --

function compareFirstInningPropsDataRow(firstInningData1: FirstInningPropsData, firstInningData2: FirstInningPropsData): ComparisonFirstInningPropsData {
  const { team, scorePercent: scorePercent1, usaFair: usaFair1 } = firstInningData1;
  const { scorePercent: scorePercent2, usaFair: usaFair2 } = firstInningData2;
  
  const diffScorePercent = scorePercent2 - scorePercent1;
  const diffUsaFair = calculateUsaDiff(usaFair1, usaFair2);

  return {
    team: team,
    scorePercent: diffScorePercent,
    usaFair: diffUsaFair
  }
}

function createComparisonFirstInningPropsData(sim1FirstInningData: FirstInningPropsData[], sim2FirstInningData: FirstInningPropsData[]): ComparisonFirstInningPropsData[] {
  const data: ComparisonFirstInningPropsData[] = [];

  const sim2Map = new Map<string, FirstInningPropsData>();
  sim2FirstInningData.forEach(prop => {
    const key = prop.team;
    sim2Map.set(key, prop);
  });

  sim1FirstInningData.forEach(firstInningData1 => {
    const key = firstInningData1.team;
    const firstInningData2 = sim2Map.get(key);
    
    // Only compare if we have matching data in both simulations
    if (firstInningData2) {
      const diffData = compareFirstInningPropsDataRow(firstInningData1, firstInningData2);
      data.push(diffData);
    }
  });

  return data;
}

function transformComparisonFirstInningPropsCountsMLB(firstInningCounts1: FirstInningScoreCountsMLB, firstInningCounts2: FirstInningScoreCountsMLB, awayTeamName: string, homeTeamName: string): ComparisonFirstInningPropsData[] {
  const sim1FirstInningData: FirstInningPropsData[] = transformFirstInningCountsMLB(firstInningCounts1, awayTeamName, homeTeamName);
  const sim2FirstInningData: FirstInningPropsData[] = transformFirstInningCountsMLB(firstInningCounts2, awayTeamName, homeTeamName);

  const diffData = createComparisonFirstInningPropsData(sim1FirstInningData, sim2FirstInningData);
  return diffData;
}

function comparePlayerPropsDataRow(playerData1: PlayerPropsData, playerData2: PlayerPropsData): ComparisonPlayerPropsData {
  const { playerName, teamName, statName, line, overPercent: overPercent1, usaFair: usaFair1 } = playerData1;
  const { overPercent: overPercent2, usaFair: usaFair2 } = playerData2;
  
  const diffOverPercent = overPercent2 - overPercent1;
  const diffUsaFair = calculateUsaDiff(usaFair1, usaFair2);

  return {
    playerName: playerName,
    teamName: teamName,
    statName: statName,
    line: line,
    overPercent: diffOverPercent,
    usaFair: diffUsaFair
  }
}

function createComparisonPlayerPropsData(sim1PlayerData: PlayerPropsData[], sim2PlayerData: PlayerPropsData[]): ComparisonPlayerPropsData[] {
  const data: ComparisonPlayerPropsData[] = [];

  const sim2Map = new Map<string, PlayerPropsData>();
  sim2PlayerData.forEach(prop => {
    const key = `${prop.playerName}|${prop.teamName}|${prop.statName}|${prop.line}`;
    sim2Map.set(key, prop);
  });

  sim1PlayerData.forEach(playerData1 => {
    const key = `${playerData1.playerName}|${playerData1.teamName}|${playerData1.statName}|${playerData1.line}`;
    const playerData2 = sim2Map.get(key);
    
    // Only compare if we have matching props in both simulations
    if (playerData2) {
      const diffData = comparePlayerPropsDataRow(playerData1, playerData2);
      data.push(diffData);
    }
  });

  return data;
}

function transformComparisonPlayerPropsCountsMLB(playerCounts1: AllPlayersPropsCountsMLB, playerCounts2: AllPlayersPropsCountsMLB, awayTeamName: string, homeTeamName: string): ComparisonPlayerPropsData[] {
  const sim1PlayerData: PlayerPropsData[] = transformAllPlayerCountsMLB(playerCounts1, awayTeamName, homeTeamName);
  const sim2PlayerData: PlayerPropsData[] = transformAllPlayerCountsMLB(playerCounts2, awayTeamName, homeTeamName);

  const diffData = createComparisonPlayerPropsData(sim1PlayerData, sim2PlayerData);
  return diffData;
}

function compareScoringOrderPropsDataRow(scoringOrderData1: ScoringOrderPropsData, scoringOrderData2: ScoringOrderPropsData): ComparisonScoringOrderPropsData {
  const { team, propType, percent: percent1, usaFair: usaFair1 } = scoringOrderData1;
  const { percent: percent2, usaFair: usaFair2 } = scoringOrderData2;
  
  const diffPercent = percent2 - percent1;
  const diffUsaFair = calculateUsaDiff(usaFair1, usaFair2);

  return {
    team: team,
    propType: propType,
    percent: diffPercent,
    usaFair: diffUsaFair
  }
}

function createComparisonScoringOrderPropsData(sim1ScoringOrderData: ScoringOrderPropsData[], sim2ScoringOrderData: ScoringOrderPropsData[]): ComparisonScoringOrderPropsData[] {
  const data: ComparisonScoringOrderPropsData[] = [];

  const sim2Map = new Map<string, ScoringOrderPropsData>();
  sim2ScoringOrderData.forEach(prop => {
    const key = `${prop.team}|${prop.propType}`;
    sim2Map.set(key, prop);
  });

  sim1ScoringOrderData.forEach(scoringOrderData1 => {
    const key = `${scoringOrderData1.team}|${scoringOrderData1.propType}`;
    const scoringOrderData2 = sim2Map.get(key);
    
    // Only compare if we have matching data in both simulations
    if (scoringOrderData2) {
      const diffData = compareScoringOrderPropsDataRow(scoringOrderData1, scoringOrderData2);
      data.push(diffData);
    }
  });

  return data;
}

function transformComparisonScoringOrderPropsCountsMLB(scoringOrderCounts1: ScoringOrderCountsMLB | undefined, scoringOrderCounts2: ScoringOrderCountsMLB | undefined, awayTeamName: string, homeTeamName: string): ComparisonScoringOrderPropsData[] {
  // Return empty array if either simulation doesn't have scoring order data
  if (!scoringOrderCounts1 || !scoringOrderCounts2) {
    return [];
  }

  const sim1ScoringOrderData: ScoringOrderPropsData[] = transformScoringOrderCountsMLB(scoringOrderCounts1, awayTeamName, homeTeamName);
  const sim2ScoringOrderData: ScoringOrderPropsData[] = transformScoringOrderCountsMLB(scoringOrderCounts2, awayTeamName, homeTeamName);

  const diffData = createComparisonScoringOrderPropsData(sim1ScoringOrderData, sim2ScoringOrderData);
  return diffData;
}

export { 
  transformComparisonSidesCountsMLB, 
  transformComparisonTotalsCountsMLB, 
  transformComparisonFirstInningPropsCountsMLB,
  transformComparisonPlayerPropsCountsMLB,
  transformComparisonScoringOrderPropsCountsMLB
};