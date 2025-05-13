import type { 
    MarketLinesMLB, 
    MarketLineDifferenceMLB
  } from "@/types/mlb";
  import type { MLBGameInputs, MLBLineups, MLBSimInputs, MLBSimInputsTeam } from "@/types/simInputs";
  import { runSimulation } from "./simulation";
  import { SimResultsMLB } from "@@/types/bettingResults";
  import { americanOddsToProbability, countsToProbability } from "@/utils/oddsCalculations";
  
  // ---------- Main function ----------
  
  async function findOptimalLeans(
      lineups: MLBLineups,
      marketLines: MarketLinesMLB
  ) {
    // Set up before finding the optimal leans
    const initialTeamLean: MLBSimInputsTeam = {
      teamHitterLean: 0,
      teamPitcherLean: 0,
      individualHitterLeans: {},
      individualPitcherLeans: {}
    }
  
    let leans: MLBSimInputs = {
      away: initialTeamLean,
      home: initialTeamLean
    }
  
    let adjustments: MLBSimInputs = {
      away: initialTeamLean,
      home: initialTeamLean
    }
    
    // Iteratively find leans that work
    let iterations = 0;
    const maxIterations = 10;
    
    while (iterations < maxIterations) {
      const gameInputs: MLBGameInputs = {
        lineups: lineups,
        inputs: leans
      }
  
      // Run the sim
      const simResults = await runSimulation(gameInputs);
  
      // Find where the lines and sim results differ(or are close)
      const diffs = findLineDifferences(simResults, marketLines);
      console.log(`ITERATION ${iterations + 1}: DIFFS:`, JSON.stringify(diffs, null, 2));
  
      // If the sim results are in the bounds, break
      if (shouldBreak(diffs)) {
        break;
      }
  
      // Find the proper adjustment to make
      adjustments = findAdjustments(diffs, leans);
  
      // Make the adjustment
      leans = addMLBSimInputsObjects(leans, adjustments);
  
      iterations++;
    }
  
    const updatedLeans = addMLBSimInputsObjects(leans, adjustments);
    return updatedLeans;
  }
  
  export { findOptimalLeans };
  
  // ---------- Helper functions ----------
  
  function findAdjustments(diffs: MarketLineDifferenceMLB, leans: MLBSimInputs): MLBSimInputs {
    // Initialize adjustments
    const adjustments: MLBSimInputs = {
      away: {
        teamHitterLean: 0,
        teamPitcherLean: 0,
        individualHitterLeans: {},
        individualPitcherLeans: {}
      },
      home: {
        teamHitterLean: 0,
        teamPitcherLean: 0,
        individualHitterLeans: {},
        individualPitcherLeans: {}
      }
    }
  
    // Determine moneyline direction and magnitude
    const mlMarketLine = (diffs.mlAway.lowerBound + diffs.mlAway.upperBound) / 2;
    const mlAwayDiff = 100 * (diffs.mlAway.simValue - mlMarketLine);
    const mlInBounds = diffs.mlAway.simValue < diffs.mlAway.upperBound && diffs.mlAway.simValue > diffs.mlAway.lowerBound;
  
    // Determine total direction and magnitude
    const totalMarketLine = (diffs.total.lowerBound + diffs.total.upperBound) / 2;
    const totalDiff = 100 * (diffs.total.simValue - totalMarketLine);
    const totalInBounds = diffs.total.simValue < diffs.total.upperBound && diffs.total.simValue > diffs.total.lowerBound;
  
    // Determine the direction and magnitude of the adjustments
    const mlAdjustmentSize = Math.abs(mlAwayDiff) / 8; // Adjustment size is 1/2 of the diff split between hitters and pitchers of both teams
    const totalAdjustmentSize = Math.abs(totalDiff) / 8;
    const adjustmentThreshold = .5; // Only adjust if more than .5% off
  
    // Handle moneyline adjustments
    if (Math.abs(mlAwayDiff) > adjustmentThreshold || !mlInBounds) {
      if (mlAwayDiff > 0) {
        // Away team too strong - weaken away team and strengthen home team
        adjustments.away.teamHitterLean = -mlAdjustmentSize;
        adjustments.away.teamPitcherLean = -mlAdjustmentSize;
        adjustments.home.teamHitterLean = mlAdjustmentSize;
        adjustments.home.teamPitcherLean = mlAdjustmentSize;
      } else {
        // Away team too weak - strengthen away team and weaken home team
        adjustments.away.teamHitterLean = mlAdjustmentSize;
        adjustments.away.teamPitcherLean = mlAdjustmentSize;
        adjustments.home.teamHitterLean = -mlAdjustmentSize;
        adjustments.home.teamPitcherLean = -mlAdjustmentSize;
      }
    }
  
    // Handle total adjustments
    if (Math.abs(totalDiff) > adjustmentThreshold || !totalInBounds) {
      if (totalDiff > 0) {
        // Total too high - decrease scoring
        adjustments.away.teamPitcherLean = totalAdjustmentSize;
        adjustments.home.teamPitcherLean = totalAdjustmentSize;
        adjustments.away.teamHitterLean = -totalAdjustmentSize;
        adjustments.home.teamHitterLean = -totalAdjustmentSize;
      } else {
        // Total too low - increase scoring
        adjustments.away.teamPitcherLean = -totalAdjustmentSize;
        adjustments.home.teamPitcherLean = -totalAdjustmentSize;
        adjustments.away.teamHitterLean = totalAdjustmentSize;
        adjustments.home.teamHitterLean = totalAdjustmentSize;
      }
    }
  
    return adjustments;
  }
  
  function addMLBSimInputsObjects(leans1: MLBSimInputs, leans2: MLBSimInputs): MLBSimInputs {
    return {
      away: addMLBSimInputsTeamObjects(leans1.away, leans2.away),
      home: addMLBSimInputsTeamObjects(leans1.home, leans2.home)
    }
  }
  
  function addMLBSimInputsTeamObjects(leans1: MLBSimInputsTeam, leans2: MLBSimInputsTeam): MLBSimInputsTeam {
    return {
      teamHitterLean: Math.max(-10, Math.min(10, leans1.teamHitterLean + leans2.teamHitterLean)),
      teamPitcherLean: Math.max(-10, Math.min(10, leans1.teamPitcherLean + leans2.teamPitcherLean)),
      individualHitterLeans: { ...leans1.individualHitterLeans },
      individualPitcherLeans: { ...leans1.individualPitcherLeans }
    }
  }
  
  function shouldBreak(diffs: MarketLineDifferenceMLB): boolean {
    const lowerMidwayPointML = diffs.mlAway.lowerBound + (diffs.mlAway.upperBound - diffs.mlAway.lowerBound) / 4;
    const upperMidwayPointML = diffs.mlAway.lowerBound + (diffs.mlAway.upperBound - diffs.mlAway.lowerBound) * 3 / 4;
    const lowerMidwayPointTotal = diffs.total.lowerBound + (diffs.total.upperBound - diffs.total.lowerBound) / 4;
    const upperMidwayPointTotal = diffs.total.lowerBound + (diffs.total.upperBound - diffs.total.lowerBound) * 3 / 4;

    return (
      diffs.mlAway.simValue < upperMidwayPointML &&
      diffs.mlAway.simValue > lowerMidwayPointML &&
      diffs.total.simValue < upperMidwayPointTotal &&
      diffs.total.simValue > lowerMidwayPointTotal
    )
  }
  
  function findLineDifferences(simResults: SimResultsMLB, marketLines: MarketLinesMLB): MarketLineDifferenceMLB {
    // Find the sim results
    const awayML = countsToProbability(simResults.sides.away.fullGame['0'].success, simResults.sides.away.fullGame['0'].failure, simResults.sides.away.fullGame['0'].push || 0);
    const totalOver = countsToProbability(simResults.totals.combined.fullGame.over[marketLines.over.line].success, simResults.totals.combined.fullGame.over[marketLines.over.line].failure, simResults.totals.combined.fullGame.over[marketLines.over.line].push || 0);
  
    // Format the market lines
    const marketAwayML_upperBound = americanOddsToProbability(marketLines.awayML);
    const marketHomeML_lowerBound = 1 - americanOddsToProbability(marketLines.homeML);
    const marketTotalOver_upperBound = americanOddsToProbability(marketLines.over.odds);
    const marketTotalOver_lowerBound = 1 - americanOddsToProbability(marketLines.under.odds);

    if (marketAwayML_upperBound <= marketHomeML_lowerBound) {
        throw new Error('Please check your money lines.');
    } else if (marketTotalOver_upperBound <= marketTotalOver_lowerBound) {
        throw new Error('Please check your totals lines.');
    }
  
    // Format the results and lines into one object
    const lineDifferences: MarketLineDifferenceMLB = {
      mlAway: {
        simValue: awayML,
        upperBound: marketAwayML_upperBound,
        lowerBound: marketHomeML_lowerBound
      },
      total: {
        simValue: totalOver,
        upperBound: marketTotalOver_upperBound,
        lowerBound: marketTotalOver_lowerBound
      }
    };
  
    // Return the object
    return lineDifferences;
  }
  