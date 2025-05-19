import { 
  SidesCountsMLB, 
  TeamSidesCountsMLB, 
  SidesData, 
  SidesPeriodCountsMLB, 
  OutcomeCounts, 
  TotalsData,
  TotalsCountsMLB, 
  SeriesData,
  GamePeriodTotalsMLB, 
  TotalsLinesMLB,
  PropsCountsMLB,
  FirstInningPropsData,
  FirstInningScoreCountsMLB,
  PropsData,
  PlayerPropsData,
  AllPlayersPropsCountsMLB,
  SeriesProbsMLB,
  TeamSeriesProbsMLB
} from "@/types/bettingResults";
import { countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "./oddsCalculations";
import {
  teamNameToAbbreviationMLB
} from "@@/services/mlb/utils/teamName";

export { teamNameToAbbreviationMLB };

// ---------- Tables ----------
// ----- Sides -----

function transformSidesCountsMLB(sidesCounts: SidesCountsMLB, awayTeamName: string, homeTeamName: string): SidesData[] {
  const { home, away } = sidesCounts;
  const homeData = transformTeamSidesCountsMLB(home, homeTeamName);
  const awayData = transformTeamSidesCountsMLB(away, awayTeamName);

  return [...homeData, ...awayData];
}

function transformTeamSidesCountsMLB(teamSidesCounts: TeamSidesCountsMLB, teamName: string): SidesData[] {
  const { fullGame, firstFive } = teamSidesCounts;
  const fullGameData = transformSidesPeriodCountsMLB(fullGame, teamName, 'FG');
  const firstFiveData = transformSidesPeriodCountsMLB(firstFive, teamName, 'H1');

  return [...fullGameData, ...firstFiveData];
}

function transformSidesPeriodCountsMLB(gamePeriodCounts: SidesPeriodCountsMLB, teamName: string, period: string): SidesData[] {
  const lines = Object.keys(gamePeriodCounts);

  const data: SidesData[] = [];

  for (const line of lines) {
    const lineData = transformSidesOutcomeCountsMLB(gamePeriodCounts[line], teamName, period, line);
    data.push(lineData);
  }

  return data;
}

function transformSidesOutcomeCountsMLB(outcomeCounts: OutcomeCounts, teamName: string, period: string, line: string): SidesData {
  const { success, failure, push, total } = outcomeCounts;
  const pushCt = push || 0;
  const coverPercent = countsToProbability(success, failure, pushCt);
  const moe = marginOfError(total - pushCt, coverPercent);
  const usaOdds = countsToAmericanOdds(success, failure, pushCt);
  const varianceProportion = Math.min(Math.max(coverPercent + moe, 0), 1);
  const varianceOdds = proportionToAmericanOdds(varianceProportion);
  const lineNumber = parseFloat(line);

  return {
    team: teamName,
    period: period,
    line: lineNumber,
    coverPercent: coverPercent,
    marginOfError: moe,
    usaFair: usaOdds,
    varianceOdds: varianceOdds
  }
}

export { transformSidesCountsMLB };

// ----- Totals -----

function transformTotalsCountsMLB(totalsCounts: TotalsCountsMLB, awayTeamName: string, homeTeamName: string): TotalsData[] {
  const { combined, home, away } = totalsCounts;
  const combinedData = transformGamePeriodTotalsMLB(combined, 'Combined');
  const homeData = transformGamePeriodTotalsMLB(home, homeTeamName);
  const awayData = transformGamePeriodTotalsMLB(away, awayTeamName);

  return [...combinedData, ...homeData, ...awayData];
}

function transformGamePeriodTotalsMLB(gamePeriodTotals: GamePeriodTotalsMLB, teamName: string): TotalsData[] {
  const { fullGame, firstFive } = gamePeriodTotals;
  const fullGameData = transformTotalsLinesMLB(fullGame, teamName, 'FG');
  const firstFiveData = transformTotalsLinesMLB(firstFive, teamName, 'H1');

  return [...fullGameData, ...firstFiveData];
}

function transformTotalsLinesMLB(totalsLines: TotalsLinesMLB, teamName: string, period: string): TotalsData[] {
  // Convert keys to numbers and sort them numerically
  const lines = Object.keys(totalsLines.over)
    .map(Number)
    .sort((a, b) => a - b);
  const data: TotalsData[] = [];

  for (const lineNumber of lines) {
    const lineData = transformTotalsOutcomeCountsMLB(
      totalsLines.over[lineNumber],
      totalsLines.under[lineNumber],
      teamName,
      period,
      lineNumber.toString()
    );
    data.push(lineData);
  }

  return data;
}

function transformTotalsOutcomeCountsMLB(
  overCounts: OutcomeCounts,
  underCounts: OutcomeCounts,
  teamName: string,
  period: string,
  line: string
): TotalsData {
  const overPercent = countsToProbability(overCounts.success, overCounts.failure, overCounts.push || 0);
  const underPercent = countsToProbability(underCounts.success, underCounts.failure, underCounts.push || 0);
  const pushPercent = (overCounts.push || 0) / overCounts.total;
  const moe = marginOfError(overCounts.total - (overCounts.push || 0), overPercent);
  
  const usaFairOver = countsToAmericanOdds(overCounts.success, overCounts.failure, overCounts.push || 0);
  const usaFairUnder = countsToAmericanOdds(underCounts.success, underCounts.failure, underCounts.push || 0);
  
  const varianceProportionOver = Math.min(Math.max(overPercent - moe, 0), 1);
  const varianceProportionUnder = Math.min(Math.max(underPercent - moe, 0), 1);
  const varianceOddsOver = proportionToAmericanOdds(varianceProportionOver);
  const varianceOddsUnder = proportionToAmericanOdds(varianceProportionUnder);
  
  const lineNumber = parseFloat(line);
  const displayTeamName = teamName;

  return {
    team: displayTeamName,
    period: period,
    line: lineNumber,
    overPercent: overPercent,
    underPercent: underPercent,
    pushPercent: pushPercent,
    marginOfError: moe,
    usaFairOver: usaFairOver,
    usaFairUnder: usaFairUnder,
    varianceOddsOver: varianceOddsOver,
    varianceOddsUnder: varianceOddsUnder
  };
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

  return {
    firstInning: firstInningPropData,
    player: playerPropData
  }
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
  const varianceProportion = Math.min(Math.max(overPercent + moe, 0), 1);
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
  const varianceProportion = Math.min(Math.max(scorePercent + moe, 0), 1);
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