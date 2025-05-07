import { SidesCountsMLB, TeamSidesCountsMLB, SidesData, SidesPeriodCountsMLB, OutcomeCounts } from "@/types/bettingResults";
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