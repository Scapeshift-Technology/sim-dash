import { PlayResult, MatchupLineups, MlbLiveDataApiResponse } from "@/types/mlb";
import { SimResultsMLB } from "@/types/bettingResults";
import { calculateSidesCounts } from "./sidesAnalyzer";
import { calculateTotalsCounts } from "./totalsAnalyzer";
import { calculatePropsCounts } from "./propsAnalyzer";
import { pastPlaysToSimPlays } from "./pastPlaysAnalyzer";
import log from "electron-log";

function calculateSimCounts(simPlays: PlayResult[][], matchup: MatchupLineups, liveGameData?: MlbLiveDataApiResponse): SimResultsMLB {
  if (liveGameData) { // If game is live, add plays that already happened to the beginning of each game
    try {
      const pastSimPlays = pastPlaysToSimPlays(liveGameData);
      for (const gamePlays of simPlays) {
        gamePlays.unshift(...pastSimPlays);
      }
    } catch (error) {
      log.error('Error adding past plays to sim plays:', error);
    }
  }

  log.info('Sim plays game 1:', JSON.stringify(simPlays[0]));
  
  const sidesCounts = calculateSidesCounts(simPlays);
  const totalsCounts = calculateTotalsCounts(simPlays);
  const propsCounts = calculatePropsCounts(simPlays, matchup);

  const outputResults: SimResultsMLB = {
    sides: sidesCounts,
    totals: totalsCounts,
    props: propsCounts
  };
  log.info('Output results:', JSON.stringify(outputResults));

  return outputResults;
}

export { calculateSimCounts };