import { PlayResult, MatchupLineups, MlbLiveDataApiResponse } from "@/types/mlb";
import { SimResultsMLB } from "@/types/bettingResults";
import { calculateSidesCounts } from "./sidesAnalyzer";
import { calculateTotalsCounts } from "./totalsAnalyzer";
import { calculatePropsCounts } from "./propsAnalyzer";
import { pastPlaysToSimPlays } from "./pastPlaysAnalyzer";

function calculateSimCounts(simPlays: PlayResult[][], matchup: MatchupLineups, liveGameData?: MlbLiveDataApiResponse): SimResultsMLB {
  // If game is live, add plays that already happened to the beginning of each gameAdd commentMore actions
  if (liveGameData) {
    const pastSimPlays = pastPlaysToSimPlays(liveGameData);
    for (const gamePlays of simPlays) {
      gamePlays.unshift(...pastSimPlays);
    }
  };
  
  const sidesCounts = calculateSidesCounts(simPlays);
  const totalsCounts = calculateTotalsCounts(simPlays);
  const propsCounts = calculatePropsCounts(simPlays, matchup);

  const outputResults: SimResultsMLB = {
    sides: sidesCounts,
    totals: totalsCounts,
    props: propsCounts
  };

  return outputResults;
}

export { calculateSimCounts };