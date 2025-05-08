import { PlayResult, MatchupLineups } from "@/types/mlb";
import { SimResultsMLB } from "@/types/bettingResults";
import { calculateSidesCounts } from "./sidesAnalyzer";
import { calculateTotalsCounts } from "./totalsAnalyzer";
import { calculatePropsCounts } from "./propsAnalyzer";

function calculateSimCounts(simPlays: PlayResult[][], matchup: MatchupLineups): SimResultsMLB {
  const sidesCounts = calculateSidesCounts(simPlays);
  const totalsCounts = calculateTotalsCounts(simPlays);
  const propsCounts = calculatePropsCounts(simPlays, matchup);

  return {
    sides: sidesCounts,
    totals: totalsCounts,
    props: propsCounts
  };
}

export { calculateSimCounts };