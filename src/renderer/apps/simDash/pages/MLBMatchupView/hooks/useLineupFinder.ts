import { useMemo } from "react";

import type { MatchupLineups, MlbLiveDataApiResponse } from "@/types/mlb";
import { SimType } from "@/types/mlb/mlb-sim";
import { createLiveMatchupLineups } from "../functions/lineups";

// ---------- Types ----------

interface useLineupFinderProps {
  standardGameLineups: MatchupLineups | undefined;
  liveGameData: MlbLiveDataApiResponse | undefined;
  customGameLineups: MatchupLineups | undefined;
  simType: SimType | undefined;
}

interface useLineupFinderReturn {
  usedLineups: MatchupLineups | undefined;
}

// ---------- Main hook ----------

const useLineupFinder = (props: useLineupFinderProps): useLineupFinderReturn => {
  
  const { standardGameLineups, liveGameData, customGameLineups, simType } = props;

  // ---------- State ----------

  const usedLineups = useMemo((): MatchupLineups | undefined => {
    switch (simType) {
      case 'live':
        if (liveGameData && standardGameLineups) {
          return createLiveMatchupLineups(standardGameLineups, liveGameData);
        }
        return standardGameLineups;
      case 'custom':
        return customGameLineups;
      case 'game':
      case 'series':
      default:
        return standardGameLineups;
    }
  }, [standardGameLineups, liveGameData, customGameLineups, simType]);

  // ---------- Return ----------

  return {
    usedLineups
  }
}

export { useLineupFinder }

