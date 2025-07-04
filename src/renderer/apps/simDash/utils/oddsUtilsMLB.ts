import { SimResultsMLB, TotalsLinesMLB } from "@/types/bettingResults";
import { countsToAmericanOdds, proportionToAmericanOdds, countsToProbability } from "./oddsCalculations";
import { teamNameToAbbreviationMLB } from "./displayMLB";
import { formatAmericanOdds } from "./display";

// ========================================
// SIMULATION SUMMARY DISPLAY
// ========================================

/**
 * Calculate display lines for simulation results summary
 * Returns fair odds in shortened format for display
 */
function calculateResultsSummaryDisplayMLB(simResults: SimResultsMLB, awayTeamName: string, homeTeamName: string): {
  topLine: string;
  bottomLine: string;
} {
  // Validate required simulation data
  if (
    !simResults.sides?.away.fullGame?.['0'] || 
    !simResults.sides?.home.fullGame?.['0'] ||
    !simResults.totals.combined.fullGame
  ) {
    return { topLine: 'N/A', bottomLine: 'N/A' };
  }

  const { home, away } = simResults.sides;
  const homeWinCt = home.fullGame['0'].success;
  const awayWinCt = away.fullGame['0'].success;
  const homePushCt = home.fullGame['0'].push || 0;
  const awayPushCt = away.fullGame['0'].push || 0;
  const totalsLine = findBreakevenTotalsLineMLB(simResults.totals.combined.fullGame);

  // Display the favored team (higher win count)
  if (homeWinCt >= awayWinCt) {
    const homeOdds = countsToAmericanOdds(homeWinCt, awayWinCt, homePushCt, false);
    const displayTeamOdds = formatAmericanOdds(homeOdds, { shortened: true });
    const teamAbbreviation = teamNameToAbbreviationMLB(homeTeamName);
    return {
      topLine: displayTotalsLine(totalsLine),
      bottomLine: `${teamAbbreviation} ${displayTeamOdds}`
    }
  } else {
    const awayOdds = countsToAmericanOdds(awayWinCt, homeWinCt, awayPushCt, false);
    const displayTeamOdds = formatAmericanOdds(awayOdds, { shortened: true });
    const teamAbbreviation = teamNameToAbbreviationMLB(awayTeamName);
    return {
      topLine: `${teamAbbreviation} ${displayTeamOdds}`,
      bottomLine: displayTotalsLine(totalsLine)
    }
  }
}

export { calculateResultsSummaryDisplayMLB };

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Find the totals line closest to even odds (50/50)
 */
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

  // Find the line with probabilities closest to 0.5
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

/**
 * Format a totals line for display (e.g., "o8 +105")
 */
function displayTotalsLine(totalsLine: {
  line: number;
  type: 'over' | 'under';
  odds: number;
}) {
  const typeAbbreviation = totalsLine.type === 'over' ? 'o' : 'u';
  const displayOdds = formatAmericanOdds(totalsLine.odds, { shortened: true });
  return `${typeAbbreviation}${totalsLine.line} ${displayOdds}`;
}

// ========================================
// BETTING BOUNDS DISPLAY
// ========================================

/**
 * Calculate fair values from simulation results
 * Returns raw numbers for formatting in display functions
 */
function calculateFairValues(simResults: SimResultsMLB): {
  favoredSideOdds: number;        // Fair odds for the favored side (for sign-neutral display)
  totalFavoredType: 'over' | 'under';  // Which side is favored for totals
  totalFavoredOdds: number;       // Fair odds for the favored totals side
  totalLine: number;              // The total line number
} | null {
  // Validate required simulation data
  if (
    !simResults.sides?.away.fullGame?.['0'] || 
    !simResults.sides?.home.fullGame?.['0'] ||
    !simResults.totals.combined.fullGame
  ) {
    return null;
  }

  const { home, away } = simResults.sides;
  const homeWinCt = home.fullGame['0'].success;
  const awayWinCt = away.fullGame['0'].success;
  const homePushCt = home.fullGame['0'].push || 0;
  const awayPushCt = away.fullGame['0'].push || 0;
  const totalsLine = findBreakevenTotalsLineMLB(simResults.totals.combined.fullGame);

  // Get the favored side (better odds) for moneyline display
  const favoredSideOdds = homeWinCt >= awayWinCt 
    ? countsToAmericanOdds(homeWinCt, awayWinCt, homePushCt, false)
    : countsToAmericanOdds(awayWinCt, homeWinCt, awayPushCt, false);

  // Use the totals information directly from the breakeven calculation
  return {
    favoredSideOdds,
    totalFavoredType: totalsLine.type,
    totalFavoredOdds: Math.round(totalsLine.odds),
    totalLine: totalsLine.line
  };
}

/**
 * Format betting bounds with optional fair values for simulation summary display
 * Returns shortened format suitable for compact display
 */
export function formatBettingBoundsDisplay(
  bettingBounds: { awayML: string; homeML: string; totalLine: string; overOdds: string; underOdds: string },
  awayTeamName: string,
  homeTeamName: string,
  simResults?: SimResultsMLB
): {
  topLine: string;
  bottomLine: string;
} {
  const awayAbbrev = teamNameToAbbreviationMLB(awayTeamName);
  const homeAbbrev = teamNameToAbbreviationMLB(homeTeamName);
  
  // Format the betting bounds odds (shortened for summary display)
  const awayML = formatAmericanOdds(parseFloat(bettingBounds.awayML), { shortened: true });
  const homeML = formatAmericanOdds(parseFloat(bettingBounds.homeML), { shortened: true });
  const overOdds = formatAmericanOdds(parseFloat(bettingBounds.overOdds), { shortened: true });
  const underOdds = formatAmericanOdds(parseFloat(bettingBounds.underOdds), { shortened: true });
  
  // Calculate fair values if simulation results are available
  const fairValues = simResults ? calculateFairValues(simResults) : null;
  
  let moneyline: string;
  let totals: string;
  
  if (fairValues) {
    // Format with fair values in parentheses
    // Moneyline: MIL +44 (50) NYM -56  (fair value is sign-neutral)
    moneyline = `${awayAbbrev} ${awayML} (${formatAmericanOdds(fairValues.favoredSideOdds, { shortened: true, signNeutral: true })}) ${homeAbbrev} ${homeML}`;
    
    // Totals: 8 o -15 (o8.5 -04) u -5  (fair value shows the favored side with median line)
    const favoredTypeAbbrev = fairValues.totalFavoredType === 'over' ? 'o' : 'u';
    totals = `${bettingBounds.totalLine} o ${overOdds} (${favoredTypeAbbrev}${fairValues.totalLine} ${formatAmericanOdds(fairValues.totalFavoredOdds, { shortened: true })}) u ${underOdds}`;
  } else {
    // Format without fair values
    moneyline = `${awayAbbrev} ${awayML} ${homeAbbrev} ${homeML}`;
    totals = `${bettingBounds.totalLine} o ${overOdds} u ${underOdds}`;
  }
  
  return {
    topLine: moneyline,
    bottomLine: totals
  };
}

/**
 * Validate that all required betting bounds fields are present and non-empty
 */
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
