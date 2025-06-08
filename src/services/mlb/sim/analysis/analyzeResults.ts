import { PlayResult, MatchupLineups, MlbLiveDataApiResponse } from "@/types/mlb";
import { SimResultsMLB } from "@/types/bettingResults";
import { SavedConfiguration } from "@/types/statCaptureConfig";

import { calculateSidesCounts } from "./sidesAnalyzer";
import { calculateTotalsCounts } from "./totalsAnalyzer";
import { calculatePropsCounts } from "./propsAnalyzer";
import { pastPlaysToSimPlays } from "./pastPlaysAnalyzer";

// ---------- Main function ----------

function calculateSimCounts(simPlays: PlayResult[][], matchup: MatchupLineups, statCaptureConfig: SavedConfiguration, liveGameData?: MlbLiveDataApiResponse): SimResultsMLB {
  // If game is live, add plays that already happened to the beginning of each game
  if (liveGameData) {
    const pastSimPlays = pastPlaysToSimPlays(liveGameData);
    for (const gamePlays of simPlays) {
      gamePlays.unshift(...pastSimPlays);
    }
  };

  const sidesCounts = calculateSidesCounts(simPlays, statCaptureConfig);
  const totalsCounts = calculateTotalsCounts(simPlays, statCaptureConfig);
  const propsCounts = calculatePropsCounts(simPlays, matchup, statCaptureConfig);

  const outputResults: SimResultsMLB = {
    sides: sidesCounts,
    totals: totalsCounts,
    props: propsCounts
  };

  return outputResults;
}

export { calculateSimCounts };