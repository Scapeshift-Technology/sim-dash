import { SimResultsMLB, TotalsLinesMLB } from "@/types/bettingResults";
import { countsToAmericanOdds, proportionToAmericanOdds, countsToProbability } from "./oddsCalculations";
import { teamNameToAbbreviationMLB } from "./displayMLB";
import { displayAmericanOdds } from "./display";

// ---------- Summary display ----------
// ----- Main function -----

function calculateResultsSummaryDisplayMLB(simResults: SimResultsMLB, awayTeamName: string, homeTeamName: string): {
  topLine: string;
  bottomLine: string;
} {
  const { home, away } = simResults.sides;
  const homeWinCt = home.fullGame['0'].success;
  const awayWinCt = away.fullGame['0'].success;
  const totalsLine = findBreakevenTotalsLineMLB(simResults.totals.combined.fullGame);

  if (homeWinCt >= awayWinCt) {
    const homeOdds = countsToAmericanOdds(homeWinCt, awayWinCt);
    const shortenedOdds = Math.round(homeOdds);
    const displayTeamOdds = displayAmericanOdds(shortenedOdds);
    const teamAbbreviation = teamNameToAbbreviationMLB(homeTeamName);
    return {
      topLine: displayTotalsLine(totalsLine),
      bottomLine: `${teamAbbreviation}: ${displayTeamOdds}`
    }
  } else {
    const awayOdds = countsToAmericanOdds(awayWinCt, homeWinCt);
    const shortenedOdds = Math.round(awayOdds);
    const displayTeamOdds = displayAmericanOdds(shortenedOdds);
    const teamAbbreviation = teamNameToAbbreviationMLB(awayTeamName);
    return {
      topLine: `${teamAbbreviation}: ${displayTeamOdds}`,
      bottomLine: displayTotalsLine(totalsLine)
    }
  }
}

export { calculateResultsSummaryDisplayMLB };

// ----- Helper functions -----

function findBreakevenTotalsLineMLB(totalsLines: TotalsLinesMLB): {
  line: number;
  type: 'over' | 'under';
  odds: number;
} {
  let closestToEven = {
    line: 0,
    overProb: 0,
    underProb: 0,
    difference: Infinity
  };

  // Find the line with closest over/under odds
  Object.keys(totalsLines.over).forEach(lineStr => {
    const line = Number(lineStr);
    const overCounts = totalsLines.over[line];
    const underCounts = totalsLines.under[line];
    
    const overProb = countsToProbability(
      overCounts.success,
      overCounts.failure,
      overCounts.push || 0
    );
    
    const underProb = countsToProbability(
      underCounts.success,
      underCounts.failure,
      underCounts.push || 0
    );
    
    // Calculate how far each probability is from 0.5
    const difference = Math.abs(overProb - 0.5) + Math.abs(underProb - 0.5);
    
    if (difference < closestToEven.difference) {      
      closestToEven = {
        line,
        overProb,
        underProb,
        difference
      };
    }
  });

  // Return the side with better odds
  const overOdds = proportionToAmericanOdds(closestToEven.overProb);
  const underOdds = proportionToAmericanOdds(closestToEven.underProb);

  return {
    line: closestToEven.line,
    type: closestToEven.overProb > closestToEven.underProb ? 'over' : 'under',
    odds: closestToEven.overProb > closestToEven.underProb ? overOdds : underOdds
  };
}

function displayTotalsLine(totalsLine: {
  line: number;
  type: 'over' | 'under';
  odds: number;
}) {
  const typeAbbreviation = totalsLine.type === 'over' ? 'o' : 'u';
  const shortenedOdds = Math.round(totalsLine.odds);
  const displayOdds = shortenedOdds > 0 ? `+${shortenedOdds}` : shortenedOdds;
  return `${typeAbbreviation}${totalsLine.line} ${displayOdds}`;
}

