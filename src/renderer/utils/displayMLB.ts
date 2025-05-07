import { 
  SidesCountsMLB, 
  TeamSidesCountsMLB, 
  SidesData, 
  SidesPeriodCountsMLB, 
  OutcomeCounts, 
  TotalsData,
  TotalsCountsMLB, 
  GamePeriodTotalsMLB, 
  TotalsLinesMLB,
  PropsCountsMLB,
  FirstInningPropsData
} from "@/types/bettingResults";
import { countsToAmericanOdds, countsToProbability, marginOfError, proportionToAmericanOdds } from "./oddsCalculations";

// ---------- Team Names ----------

function teamNameToAbbreviationMLB(teamName: string): string {
  const team_abbrevs: Record<string, string> = {
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
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WSH"
  };
    
  return team_abbrevs[teamName.trim()] || teamName;
}

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
  const lines = Object.keys(totalsLines.over);
  const data: TotalsData[] = [];

  for (const line of lines) {
    const lineNumber = parseFloat(line);

    const lineData = transformTotalsOutcomeCountsMLB(
      totalsLines.over[lineNumber],
      totalsLines.under[lineNumber],
      teamName,
      period,
      line
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
  
  const varianceProportionOver = Math.min(Math.max(overPercent + moe, 0), 1);
  const varianceProportionUnder = Math.min(Math.max(underPercent + moe, 0), 1);
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

// ----- Props -----

function transformPropsCountsMLB(propsCounts: PropsCountsMLB, awayTeamName: string, homeTeamName: string): FirstInningPropsData[] {
  const { firstInning } = propsCounts;
  const awayData = transformFirstInningScoreCountsMLB(firstInning.away, awayTeamName);
  const homeData = transformFirstInningScoreCountsMLB(firstInning.home, homeTeamName);
  const overallData = transformFirstInningScoreCountsMLB(firstInning.overall, 'Overall');

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

export { transformPropsCountsMLB };