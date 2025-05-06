// ---------- General types ----------

export interface OutcomeCounts {
  success: number;
  failure: number;
  push?: number;
  total: number;
}

// ---------- MLB ----------

export interface SimResultsMLB {
  sides: SidesCountsMLB;
  props: PropsCountsMLB;
  totals: TotalsCountsMLB;
}

// ----- Sides -----

export interface TeamSidesCountsMLB {
  fullGame: {
    RunLinePlus1_5: OutcomeCounts;
    RunLineMinus1_5: OutcomeCounts;
    ML: OutcomeCounts;
  };
  firstFive: {
    RunLinePlus1_5: OutcomeCounts;
    RunLineMinus1_5: OutcomeCounts;
    ML: OutcomeCounts;
  };
}
  
export interface SidesCountsMLB {
  home: TeamSidesCountsMLB;
  away: TeamSidesCountsMLB;
}

// ----- Props -----

export interface PropsCountsMLB {
  firstInning: FirstInningScoreCountsMLB;
}

export interface FirstInningScoreCountsMLB {
  away: OutcomeCounts;
  home: OutcomeCounts;
  overall: OutcomeCounts;
}

// ----- Totals -----

export interface TotalsCountsMLB {
  combined: GamePeriodTotalsMLB,
  home: GamePeriodTotalsMLB,
  away: GamePeriodTotalsMLB
}

export interface GamePeriodTotalsMLB {
  fullGame: TotalsLinesMLB,
  firstFive: TotalsLinesMLB
}

interface TotalsLinesMLB {
  over: {
    [key: number]: OutcomeCounts;
  };
  under: {
    [key: number]: OutcomeCounts;
  };
}




