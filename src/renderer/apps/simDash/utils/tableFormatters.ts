import { formatAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { formatROIDemandPrice } from '@/simDash/utils/roiCalculations';
import { proportionToAmericanOdds } from '@/simDash/utils/oddsCalculations';
import {
  SidesData,
  TotalsData,
  PlayerPropsData,
  FirstInningPropsData,
  ScoringOrderPropsData,
  SeriesData,
  ComparisonSidesData,
  ComparisonTotalsData,
  ComparisonPlayerPropsData,
  ComparisonFirstInningPropsData,
  ComparisonScoringOrderPropsData
} from '@/types/bettingResults';

// ---------- Type Definitions ----------

// Utility type to convert specified numeric fields to strings
type StringifyFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: string;
}

// Clean type definitions using the utility type
export type FormattedSidesData = StringifyFields<SidesData, 'coverPercent' | 'marginOfError' | 'usaFair' | 'varianceOdds' | 'usaDemandPrice'>;

export type FormattedTotalsData = StringifyFields<TotalsData, 'overPercent' | 'underPercent' | 'pushPercent' | 'marginOfError' | 'usaFairOver' | 'usaFairUnder' | 'varianceOddsOver' | 'varianceOddsUnder' | 'usaDemandPriceOver' | 'usaDemandPriceUnder'>;

export type FormattedPlayerPropsData = StringifyFields<PlayerPropsData, 'overPercent' | 'marginOfError' | 'usaFair' | 'varianceOdds' | 'usaDemandPrice'>;

// FirstInning adds variance odds fields, so we need a custom interface
export interface FormattedFirstInningData extends StringifyFields<FirstInningPropsData, 'scorePercent' | 'marginOfError' | 'usaFair' | 'usaDemandPrice'> {
  varianceOddsOver: string;
  varianceOddsUnder: string;
}

export type FormattedScoringOrderPropsData = StringifyFields<ScoringOrderPropsData, 'percent' | 'marginOfError' | 'usaFair' | 'varianceOdds' | 'usaDemandPrice'>;

export type FormattedSeriesData = StringifyFields<SeriesData, 'winPercent' | 'usaFair' | 'usaDemandPrice'>;

// Comparison table types
export type FormattedComparisonSidesData = StringifyFields<ComparisonSidesData, 'coverPercent'>;

export type FormattedComparisonTotalsData = StringifyFields<ComparisonTotalsData, 'overPercent' | 'underPercent' | 'pushPercent'>;

export type FormattedComparisonPlayerPropsData = StringifyFields<ComparisonPlayerPropsData, 'overPercent'>;

export type FormattedComparisonFirstInningPropsData = StringifyFields<ComparisonFirstInningPropsData, 'scorePercent'>;

export type FormattedComparisonScoringOrderPropsData = StringifyFields<ComparisonScoringOrderPropsData, 'percent'>;

// ---------- Main Table Formatters ----------

export function formatSidesData(data: SidesData[]): FormattedSidesData[] {
  return data.map(row => ({
    ...row,
    coverPercent: `${formatDecimal(100 * row.coverPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFair: formatAmericanOdds(row.usaFair),
    varianceOdds: formatAmericanOdds(row.varianceOdds),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
  }));
}

export function formatTotalsData(data: TotalsData[]): FormattedTotalsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    underPercent: `${formatDecimal(100 * row.underPercent)}%`,
    pushPercent: `${formatDecimal(100 * row.pushPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFairOver: formatAmericanOdds(row.usaFairOver),
    usaFairUnder: formatAmericanOdds(row.usaFairUnder),
    varianceOddsOver: formatAmericanOdds(row.varianceOddsOver),
    varianceOddsUnder: formatAmericanOdds(row.varianceOddsUnder),
    usaDemandPriceOver: formatROIDemandPrice(row.usaDemandPriceOver),
    usaDemandPriceUnder: formatROIDemandPrice(row.usaDemandPriceUnder)
  }));
}

export function formatPlayerPropsData(data: PlayerPropsData[]): FormattedPlayerPropsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFair: formatAmericanOdds(row.usaFair),
    varianceOdds: formatAmericanOdds(row.varianceOdds),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
  }));
}

export function formatFirstInningData(data: FirstInningPropsData[]): FormattedFirstInningData[] {
  return data.map(row => {
    const probScore = row.scorePercent; // This is a fraction (0-1)
    const moe = row.marginOfError;     // This is a fraction (0-1)

    const probForOverCalc = probScore - moe;
    const probForUnderCalc = 1-(probScore + moe);

    const americanOddsOver = proportionToAmericanOdds(probForOverCalc);
    const americanOddsUnder = proportionToAmericanOdds(probForUnderCalc);

    return {
      ...row,
      scorePercent: `${formatDecimal(100 * probScore)}%`,
      marginOfError: `${formatDecimal(100 * moe)}%`,
      usaFair: formatAmericanOdds(row.usaFair),
      varianceOddsOver: formatAmericanOdds(americanOddsOver),
      varianceOddsUnder: formatAmericanOdds(americanOddsUnder),
      usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
    };
  });
}

export function formatScoringOrderPropsData(data: ScoringOrderPropsData[]): FormattedScoringOrderPropsData[] {
  return data.map(row => ({
    ...row,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    percent: `${formatDecimal(100 * row.percent)}%`,
    usaFair: formatAmericanOdds(row.usaFair),
    varianceOdds: formatAmericanOdds(row.varianceOdds),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
  }));
}

export function formatSeriesData(data: SeriesData[]): FormattedSeriesData[] {
  return data.map(row => ({
    ...row,
    winPercent: `${formatDecimal(100 * row.winPercent)}%`,
    usaFair: formatAmericanOdds(row.usaFair),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
  }));
}

// ---------- Comparison Table Formatters ----------

export function formatComparisonSidesData(data: ComparisonSidesData[]): FormattedComparisonSidesData[] {
  return data.map(row => ({
    ...row,
    coverPercent: `${formatDecimal(100 * row.coverPercent)}%`
  }));
}

export function formatComparisonTotalsData(data: ComparisonTotalsData[]): FormattedComparisonTotalsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    underPercent: `${formatDecimal(100 * row.underPercent)}%`,
    pushPercent: `${formatDecimal(100 * row.pushPercent)}%`
  }));
}

export function formatComparisonPlayerPropsData(data: ComparisonPlayerPropsData[]): FormattedComparisonPlayerPropsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`
  }));
}

export function formatComparisonFirstInningPropsData(data: ComparisonFirstInningPropsData[]): FormattedComparisonFirstInningPropsData[] {
  return data.map(row => ({
    ...row,
    scorePercent: `${formatDecimal(100 * row.scorePercent)}%`
  }));
}

export function formatComparisonScoringOrderPropsData(data: ComparisonScoringOrderPropsData[]): FormattedComparisonScoringOrderPropsData[] {
  return data.map(row => ({
    ...row,
    percent: `${formatDecimal(100 * row.percent)}%`
  }));
}

// ---------- Formatter Registry (for future BettingTable) ----------

export type TableType = 'sides' | 'totals' | 'playerProps' | 'firstInning' | 'scoringOrderProps' | 'series';
export type ComparisonTableType = 'comparisonSides' | 'comparisonTotals' | 'comparisonPlayerProps' | 'comparisonFirstInning' | 'comparisonScoringOrderProps';

const mainFormatters = {
  sides: formatSidesData,
  totals: formatTotalsData,
  playerProps: formatPlayerPropsData,
  firstInning: formatFirstInningData,
  scoringOrderProps: formatScoringOrderPropsData,
  series: formatSeriesData
} as const;

const comparisonFormatters = {
  comparisonSides: formatComparisonSidesData,
  comparisonTotals: formatComparisonTotalsData,
  comparisonPlayerProps: formatComparisonPlayerPropsData,
  comparisonFirstInning: formatComparisonFirstInningPropsData,
  comparisonScoringOrderProps: formatComparisonScoringOrderPropsData
} as const;

export function getFormatter(tableType: TableType): (data: any[]) => any[] {
  return mainFormatters[tableType];
}

export function getComparisonFormatter(tableType: ComparisonTableType): (data: any[]) => any[] {
  return comparisonFormatters[tableType];
} 