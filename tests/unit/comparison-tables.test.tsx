import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the new unified BettingTable component with comparison functions  
import BettingTable, {
  getComparisonSidesColumns,
  getComparisonTotalsColumns,
  getComparisonPlayerPropsColumns,
  getComparisonFirstInningPropsColumns,
  getComparisonScoringOrderPropsColumns
} from '../../src/renderer/apps/simDash/components/BettingTable';

// Import color logic functions
import { 
  calculateIntensity, 
  generateBackgroundColor, 
  createComparisonColorRules,
  COLOR_MAX_VALUES 
} from '../../src/renderer/apps/simDash/utils/comparisonTableColors';

// Import comparison data formatters
import {
  formatComparisonSidesData,
  formatComparisonTotalsData,
  formatComparisonPlayerPropsData,
  formatComparisonFirstInningPropsData,
  formatComparisonScoringOrderPropsData
} from '../../src/renderer/apps/simDash/utils/tableFormatters';

// Import test fixtures
import {
  mockComparisonSidesData,
  mockComparisonTotalsData,
  mockComparisonPlayerPropsData,
  mockComparisonFirstInningData,
  mockComparisonScoringOrderData
} from '../fixtures/mock-data';

// Mock the Inline component to avoid complex table rendering
jest.mock('../../src/renderer/apps/simDash/components/Inline', () => {
  return function MockInline({ data, columns }: any) {
    return (
      <div data-testid="mock-table">
        <div data-testid="table-columns">{JSON.stringify(columns.map((c: any) => c.name))}</div>
        <div data-testid="table-data">
          {data.map((row: any, index: number) => (
            <div key={index} data-testid={`table-row-${index}`}>
              {JSON.stringify(row)}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

describe('Comparison Table Color Logic', () => {
  describe('calculateIntensity', () => {
    test('should return 0 for zero values', () => {
      expect(calculateIntensity(0, 0.20)).toBe(0);
    });

    test('should calculate square root scaling correctly', () => {
      // Test with 20% maxValue
      expect(calculateIntensity(0.20, 0.20)).toBe(1); // sqrt(0.20/0.20) = 1
      expect(calculateIntensity(0.05, 0.20)).toBe(0.5); // sqrt(0.05/0.20) = 0.5
      expect(calculateIntensity(0.008, 0.20)).toBeCloseTo(0.2); // sqrt(0.008/0.20) ≈ 0.2
    });

    test('should cap intensity at 1.0 for values above maxValue', () => {
      expect(calculateIntensity(0.4, 0.20)).toBe(1); // Capped at 1
      expect(calculateIntensity(1.0, 0.20)).toBe(1); // Capped at 1
    });

    test('should handle negative values by using absolute value', () => {
      expect(calculateIntensity(-0.20, 0.20)).toBe(1);
      expect(calculateIntensity(-0.05, 0.20)).toBe(0.5);
    });
  });

  describe('generateBackgroundColor', () => {
    test('should return transparent for zero values', () => {
      expect(generateBackgroundColor(0, 0.20)).toBe('transparent');
    });

    test('should generate green colors for positive values', () => {
      const color = generateBackgroundColor(0.20, 0.20); // Maximum intensity
      expect(color).toBe('rgba(46, 125, 50, 0.5)');
    });

    test('should generate red colors for negative values', () => {
      const color = generateBackgroundColor(-0.20, 0.20); // Maximum intensity
      expect(color).toBe('rgba(211, 47, 47, 0.5)');
    });

    test('should vary alpha intensity correctly', () => {
      // Low intensity (0.05 / 0.20 = 0.25, sqrt(0.25) = 0.5, alpha = 0.1 + 0.5*0.4 = 0.3)
      const lowIntensity = generateBackgroundColor(0.05, 0.20);
      expect(lowIntensity).toMatch(/rgba\(46, 125, 50, 0\.3\d*\)/);
      
      // Very low intensity (0.008 / 0.20 = 0.04, sqrt(0.04) = 0.2, alpha = 0.1 + 0.2*0.4 = 0.18)
      const veryLowIntensity = generateBackgroundColor(0.008, 0.20);
      expect(veryLowIntensity).toMatch(/rgba\(46, 125, 50, 0\.18\d*\)/);
    });
  });

  describe('createComparisonColorRules', () => {
    test('should generate correct number of rules', () => {
      const mockData = [
        { team: 'Yankees', period: 'FG', line: -1.5, coverPercent: 0.15 }
      ];
      const rules = createComparisonColorRules(
        mockData, 
        'coverPercent', 
        COLOR_MAX_VALUES.percent,
        ['team', 'period', 'line']
      );
      
      // Should generate 40 rules: 2 maximum intensity + 38 gradation rules (19 levels * 2 for positive/negative)
      expect(rules).toHaveLength(40);
    });

    test('should create rules with correct condition functions', () => {
      const mockData = [
        { team: 'Yankees', period: 'FG', line: -1.5, coverPercent: 0.15 }, // High positive
        { team: 'Red Sox', period: 'FG', line: 1.5, coverPercent: -0.10 }   // Negative
      ];
      const rules = createComparisonColorRules(
        mockData, 
        'coverPercent', 
        COLOR_MAX_VALUES.percent,
        ['team', 'period', 'line']
      );
      
      // Test that conditions work correctly
      const positiveRule = rules.find(rule => 
        rule.condition({ team: 'Yankees', period: 'FG', line: -1.5 })
      );
      expect(positiveRule).toBeDefined();
      expect(positiveRule?.style.backgroundColor).toContain('46, 125, 50'); // Green
      
      const negativeRule = rules.find(rule => 
        rule.condition({ team: 'Red Sox', period: 'FG', line: 1.5 })
      );
      expect(negativeRule).toBeDefined();
      expect(negativeRule?.style.backgroundColor).toContain('211, 47, 47'); // Red
    });

    test('should handle edge cases', () => {
      const mockData = [
        { team: 'Yankees', coverPercent: 0 }, // Zero value
        { team: 'Red Sox', coverPercent: 0.5 }  // Very high value
      ];
      const rules = createComparisonColorRules(
        mockData, 
        'coverPercent', 
        COLOR_MAX_VALUES.percent,
        ['team']
      );
      
      // Zero value should not match any color rules
      const zeroMatches = rules.filter(rule => 
        rule.condition({ team: 'Yankees' })
      );
      expect(zeroMatches).toHaveLength(0);
      
      // Very high value should match maximum intensity rule
      const maxMatches = rules.filter(rule => 
        rule.condition({ team: 'Red Sox' })
      );
      expect(maxMatches.length).toBeGreaterThan(0);
    });
  });
});

describe('Unified BettingTable Comparison Mode', () => {
  describe('ComparisonSidesTable functionality', () => {
    test('should render with comparison data', () => {
      const formattedData = formatComparisonSidesData(mockComparisonSidesData);
      const columns = getComparisonSidesColumns(mockComparisonSidesData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('["team","period","line","coverPercent"]');
    });

    test('should format percentage data correctly', () => {
      const formattedData = formatComparisonSidesData(mockComparisonSidesData);
      const columns = getComparisonSidesColumns(mockComparisonSidesData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('5.23%');  // Positive difference
      expect(tableData).toContain('-2.34%'); // Negative difference
      expect(tableData).toContain('-5.23%'); // Negative difference
    });

    test('should handle empty data', () => {
      const columns = getComparisonSidesColumns([]);
      
      render(
        <BettingTable 
          data={[]} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-data')).toBeEmptyDOMElement();
    });
  });

  describe('ComparisonTotalsTable functionality', () => {
    test('should render with comparison data', () => {
      const formattedData = formatComparisonTotalsData(mockComparisonTotalsData);
      const columns = getComparisonTotalsColumns(mockComparisonTotalsData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['overPercent', 'underPercent', 'pushPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { 
              overPercent: COLOR_MAX_VALUES.percent,
              underPercent: COLOR_MAX_VALUES.percent,
              pushPercent: COLOR_MAX_VALUES.percent
            }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('["team","period","line","overPercent","underPercent","pushPercent"]');
    });

    test('should format over/under/push percentages', () => {
      const formattedData = formatComparisonTotalsData(mockComparisonTotalsData);
      const columns = getComparisonTotalsColumns(mockComparisonTotalsData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['overPercent', 'underPercent', 'pushPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { 
              overPercent: COLOR_MAX_VALUES.percent,
              underPercent: COLOR_MAX_VALUES.percent,
              pushPercent: COLOR_MAX_VALUES.percent
            }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('3.45%');   // Over positive difference
      expect(tableData).toContain('-3.45%');  // Under negative difference
      expect(tableData).toContain('0.00%');   // Push no difference
    });
  });

  describe('ComparisonPlayerPropsTable functionality', () => {
    test('should render with player props comparison data', () => {
      const formattedData = formatComparisonPlayerPropsData(mockComparisonPlayerPropsData);
      const columns = getComparisonPlayerPropsColumns(mockComparisonPlayerPropsData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['overPercent'],
            matchKeys: ['playerName', 'teamName', 'statName', 'line'],
            maxValues: { overPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('["playerName","teamName","statName","line","overPercent"]');
    });

    test('should format player prop percentages', () => {
      const formattedData = formatComparisonPlayerPropsData(mockComparisonPlayerPropsData);
      const columns = getComparisonPlayerPropsColumns(mockComparisonPlayerPropsData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['overPercent'],
            matchKeys: ['playerName', 'teamName', 'statName', 'line'],
            maxValues: { overPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('Aaron Judge');
      expect(tableData).toContain('2.34%');   // Positive difference
      expect(tableData).toContain('-1.56%');  // Negative difference
    });
  });

  describe('ComparisonFirstInningPropsTable functionality', () => {
    test('should render with first inning comparison data', () => {
      const formattedData = formatComparisonFirstInningPropsData(mockComparisonFirstInningData);
      const columns = getComparisonFirstInningPropsColumns(mockComparisonFirstInningData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['scorePercent'],
            matchKeys: ['team'],
            maxValues: { scorePercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('["team","scorePercent"]');
    });

    test('should format score percentages', () => {
      const formattedData = formatComparisonFirstInningPropsData(mockComparisonFirstInningData);
      const columns = getComparisonFirstInningPropsColumns(mockComparisonFirstInningData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['scorePercent'],
            matchKeys: ['team'],
            maxValues: { scorePercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('1.23%');   // Positive difference
      expect(tableData).toContain('-0.98%');  // Negative difference
    });
  });

  describe('ComparisonScoringOrderPropsTable functionality', () => {
    test('should render with scoring order comparison data', () => {
      const formattedData = formatComparisonScoringOrderPropsData(mockComparisonScoringOrderData);
      const columns = getComparisonScoringOrderPropsColumns(mockComparisonScoringOrderData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['percent'],
            matchKeys: ['team', 'propType'],
            maxValues: { percent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      expect(screen.getByTestId('mock-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-columns')).toHaveTextContent('["team","propType","percent"]');
    });

    test('should format scoring order percentages', () => {
      const formattedData = formatComparisonScoringOrderPropsData(mockComparisonScoringOrderData);
      const columns = getComparisonScoringOrderPropsColumns(mockComparisonScoringOrderData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['percent'],
            matchKeys: ['team', 'propType'],
            maxValues: { percent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('FirstToScore');
      expect(tableData).toContain('2.34%');   // Positive difference
      expect(tableData).toContain('-2.34%');  // Negative difference
    });
  });
});

describe('Comparison Table Edge Cases', () => {
  describe('Zero Differences', () => {
    test('should handle zero differences correctly', () => {
      const zeroData = [{
        team: 'Yankees',
        period: 'FG',
        line: -1.5,
        coverPercent: 0.0000  // Zero difference
      }];
      
      const formattedData = formatComparisonSidesData(zeroData);
      const columns = getComparisonSidesColumns(zeroData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('0.00%');
    });
  });

  describe('Very Large Differences', () => {
    test('should handle very large positive differences', () => {
      const largeData = [{
        team: 'Yankees',
        period: 'FG',
        line: -1.5,
        coverPercent: 0.5000  // 50% difference (very large)
      }];
      
      const formattedData = formatComparisonSidesData(largeData);
      const columns = getComparisonSidesColumns(largeData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('50.00%');
    });

    test('should handle very large negative differences', () => {
      const largeNegativeData = [{
        team: 'Yankees',
        period: 'FG', 
        line: -1.5,
        coverPercent: -0.5000  // -50% difference (very large)
      }];
      
      const formattedData = formatComparisonSidesData(largeNegativeData);
      const columns = getComparisonSidesColumns(largeNegativeData);
      
      render(
        <BettingTable 
          data={formattedData} 
          columns={columns}
          comparison={true}
          comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
        />
      );
      
      const tableData = screen.getByTestId('table-data').textContent;
      expect(tableData).toContain('-50.00%');
    });
  });

  describe('Color Max Values', () => {
    test('should have correct max values for simplified structure', () => {
      expect(COLOR_MAX_VALUES.percent).toBe(0.20);
    });

    test('should apply single max value for all table types', () => {
      // Test that different tables use the same max value
      const sidesRules = createComparisonColorRules(
        mockComparisonSidesData,
        'coverPercent',
        COLOR_MAX_VALUES.percent,
        ['team', 'period', 'line']
      );
      
      const totalsRules = createComparisonColorRules(
        mockComparisonTotalsData,
        'overPercent',
        COLOR_MAX_VALUES.percent,
        ['team', 'period', 'line']
      );
      
      // Both should generate the same number of rules since they use same max value
      expect(sidesRules).toHaveLength(40);
      expect(totalsRules).toHaveLength(40);
    });
  });
}); 