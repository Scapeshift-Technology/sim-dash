// ---------- General types ----------

export interface OutcomeCounts {
  success: number;
  failure: number;
  push?: number;
  total: number;
}

// ----- Table display types ----------

export interface SeriesData {
  team: string;
  winPercent: number;
  usaFair: number;
}

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

export interface PropsData {
  firstInning: FirstInningPropsData[];
  player: PlayerPropsData[];
  scoringOrder?: ScoringOrderPropsData[];
}

export interface FirstInningPropsData {
  team: string;
  scorePercent: number;
  marginOfError: number;
  usaFair: number;
  varianceOdds: number;
}

export interface PlayerPropsData {
  playerName: string;
  teamName: string;
  statName: string;
  line: number;
  overPercent: number;
  marginOfError: number;
  usaFair: number;
  varianceOdds: number;
}

export interface ScoringOrderPropsData {
  team: string;
  propType: 'first' | 'last';
  percent: number;
  marginOfError: number;
  usaFair: number;
  varianceOdds: number;
}

export interface ComparisonSidesData {
  team: string;
  period: string;
  line: number;
  coverPercent: number;
}

export interface ComparisonTotalsData {
  team: string;
  period: string;
  line: number;
  overPercent: number;
  underPercent: number;
  pushPercent: number;
}

export interface ComparisonPropsData {
  firstInning: ComparisonFirstInningPropsData[];
  player: ComparisonPlayerPropsData[];
  scoringOrder?: ComparisonScoringOrderPropsData[];
}

export interface ComparisonFirstInningPropsData {
  team: string;
  scorePercent: number;
}

export interface ComparisonPlayerPropsData {
  playerName: string;
  teamName: string;
  statName: string;
  line: number;
  overPercent: number;
}

export interface ComparisonScoringOrderPropsData {
  team: string;
  propType: 'first' | 'last';
  percent: number;
}

// ---------- MLB ----------

export interface SimResultsMLB {
  sides: SidesCountsMLB;
  props: PropsCountsMLB;
  totals: TotalsCountsMLB;
  series?: SeriesProbsMLB
}

// ----- Series -----

export interface SeriesProbsMLB {
  home: TeamSeriesProbsMLB;
  away: TeamSeriesProbsMLB;
}

export interface TeamSeriesProbsMLB {
  winPercent: number;
  lossPercent: number;
}

// ----- Sides -----

export interface SidesPeriodCountsMLB {
  [key: string]: OutcomeCounts;
}

// export interface TeamSidesCountsMLB {  // Old version of TeamSidesCountsMLB for reference
//   fullGame: SidesPeriodCountsMLB;
//   firstFive: SidesPeriodCountsMLB;
// }

export type TeamSidesCountsMLB = {
  [key: string]: SidesPeriodCountsMLB // Really PeriodKey type, but typescript gets mad when I put that
}
  
export interface SidesCountsMLB {
  home: TeamSidesCountsMLB;
  away: TeamSidesCountsMLB;
}

// ----- Props -----

export interface PropsCountsMLB {
  firstInning: FirstInningScoreCountsMLB;
  player: AllPlayersPropsCountsMLB;
  scoringOrder?: ScoringOrderCountsMLB;
}

// -- First inning scores --

export interface FirstInningScoreCountsMLB {
  away: OutcomeCounts;
  home: OutcomeCounts;
  overall: OutcomeCounts;
}

// -- Player props --

export interface AllPlayersPropsCountsMLB {
    // Each key is a player id
  [key: number]: PlayerPropsCountsMLB;
}

export interface PlayerPropsCountsMLB {
  playerName: string;
  teamName: string;
  stats: {
    [key: string]: PlayerStatPropsCountsMLB;
  };
}

export interface PlayerStatPropsCountsMLB {
  // Each key is a line
  [key: number]: OutcomeCounts;
}

// -- Scoring order --
export interface ScoringOrderCountsMLB {
  away: ScoringOrderTeamCountsMLB;
  home: ScoringOrderTeamCountsMLB;
}

export interface ScoringOrderTeamCountsMLB {
  first: OutcomeCounts;
  last: OutcomeCounts;
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




