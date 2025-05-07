// ---------- General types ----------

export interface OutcomeCounts {
  success: number;
  failure: number;
  push?: number;
  total: number;
}

// ----- Table display types ----------

export interface SidesData {
  team: string;
  period: string;
  line: number;
  coverPercent: number;
  marginOfError: number;
  usaFair: number;
  varianceOdds: number;
}

export interface TotalsData {
  team: string;
  period: string;
  line: number;
  overPercent: number;
  underPercent: number;
  pushPercent: number;
  marginOfError: number;
  usaFairOver: number;
  usaFairUnder: number;
  varianceOddsOver: number;
  varianceOddsUnder: number;
}

export interface FirstInningPropsData {
  team: string;
  scorePercent: number;
  marginOfError: number;
  usaFair: number;
  varianceOdds: number;
}

// ---------- MLB ----------

export interface SimResultsMLB {
  sides: SidesCountsMLB;
  props: PropsCountsMLB;
  totals: TotalsCountsMLB;
}

// ----- Sides -----

export interface SidesPeriodCountsMLB {
  [key: string]: OutcomeCounts;
}

export interface TeamSidesCountsMLB {
  fullGame: SidesPeriodCountsMLB;
  firstFive: SidesPeriodCountsMLB;
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

export interface TotalsLinesMLB {
  over: {
    [key: number]: OutcomeCounts;
  };
  under: {
    [key: number]: OutcomeCounts;
  };
}




