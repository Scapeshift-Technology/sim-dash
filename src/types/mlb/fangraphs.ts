// ---------- FanGraphs API types ----------

export interface FgLeagueData {
  totalsHome: FgLeagueDataTotals;
  totalsAway: FgLeagueDataTotals;
  totalsNeutral: FgLeagueDataTotals;
}
  
export interface FgLeagueDataTotals {
  AB: number;
  PA: number;
  '1B': number;
  '2B': number;
  '3B': number;
  HR: number;
  BB: number;
  HBP: number;
  SO: number;
  SH: number;
  H?: number;
}
  
export interface Percentages {
  [key: string]: number;
}
