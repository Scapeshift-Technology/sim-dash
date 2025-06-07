import { displayPeriodToCodeAndNumber } from "@@/services/statCaptureConfig/utils";

// ---------- Configuration-Driven Sorting System ----------

type SortDirection = 'asc' | 'desc';

interface SortCriterion<T> {
  key: keyof T | string;
  direction: SortDirection;
  compareFn: (a: T, b: T, context?: any) => number;
}

type SortConfig<T> = SortCriterion<T>[];

// Generic sort engine
function sortWithConfig<T>(data: T[], config: SortConfig<T>, context?: any): T[] {
  return [...data].sort((a, b) => {
    for (const criterion of config) {
      const comparison = criterion.compareFn(a, b, context);
      if (comparison !== 0) {
        return criterion.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

// ---------- Helper functions ----------

function getPeriodSortOrder(displayPeriod: string): number {
  if (displayPeriod === 'FG') return 0;
    
  const { periodTypeCode, periodNumber } = displayPeriodToCodeAndNumber(displayPeriod);
    
  if (periodTypeCode === 'H') return 1000 + periodNumber; // Big numbers to give space for codes(like I99)
  if (periodTypeCode === 'I') return 2000 + periodNumber;
    
  return 9999; // fallback
};

function getTeamSortOrder(team: string, awayTeamName: string, homeTeamName: string): number {
  // ('Combined' first, then away, then home)
  if (team === 'Combined') return 0;
  if (team === awayTeamName) return 1;
  if (team === homeTeamName) return 2;
  return 9999;
}

// ---------- Generic Comparator Functions ----------

function numericComparator<T>(a: T, b: T, context: any, key: keyof T): number {
  const aVal = a[key] as number;
  const bVal = b[key] as number;
  return aVal - bVal;
}

function stringComparator<T>(a: T, b: T, context: any, key: keyof T): number {
  const aVal = a[key] as string;
  const bVal = b[key] as string;
  return aVal.localeCompare(bVal);
}

function absoluteNumericComparator<T>(a: T, b: T, context: any, key: keyof T): number {
  const aVal = Math.abs(a[key] as number);
  const bVal = Math.abs(b[key] as number);
  return aVal - bVal;
}

// ---------- Domain-Specific Comparator Functions ----------

// For team ordering (Combined -> Away -> Home)
function teamOrderComparator<T extends { team: string }>(a: T, b: T, context: { awayTeamName: string; homeTeamName: string }): number {
  return getTeamSortOrder(a.team, context.awayTeamName, context.homeTeamName) - 
         getTeamSortOrder(b.team, context.awayTeamName, context.homeTeamName);
}

// For period ordering (FG -> H_ -> I_)
function periodOrderComparator<T extends { period: string }>(a: T, b: T): number {
  return getPeriodSortOrder(a.period) - getPeriodSortOrder(b.period);
}

// For away team first ordering
function awayTeamFirstComparator<T extends { teamName: string }>(a: T, b: T, context: { awayTeamName: string }): number {
  const aIsAway = a.teamName === context.awayTeamName;
  const bIsAway = b.teamName === context.awayTeamName;
  if (aIsAway && !bIsAway) return -1;
  if (!aIsAway && bIsAway) return 1;
  if (aIsAway === bIsAway && a.teamName !== b.teamName) {
    return a.teamName.localeCompare(b.teamName);
  }
  return 0;
}

// For prop type ordering (first before last)
function propTypeOrderComparator<T extends { propType: string }>(a: T, b: T): number {
  console.log('propTypeOrderComparator', a.propType, b.propType);
  if (a.propType !== b.propType) {
    return a.propType === 'FirstToScore' ? -1 : 1;
  }
  return 0;
}

// Specific field comparators
function lineComparator<T extends { line: number }>(a: T, b: T): number {
  return numericComparator(a, b, null, 'line');
}

function absoluteLineComparator<T extends { line: number }>(a: T, b: T): number {
  return absoluteNumericComparator(a, b, null, 'line');
}

function overPercentComparator<T extends { overPercent: number }>(a: T, b: T): number {
  return numericComparator(a, b, null, 'overPercent');
}

function coverPercentComparator<T extends { coverPercent: number }>(a: T, b: T): number {
  return numericComparator(a, b, null, 'coverPercent');
}

function percentComparator<T extends { percent: number }>(a: T, b: T): number {
  return numericComparator(a, b, null, 'percent');
}

function playerNameComparator<T extends { playerName: string }>(a: T, b: T): number {
  return stringComparator(a, b, null, 'playerName');
}

function statNameComparator<T extends { statName: string }>(a: T, b: T): number {
  return stringComparator(a, b, null, 'statName');
}

export { 
  getPeriodSortOrder, 
  getTeamSortOrder,
  sortWithConfig,
  // Generic comparators
  numericComparator,
  stringComparator,
  absoluteNumericComparator,
  // Domain-specific comparators
  teamOrderComparator,
  periodOrderComparator,
  awayTeamFirstComparator,
  propTypeOrderComparator,
  // Field-specific comparators
  lineComparator,
  absoluteLineComparator,
  overPercentComparator,
  coverPercentComparator,
  percentComparator,
  playerNameComparator,
  statNameComparator,
  // Types
  type SortConfig,
  type SortCriterion,
  type SortDirection
};