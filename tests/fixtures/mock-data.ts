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
  ComparisonScoringOrderPropsData,
  PropType
} from '../../src/types/bettingResults';

// ---------- Main Table Fixtures ----------

export const mockSidesData: SidesData[] = [
  {
    team: 'Yankees',
    period: 'FG',
    line: -1.5,
    coverPercent: 0.6543,
    marginOfError: 0.0234,
    usaFair: 150.5,
    varianceOdds: -200.3,
    usaDemandPrice: 145.2
  },
  {
    team: 'Yankees',
    period: 'F5',
    line: -0.5,
    coverPercent: 0.5789,
    marginOfError: 0.0312,
    usaFair: 120.7,
    varianceOdds: -180.1,
    usaDemandPrice: 115.0
  },
  {
    team: 'Red Sox',
    period: 'FG',
    line: 1.5,
    coverPercent: 0.3457,
    marginOfError: 0.0234,
    usaFair: -170.5,
    varianceOdds: 180.3,
    usaDemandPrice: -165.8
  }
];

export const mockTotalsData: TotalsData[] = [
  {
    team: 'Combined',
    period: 'FG',
    line: 8.5,
    overPercent: 0.4521,
    underPercent: 0.5479,
    pushPercent: 0.0000,
    marginOfError: 0.0198,
    usaFairOver: 120.5,
    usaFairUnder: -140.2,
    varianceOddsOver: 110.3,
    varianceOddsUnder: -130.1,
    usaDemandPriceOver: 115.7,
    usaDemandPriceUnder: -135.4
  },
  {
    team: 'Combined',
    period: 'F5',
    line: 4.5,
    overPercent: 0.3821,
    underPercent: 0.6179,
    pushPercent: 0.0000,
    marginOfError: 0.0287,
    usaFairOver: 162.1,
    usaFairUnder: -200.8,
    varianceOddsOver: 150.5,
    varianceOddsUnder: -185.2,
    usaDemandPriceOver: 155.9,
    usaDemandPriceUnder: -190.1
  }
];

export const mockPlayerPropsData: PlayerPropsData[] = [
  {
    playerName: 'Aaron Judge',
    teamName: 'Yankees',
    statName: 'Hits',
    line: 1.5,
    overPercent: 0.6234,
    marginOfError: 0.0156,
    usaFair: 165.2,
    varianceOdds: -195.8,
    usaDemandPrice: 160.4
  },
  {
    playerName: 'Rafael Devers',
    teamName: 'Red Sox',
    statName: 'RBIs',
    line: 0.5,
    overPercent: 0.4567,
    marginOfError: 0.0243,
    usaFair: 118.9,
    varianceOdds: -140.5,
    usaDemandPrice: 115.2
  },
  {
    playerName: 'Gleyber Torres',
    teamName: 'Yankees',
    statName: 'Runs',
    line: 0.5,
    overPercent: 0.5432,
    marginOfError: 0.0189,
    usaFair: 137.8,
    varianceOdds: -165.3,
    usaDemandPrice: 132.1
  }
];

export const mockFirstInningData: FirstInningPropsData[] = [
  {
    team: 'Yankees',
    scorePercent: 0.3245,
    marginOfError: 0.0178,
    usaFair: 207.9,
    varianceOdds: 185.4,
    usaDemandPrice: 195.6
  },
  {
    team: 'Red Sox',
    scorePercent: 0.2876,
    marginOfError: 0.0165,
    usaFair: 247.8,
    varianceOdds: 220.1,
    usaDemandPrice: 235.4
  }
];

export const mockScoringOrderPropsData: ScoringOrderPropsData[] = [
  {
    team: 'Yankees',
    propType: 'FirstToScore' as PropType,
    percent: 0.5234,
    marginOfError: 0.0201,
    usaFair: 91.1,
    varianceOdds: -115.8,
    usaDemandPrice: 85.7
  },
  {
    team: 'Yankees',
    propType: 'LastToScore' as PropType,
    percent: 0.4987,
    marginOfError: 0.0198,
    usaFair: 100.3,
    varianceOdds: -105.2,
    usaDemandPrice: 95.8
  },
  {
    team: 'Red Sox',
    propType: 'FirstToScore' as PropType,
    percent: 0.4766,
    marginOfError: 0.0201,
    usaFair: 109.8,
    varianceOdds: -125.4,
    usaDemandPrice: 104.2
  }
];

export const mockSeriesData: SeriesData[] = [
  {
    team: 'Yankees',
    winPercent: 0.5634,
    usaFair: 126.8,
    usaDemandPrice: 120.5
  },
  {
    team: 'Red Sox',
    winPercent: 0.4366,
    usaFair: -146.2,
    usaDemandPrice: -140.8
  }
];

// ---------- Comparison Table Fixtures ----------

export const mockComparisonSidesData: ComparisonSidesData[] = [
  {
    team: 'Yankees',
    period: 'FG',
    line: -1.5,
    coverPercent: 0.0523  // Difference: +5.23%
  },
  {
    team: 'Yankees',
    period: 'F5',
    line: -0.5,
    coverPercent: -0.0234  // Difference: -2.34%
  },
  {
    team: 'Red Sox',
    period: 'FG',
    line: 1.5,
    coverPercent: -0.0523  // Difference: -5.23%
  }
];

export const mockComparisonTotalsData: ComparisonTotalsData[] = [
  {
    team: 'Combined',
    period: 'FG',
    line: 8.5,
    overPercent: 0.0345,   // Difference: +3.45%
    underPercent: -0.0345, // Difference: -3.45%
    pushPercent: 0.0000    // No difference
  },
  {
    team: 'Combined',
    period: 'F5',
    line: 4.5,
    overPercent: -0.0156,  // Difference: -1.56%
    underPercent: 0.0156,  // Difference: +1.56%
    pushPercent: 0.0000    // No difference
  }
];

export const mockComparisonPlayerPropsData: ComparisonPlayerPropsData[] = [
  {
    playerName: 'Aaron Judge',
    teamName: 'Yankees',
    statName: 'Hits',
    line: 1.5,
    overPercent: 0.0234  // Difference: +2.34%
  },
  {
    playerName: 'Rafael Devers',
    teamName: 'Red Sox',
    statName: 'RBIs',
    line: 0.5,
    overPercent: -0.0156  // Difference: -1.56%
  }
];

export const mockComparisonFirstInningData: ComparisonFirstInningPropsData[] = [
  {
    team: 'Yankees',
    scorePercent: 0.0123  // Difference: +1.23%
  },
  {
    team: 'Red Sox',
    scorePercent: -0.0098  // Difference: -0.98%
  }
];

export const mockComparisonScoringOrderData: ComparisonScoringOrderPropsData[] = [
  {
    team: 'Yankees',
    propType: 'FirstToScore' as PropType,
    percent: 0.0234  // Difference: +2.34%
  },
  {
    team: 'Red Sox',
    propType: 'FirstToScore' as PropType,
    percent: -0.0234  // Difference: -2.34%
  }
];

// ---------- Edge Case Data ----------

export const mockEmptyData = {
  sides: [] as SidesData[],
  totals: [] as TotalsData[],
  playerProps: [] as PlayerPropsData[],
  firstInning: [] as FirstInningPropsData[],
  scoringOrder: [] as ScoringOrderPropsData[],
  series: [] as SeriesData[]
};

export const mockDataWithNulls: SidesData[] = [
  {
    team: 'Yankees',
    period: 'FG',
    line: -1.5,
    coverPercent: 0.6543,
    marginOfError: 0.0234,
    usaFair: 150.5,
    varianceOdds: -200.3,
    usaDemandPrice: null  // Null demand price
  }
];

export const mockDataWithEdgeCases: PlayerPropsData[] = [
  {
    playerName: 'Test Player',
    teamName: 'Test Team',
    statName: 'Hits',
    line: 0.5,
    overPercent: 0.0000,  // 0% probability
    marginOfError: 0.0000,
    usaFair: 0,  // Zero odds
    varianceOdds: 0,
    usaDemandPrice: 0
  },
  {
    playerName: 'Another Player',
    teamName: 'Another Team',
    statName: 'RBIs',
    line: 5.5,
    overPercent: 1.0000,  // 100% probability
    marginOfError: 0.0001,
    usaFair: 999999,  // Very large odds
    varianceOdds: -999999,
    usaDemandPrice: 999999
  }
];

// ---------- Test Utilities ----------

export const createMockSidesData = (overrides: Partial<SidesData> = {}): SidesData => ({
  team: 'Yankees',
  period: 'FG',
  line: -1.5,
  coverPercent: 0.6543,
  marginOfError: 0.0234,
  usaFair: 150.5,
  varianceOdds: -200.3,
  usaDemandPrice: 145.2,
  ...overrides
});

export const createMockPlayerPropsData = (overrides: Partial<PlayerPropsData> = {}): PlayerPropsData => ({
  playerName: 'Aaron Judge',
  teamName: 'Yankees',
  statName: 'Hits',
  line: 1.5,
  overPercent: 0.6234,
  marginOfError: 0.0156,
  usaFair: 165.2,
  varianceOdds: -195.8,
  usaDemandPrice: 160.4,
  ...overrides
}); 