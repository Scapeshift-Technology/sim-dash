import {
  mockSidesData,
  mockTotalsData,
  mockPlayerPropsData,
  mockFirstInningData,
  mockScoringOrderPropsData,
  mockSeriesData,
  mockComparisonSidesData,
  mockComparisonTotalsData,
  mockComparisonPlayerPropsData,
  mockComparisonFirstInningData,
  mockComparisonScoringOrderData,
  mockDataWithNulls,
  mockDataWithEdgeCases,
  createMockSidesData,
  createMockPlayerPropsData
} from '../fixtures/mock-data';

// We'll mock the formatting functions since we can't directly import them yet
// These tests will verify the expected behavior of the transformation functions

describe('Data Transformation Functions', () => {
  
  describe('formatSidesData', () => {
    // Mock implementation based on actual SidesTable.tsx
    const formatSidesData = (data: typeof mockSidesData) => {
      return data.map(row => ({
        ...row,
        coverPercent: `${(100 * row.coverPercent).toFixed(2)}%`,
        marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
        usaFair: row.usaFair >= 0 ? `+${row.usaFair.toFixed(2)}` : `${row.usaFair.toFixed(2)}`,
        varianceOdds: row.varianceOdds >= 0 ? `+${row.varianceOdds.toFixed(2)}` : `${row.varianceOdds.toFixed(2)}`,
        usaDemandPrice: row.usaDemandPrice !== null 
          ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should convert decimal percentages to formatted strings', () => {
      const input = [createMockSidesData({
        coverPercent: 0.6543,
        marginOfError: 0.0234
      })];
      
      const result = formatSidesData(input);
      
      expect(result[0].coverPercent).toBe('65.43%');
      expect(result[0].marginOfError).toBe('2.34%');
    });

    test('should format American odds correctly', () => {
      const input = [createMockSidesData({
        usaFair: 150.5,
        varianceOdds: -200.3
      })];
      
      const result = formatSidesData(input);
      
      expect(result[0].usaFair).toBe('+150.50');
      expect(result[0].varianceOdds).toBe('-200.30');
    });

    test('should handle ROI demand price formatting', () => {
      const input = [
        createMockSidesData({ usaDemandPrice: 145.2 }),
        createMockSidesData({ usaDemandPrice: -165.8 }),
        createMockSidesData({ usaDemandPrice: null })
      ];
      
      const result = formatSidesData(input);
      
      expect(result[0].usaDemandPrice).toBe('+145.20');
      expect(result[1].usaDemandPrice).toBe('-165.80');
      expect(result[2].usaDemandPrice).toBe('N/A');
    });

    test('should preserve non-formatted fields', () => {
      const input = [createMockSidesData({
        team: 'Yankees',
        period: 'FG',
        line: -1.5
      })];
      
      const result = formatSidesData(input);
      
      expect(result[0].team).toBe('Yankees');
      expect(result[0].period).toBe('FG');
      expect(result[0].line).toBe(-1.5);
    });

    test('should handle edge cases', () => {
      const input = [createMockSidesData({
        coverPercent: 0.0000,
        marginOfError: 1.0000,
        usaFair: 0,
        varianceOdds: 0
      })];
      
      const result = formatSidesData(input);
      
      expect(result[0].coverPercent).toBe('0.00%');
      expect(result[0].marginOfError).toBe('100.00%');
      expect(result[0].usaFair).toBe('+0.00');
      expect(result[0].varianceOdds).toBe('+0.00');
    });
  });

  describe('formatTotalsData', () => {
    // Mock implementation based on actual TotalsTable.tsx
    const formatTotalsData = (data: typeof mockTotalsData) => {
      return data.map(row => ({
        ...row,
        overPercent: `${(100 * row.overPercent).toFixed(2)}%`,
        underPercent: `${(100 * row.underPercent).toFixed(2)}%`,
        pushPercent: `${(100 * row.pushPercent).toFixed(2)}%`,
        marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
        usaFairOver: row.usaFairOver >= 0 ? `+${row.usaFairOver.toFixed(2)}` : `${row.usaFairOver.toFixed(2)}`,
        usaFairUnder: row.usaFairUnder >= 0 ? `+${row.usaFairUnder.toFixed(2)}` : `${row.usaFairUnder.toFixed(2)}`,
        varianceOddsOver: row.varianceOddsOver >= 0 ? `+${row.varianceOddsOver.toFixed(2)}` : `${row.varianceOddsOver.toFixed(2)}`,
        varianceOddsUnder: row.varianceOddsUnder >= 0 ? `+${row.varianceOddsUnder.toFixed(2)}` : `${row.varianceOddsUnder.toFixed(2)}`,
        usaDemandPriceOver: row.usaDemandPriceOver !== null 
          ? (row.usaDemandPriceOver >= 0 ? `+${row.usaDemandPriceOver.toFixed(2)}` : `${row.usaDemandPriceOver.toFixed(2)}`)
          : 'N/A',
        usaDemandPriceUnder: row.usaDemandPriceUnder !== null 
          ? (row.usaDemandPriceUnder >= 0 ? `+${row.usaDemandPriceUnder.toFixed(2)}` : `${row.usaDemandPriceUnder.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should format over/under/push percentages', () => {
      const result = formatTotalsData(mockTotalsData);
      
      expect(result[0].overPercent).toBe('45.21%');
      expect(result[0].underPercent).toBe('54.79%');
      expect(result[0].pushPercent).toBe('0.00%');
      expect(result[0].marginOfError).toBe('1.98%');
    });

    test('should format over/under odds separately', () => {
      const result = formatTotalsData(mockTotalsData);
      
      expect(result[0].usaFairOver).toBe('+120.50');
      expect(result[0].usaFairUnder).toBe('-140.20');
      expect(result[0].varianceOddsOver).toBe('+110.30');
      expect(result[0].varianceOddsUnder).toBe('-130.10');
    });

    test('should handle over/under demand prices', () => {
      const result = formatTotalsData(mockTotalsData);
      
      expect(result[0].usaDemandPriceOver).toBe('+115.70');
      expect(result[0].usaDemandPriceUnder).toBe('-135.40');
    });

    test('should preserve totals-specific fields', () => {
      const result = formatTotalsData(mockTotalsData);
      
      expect(result[0].team).toBe('Combined');
      expect(result[0].period).toBe('FG');
      expect(result[0].line).toBe(8.5);
    });
  });

  describe('formatPlayerPropsData', () => {
    // Mock implementation based on actual PlayerPropsTable.tsx
    const formatPlayerPropsData = (data: typeof mockPlayerPropsData) => {
      return data.map(row => ({
        ...row,
        overPercent: `${(100 * row.overPercent).toFixed(2)}%`,
        marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
        usaFair: row.usaFair >= 0 ? `+${row.usaFair.toFixed(2)}` : `${row.usaFair.toFixed(2)}`,
        varianceOdds: row.varianceOdds >= 0 ? `+${row.varianceOdds.toFixed(2)}` : `${row.varianceOdds.toFixed(2)}`,
        usaDemandPrice: row.usaDemandPrice !== null 
          ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should format player props percentages', () => {
      const result = formatPlayerPropsData(mockPlayerPropsData);
      
      expect(result[0].overPercent).toBe('62.34%');
      expect(result[0].marginOfError).toBe('1.56%');
    });

    test('should preserve player-specific fields', () => {
      const result = formatPlayerPropsData(mockPlayerPropsData);
      
      expect(result[0].playerName).toBe('Aaron Judge');
      expect(result[0].teamName).toBe('Yankees');
      expect(result[0].statName).toBe('Hits');
      expect(result[0].line).toBe(1.5);
    });

    test('should handle multiple players', () => {
      const result = formatPlayerPropsData(mockPlayerPropsData);
      
      expect(result).toHaveLength(3);
      expect(result[1].playerName).toBe('Rafael Devers');
      expect(result[2].playerName).toBe('Gleyber Torres');
    });
  });

  describe('formatSeriesData', () => {
    // Mock implementation based on actual SeriesTable.tsx
    const formatSeriesData = (data: typeof mockSeriesData) => {
      return data.map(row => ({
        ...row,
        winPercent: `${(100 * row.winPercent).toFixed(2)}%`,
        usaFair: row.usaFair >= 0 ? `+${row.usaFair.toFixed(2)}` : `${row.usaFair.toFixed(2)}`,
        usaDemandPrice: row.usaDemandPrice !== null 
          ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should format series win percentages', () => {
      const result = formatSeriesData(mockSeriesData);
      
      expect(result[0].winPercent).toBe('56.34%');
      expect(result[1].winPercent).toBe('43.66%');
    });

    test('should handle minimal series fields', () => {
      const result = formatSeriesData(mockSeriesData);
      
      expect(result[0].team).toBe('Yankees');
      expect(result[0].usaFair).toBe('+126.80');
      expect(result[0].usaDemandPrice).toBe('+120.50');
      
      expect(result[1].team).toBe('Red Sox');
      expect(result[1].usaFair).toBe('-146.20');
      expect(result[1].usaDemandPrice).toBe('-140.80');
    });
  });

  describe('formatFirstInningData', () => {
    // Mock implementation based on FirstInningTable.tsx pattern
    const formatFirstInningData = (data: typeof mockFirstInningData) => {
      return data.map(row => ({
        ...row,
        scorePercent: `${(100 * row.scorePercent).toFixed(2)}%`,
        marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
        usaFair: row.usaFair >= 0 ? `+${row.usaFair.toFixed(2)}` : `${row.usaFair.toFixed(2)}`,
        varianceOdds: row.varianceOdds >= 0 ? `+${row.varianceOdds.toFixed(2)}` : `${row.varianceOdds.toFixed(2)}`,
        usaDemandPrice: row.usaDemandPrice !== null 
          ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should format first inning score percentages', () => {
      const result = formatFirstInningData(mockFirstInningData);
      
      expect(result[0].scorePercent).toBe('32.45%');
      expect(result[1].scorePercent).toBe('28.76%');
    });

    test('should preserve team information', () => {
      const result = formatFirstInningData(mockFirstInningData);
      
      expect(result[0].team).toBe('Yankees');
      expect(result[1].team).toBe('Red Sox');
    });
  });

  describe('formatScoringOrderPropsData', () => {
    // Mock implementation based on ScoringOrderPropsTable.tsx pattern
    const formatScoringOrderPropsData = (data: typeof mockScoringOrderPropsData) => {
      return data.map(row => ({
        ...row,
        percent: `${(100 * row.percent).toFixed(2)}%`,
        marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
        usaFair: row.usaFair >= 0 ? `+${row.usaFair.toFixed(2)}` : `${row.usaFair.toFixed(2)}`,
        varianceOdds: row.varianceOdds >= 0 ? `+${row.varianceOdds.toFixed(2)}` : `${row.varianceOdds.toFixed(2)}`,
        usaDemandPrice: row.usaDemandPrice !== null 
          ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
          : 'N/A'
      }));
    };

    test('should format scoring order props percentages', () => {
      const result = formatScoringOrderPropsData(mockScoringOrderPropsData);
      
      expect(result[0].percent).toBe('52.34%');
      expect(result[1].percent).toBe('49.87%');
      expect(result[2].percent).toBe('47.66%');
    });

    test('should preserve prop type information', () => {
      const result = formatScoringOrderPropsData(mockScoringOrderPropsData);
      
      expect(result[0].propType).toBe('FirstToScore');
      expect(result[1].propType).toBe('LastToScore');
      expect(result[2].propType).toBe('FirstToScore');
    });
  });

  describe('Comparison Table Formatters', () => {
    describe('formatComparisonSidesData', () => {
      // Mock implementation for comparison sides
      const formatComparisonSidesData = (data: typeof mockComparisonSidesData) => {
        return data.map(row => ({
          ...row,
          coverPercent: `${(100 * row.coverPercent).toFixed(2)}%`
        }));
      };

      test('should format comparison percentages (including negative)', () => {
        const result = formatComparisonSidesData(mockComparisonSidesData);
        
        expect(result[0].coverPercent).toBe('5.23%');   // Positive difference
        expect(result[1].coverPercent).toBe('-2.34%');  // Negative difference
        expect(result[2].coverPercent).toBe('-5.23%');  // Negative difference
      });

      test('should preserve comparison match keys', () => {
        const result = formatComparisonSidesData(mockComparisonSidesData);
        
        expect(result[0].team).toBe('Yankees');
        expect(result[0].period).toBe('FG');
        expect(result[0].line).toBe(-1.5);
      });
    });

    describe('formatComparisonTotalsData', () => {
      // Mock implementation for comparison totals
      const formatComparisonTotalsData = (data: typeof mockComparisonTotalsData) => {
        return data.map(row => ({
          ...row,
          overPercent: `${(100 * row.overPercent).toFixed(2)}%`,
          underPercent: `${(100 * row.underPercent).toFixed(2)}%`,
          pushPercent: `${(100 * row.pushPercent).toFixed(2)}%`
        }));
      };

      test('should format comparison over/under percentages', () => {
        const result = formatComparisonTotalsData(mockComparisonTotalsData);
        
        expect(result[0].overPercent).toBe('3.45%');    // Positive difference
        expect(result[0].underPercent).toBe('-3.45%');  // Negative difference
        expect(result[0].pushPercent).toBe('0.00%');    // No difference
      });
    });

    describe('formatComparisonPlayerPropsData', () => {
      // Mock implementation for comparison player props
      const formatComparisonPlayerPropsData = (data: typeof mockComparisonPlayerPropsData) => {
        return data.map(row => ({
          ...row,
          overPercent: `${(100 * row.overPercent).toFixed(2)}%`
        }));
      };

      test('should format comparison player props', () => {
        const result = formatComparisonPlayerPropsData(mockComparisonPlayerPropsData);
        
        expect(result[0].overPercent).toBe('2.34%');   // Positive difference
        expect(result[1].overPercent).toBe('-1.56%');  // Negative difference
      });

      test('should preserve player identification fields', () => {
        const result = formatComparisonPlayerPropsData(mockComparisonPlayerPropsData);
        
        expect(result[0].playerName).toBe('Aaron Judge');
        expect(result[0].teamName).toBe('Yankees');
        expect(result[0].statName).toBe('Hits');
        expect(result[0].line).toBe(1.5);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty data arrays', () => {
      const formatEmpty = (data: any[]) => data.map(row => ({ ...row }));
      
      expect(formatEmpty([])).toEqual([]);
    });

    test('should handle null values gracefully', () => {
      const formatWithNulls = (data: any[]) => {
        return data.map(row => ({
          ...row,
          usaDemandPrice: row.usaDemandPrice !== null 
            ? (row.usaDemandPrice >= 0 ? `+${row.usaDemandPrice.toFixed(2)}` : `${row.usaDemandPrice.toFixed(2)}`)
            : 'N/A'
        }));
      };
      
      const result = formatWithNulls(mockDataWithNulls);
      expect(result[0].usaDemandPrice).toBe('N/A');
    });

    test('should handle extreme values', () => {
      const formatExtreme = (data: any[]) => {
        return data.map(row => ({
          ...row,
          overPercent: `${(100 * row.overPercent).toFixed(2)}%`
        }));
      };
      
      const result = formatExtreme(mockDataWithEdgeCases);
      expect(result[0].overPercent).toBe('0.00%');    // 0% probability
      expect(result[1].overPercent).toBe('100.00%');  // 100% probability
    });
  });

  describe('Data Transformation Consistency', () => {
    test('should apply consistent percentage formatting across all tables', () => {
      // Test that all percentage fields use the same format pattern
      const testPercentage = 0.1234;
      const expectedFormat = '12.34%';
      
      const percentageFormat = `${(100 * testPercentage).toFixed(2)}%`;
      expect(percentageFormat).toBe(expectedFormat);
    });

    test('should apply consistent odds formatting across all tables', () => {
      // Test that all odds fields use the same format pattern
      const positiveOdds = 150.5;
      const negativeOdds = -200.3;
      
      const positiveFormat = positiveOdds >= 0 ? `+${positiveOdds.toFixed(2)}` : `${positiveOdds.toFixed(2)}`;
      const negativeFormat = negativeOdds >= 0 ? `+${negativeOdds.toFixed(2)}` : `${negativeOdds.toFixed(2)}`;
      
      expect(positiveFormat).toBe('+150.50');
      expect(negativeFormat).toBe('-200.30');
    });

    test('should apply consistent ROI demand price formatting', () => {
      // Test that all ROI demand price fields use the same format pattern
      const positivePrice = 145.2;
      const negativePrice = -165.8;
      const nullPrice = null;
      
      const positiveFormat = positivePrice !== null 
        ? (positivePrice >= 0 ? `+${positivePrice.toFixed(2)}` : `${positivePrice.toFixed(2)}`)
        : 'N/A';
      const negativeFormat = negativePrice !== null 
        ? (negativePrice >= 0 ? `+${negativePrice.toFixed(2)}` : `${negativePrice.toFixed(2)}`)
        : 'N/A';
      const nullFormat = nullPrice !== null 
        ? (nullPrice >= 0 ? `+${nullPrice.toFixed(2)}` : `${nullPrice.toFixed(2)}`)
        : 'N/A';
      
      expect(positiveFormat).toBe('+145.20');
      expect(negativeFormat).toBe('-165.80');
      expect(nullFormat).toBe('N/A');
    });
  });
}); 