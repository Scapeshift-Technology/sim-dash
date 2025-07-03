import {
  formatSidesData,
  formatTotalsData,
  formatPlayerPropsData,
  formatFirstInningData,
  formatScoringOrderPropsData,
  formatSeriesData,
  formatComparisonSidesData,
  formatComparisonTotalsData,
  formatComparisonPlayerPropsData,
  formatComparisonFirstInningPropsData,
  formatComparisonScoringOrderPropsData
} from '../../src/renderer/apps/simDash/utils/tableFormatters';

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
      expect(result[0].usaFair).toBe('N/A');
      expect(result[0].varianceOdds).toBe('N/A');
    });
  });

  describe('formatTotalsData', () => {
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

    test('should calculate variance odds over/under', () => {
      const result = formatFirstInningData(mockFirstInningData);
      
      // The formatter calculates over/under odds from scorePercent and marginOfError
      expect(result[0]).toHaveProperty('varianceOddsOver');
      expect(result[0]).toHaveProperty('varianceOddsUnder');
      expect(typeof result[0].varianceOddsOver).toBe('string');
      expect(typeof result[0].varianceOddsUnder).toBe('string');
    });
  });

  describe('formatScoringOrderPropsData', () => {
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
      test('should format comparison over/under percentages', () => {
        const result = formatComparisonTotalsData(mockComparisonTotalsData);
        
        expect(result[0].overPercent).toBe('3.45%');    // Positive difference
        expect(result[0].underPercent).toBe('-3.45%');  // Negative difference
        expect(result[0].pushPercent).toBe('0.00%');    // No difference
      });
    });

    describe('formatComparisonPlayerPropsData', () => {
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

    describe('formatComparisonFirstInningPropsData', () => {
      test('should format comparison first inning data', () => {
        const result = formatComparisonFirstInningPropsData(mockComparisonFirstInningData);
        
        expect(result[0].scorePercent).toBe('1.23%');   // Positive difference
        expect(result[1].scorePercent).toBe('-0.98%');  // Negative difference
      });
    });

    describe('formatComparisonScoringOrderPropsData', () => {
      test('should format comparison scoring order data', () => {
        const result = formatComparisonScoringOrderPropsData(mockComparisonScoringOrderData);
        
        expect(result[0].percent).toBe('2.34%');   // Positive difference
        expect(result[1].percent).toBe('-2.34%');  // Negative difference
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty data arrays', () => {
      expect(formatSidesData([])).toEqual([]);
      expect(formatTotalsData([])).toEqual([]);
      expect(formatPlayerPropsData([])).toEqual([]);
      expect(formatFirstInningData([])).toEqual([]);
      expect(formatScoringOrderPropsData([])).toEqual([]);
      expect(formatSeriesData([])).toEqual([]);
    });

    test('should handle null values gracefully', () => {
      const result = formatSidesData(mockDataWithNulls);
      expect(result[0].usaDemandPrice).toBe('N/A');
    });

    test('should handle extreme values', () => {
      const result = formatPlayerPropsData(mockDataWithEdgeCases);
      expect(result[0].overPercent).toBe('0.00%');    // 0% probability
      expect(result[1].overPercent).toBe('100.00%');  // 100% probability
    });
  });

  describe('Data Transformation Consistency', () => {
    test('should apply consistent percentage formatting across all tables', () => {
      // Test that all percentage fields use the same format pattern
      const testPercentage = 0.1234;
      
      const sidesResult = formatSidesData([createMockSidesData({ coverPercent: testPercentage })]);
      const playerResult = formatPlayerPropsData([createMockPlayerPropsData({ overPercent: testPercentage })]);
      
      expect(sidesResult[0].coverPercent).toBe('12.34%');
      expect(playerResult[0].overPercent).toBe('12.34%');
    });

    test('should apply consistent odds formatting across all tables', () => {
      // Test that all odds fields use the same format pattern
      const positiveOdds = 150.5;
      const negativeOdds = -200.3;
      
      const sidesResult = formatSidesData([createMockSidesData({ 
        usaFair: positiveOdds, 
        varianceOdds: negativeOdds 
      })]);
      
      expect(sidesResult[0].usaFair).toBe('+150.50');
      expect(sidesResult[0].varianceOdds).toBe('-200.30');
    });

    test('should apply consistent ROI demand price formatting', () => {
      // Test that all ROI demand price fields use the same format pattern
      const positivePrice = 145.2;
      const negativePrice = -165.8;
      const nullPrice = null;
      
      const result = formatSidesData([
        createMockSidesData({ usaDemandPrice: positivePrice }),
        createMockSidesData({ usaDemandPrice: negativePrice }),
        createMockSidesData({ usaDemandPrice: nullPrice })
      ]);
      
      expect(result[0].usaDemandPrice).toBe('+145.20');
      expect(result[1].usaDemandPrice).toBe('-165.80');
      expect(result[2].usaDemandPrice).toBe('N/A');
    });
  });
}); 