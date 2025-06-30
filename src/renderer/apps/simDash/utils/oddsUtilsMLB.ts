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
  if (
    !simResults.sides || !simResults.sides?.away.fullGame?.['0'] || !simResults.sides?.home?.fullGame?.['0'] ||
    !simResults.totals.combined.fullGame
  ) return { topLine: 'N/A', bottomLine: 'N/A' };
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

// ---------- Betting bounds formatting ----------

// Format USA prices with the requested rules
function formatUSAPrice(value: string): string {
  const num = parseFloat(value);
  
  // Handle exactly 100 case
  if (Math.abs(num) === 100) {
    return 'EV';
  }
  
  // Handle values between [100, 200) - drop leading 1 digit
  if (Math.abs(num) >= 100 && Math.abs(num) < 200) {
    const lastTwoDigits = Math.abs(num) % 100;
    const sign = num >= 0 ? '+' : '-';
    return `${sign}${lastTwoDigits}`;
  }
  
  // For all other values, show + for positive, - for negative
  if (num >= 0) {
    return `+${num}`;
  } else {
    return `${num}`;
  }
}

export function formatBettingBoundsDisplay(
  bettingBounds: { awayML: string; homeML: string; totalLine: string; overOdds: string; underOdds: string },
  awayTeamName: string,
  homeTeamName: string
): {
  topLine: string;
  bottomLine: string;
} {
  const awayAbbrev = teamNameToAbbreviationMLB(awayTeamName);
  const homeAbbrev = teamNameToAbbreviationMLB(homeTeamName);
  
  // Format moneyline: [NYM+50 PIT-70] (always away team first, single space between teams)
  const awayML = formatUSAPrice(bettingBounds.awayML);
  const homeML = formatUSAPrice(bettingBounds.homeML);
  const moneyline = `[${awayAbbrev}${awayML} ${homeAbbrev}${homeML}]`;
  
  // Format totals: 8 o-20 uEV (spaces after main number and after over price)
  const overOdds = formatUSAPrice(bettingBounds.overOdds);
  const underOdds = formatUSAPrice(bettingBounds.underOdds);
  const totals = `${bettingBounds.totalLine} o${overOdds} u${underOdds}`;
  
  return {
    topLine: moneyline,
    bottomLine: totals
  };
}

// Check if betting bounds data is complete and valid
export function isBettingBoundsComplete(
  bettingBounds: { awayML: string; homeML: string; totalLine: string; overOdds: string; underOdds: string } | null
): boolean {
  if (!bettingBounds) return false;
  
  return !!(
    bettingBounds.awayML.trim() &&
    bettingBounds.homeML.trim() &&
    bettingBounds.totalLine.trim() &&
    bettingBounds.overOdds.trim() &&
    bettingBounds.underOdds.trim()
  );
}

