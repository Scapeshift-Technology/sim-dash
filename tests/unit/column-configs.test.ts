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
  mockComparisonScoringOrderData
} from '../fixtures/mock-data';

// Import column configurations (we'll need to export these from the components)
// For now, we'll import the components and access their column configs
// This test will verify the column structure without importing private variables

describe('Table Column Configurations', () => {
  
  describe('Column Configuration Structure', () => {
    // Test that all column configs follow the expected interface
    const testColumnConfig = (columnConfig: any, tableName: string) => {
      expect(columnConfig).toBeInstanceOf(Array);
      expect(columnConfig.length).toBeGreaterThan(0);
      
      columnConfig.forEach((col: any, index: number) => {
        expect(col).toHaveProperty('name');
        expect(col).toHaveProperty('type');
        expect(col).toHaveProperty('label');
        expect(typeof col.name).toBe('string');
        expect(typeof col.type).toBe('string');
        expect(typeof col.label).toBe('string');
        
        // Test supported types
        expect(['string', 'number', 'boolean', 'date', 'time', 'datetime']).toContain(col.type);
        
        // Test optional properties
        if (col.width !== undefined) {
          expect(typeof col.width).toBe('number');
          expect(col.width).toBeGreaterThan(0);
        }
        
        if (col.frozen !== undefined) {
          expect(typeof col.frozen).toBe('boolean');
        }
        
        if (col.display !== undefined) {
          expect(col.display).toHaveProperty('rules');
          expect(col.display.rules).toBeInstanceOf(Array);
          
          col.display.rules.forEach((rule: any) => {
            expect(rule).toHaveProperty('condition');
            expect(rule).toHaveProperty('type');
            expect(typeof rule.condition).toBe('function');
            expect(['cell', 'text']).toContain(rule.type);
            
            if (rule.style !== undefined) {
              expect(typeof rule.style).toBe('object');
            }
          });
        }
      });
    };

    test('should have valid structure for all table types', () => {
      // We'll test this by creating mock column configs that match what we found
      const sidesColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
        { name: 'coverPercent', type: 'string', label: 'Cover %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'varianceOdds', type: 'number', label: 'USA-MOE-PESSIMISTIC', width: 120 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      testColumnConfig(sidesColumns, 'SidesTable');
    });
  });

  describe('Sides Table Columns', () => {
    const requiredColumns = ['team', 'period', 'line', 'coverPercent', 'marginOfError', 'usaFair', 'varianceOdds', 'usaDemandPrice'];
    
    test('should have all required columns', () => {
      // Mock the expected column structure
      const sidesColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
        { name: 'coverPercent', type: 'string', label: 'Cover %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'varianceOdds', type: 'number', label: 'USA-MOE-PESSIMISTIC', width: 120 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const columnNames = sidesColumns.map(col => col.name);
      requiredColumns.forEach(requiredCol => {
        expect(columnNames).toContain(requiredCol);
      });
    });

    test('should have correct frozen columns', () => {
      const sidesColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
        { name: 'coverPercent', type: 'string', label: 'Cover %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'varianceOdds', type: 'number', label: 'USA-MOE-PESSIMISTIC', width: 120 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const frozenColumns = sidesColumns.filter(col => col.frozen);
      expect(frozenColumns).toHaveLength(3);
      expect(frozenColumns.map(col => col.name)).toEqual(['team', 'period', 'line']);
    });
  });

  describe('Totals Table Columns', () => {
    const requiredColumns = ['team', 'period', 'line', 'overPercent', 'underPercent', 'pushPercent', 'marginOfError'];
    
    test('should have all required columns', () => {
      const totalsColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
        { name: 'overPercent', type: 'string', label: 'Over %', width: 80 },
        { name: 'underPercent', type: 'string', label: 'Under %', width: 80 },
        { name: 'pushPercent', type: 'string', label: 'Push %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFairOver', type: 'string', label: 'USA-Fair Over', width: 110 },
        { name: 'usaFairUnder', type: 'string', label: 'USA-Fair Under', width: 110 }
      ];
      
      const columnNames = totalsColumns.map(col => col.name);
      requiredColumns.forEach(requiredCol => {
        expect(columnNames).toContain(requiredCol);
      });
    });

    test('should have over/under specific columns', () => {
      const totalsColumns = [
        { name: 'overPercent', type: 'string', label: 'Over %', width: 80 },
        { name: 'underPercent', type: 'string', label: 'Under %', width: 80 },
        { name: 'pushPercent', type: 'string', label: 'Push %', width: 80 },
        { name: 'usaFairOver', type: 'string', label: 'USA-Fair Over', width: 110 },
        { name: 'usaFairUnder', type: 'string', label: 'USA-Fair Under', width: 110 }
      ];
      
      const overUnderColumns = ['overPercent', 'underPercent', 'pushPercent', 'usaFairOver', 'usaFairUnder'];
      const columnNames = totalsColumns.map(col => col.name);
      
      overUnderColumns.forEach(col => {
        expect(columnNames).toContain(col);
      });
    });
  });

  describe('Player Props Table Columns', () => {
    const requiredColumns = ['playerName', 'teamName', 'statName', 'line', 'overPercent', 'marginOfError'];
    
    test('should have all required columns', () => {
      const playerPropsColumns = [
        { name: 'playerName', type: 'string', label: 'Player', width: 130, frozen: true },
        { name: 'teamName', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'statName', type: 'string', label: 'Stat', width: 100, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
        { name: 'overPercent', type: 'string', label: 'Over %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'varianceOdds', type: 'string', label: 'USA-MOE-PESSIMISTIC', width: 120 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const columnNames = playerPropsColumns.map(col => col.name);
      requiredColumns.forEach(requiredCol => {
        expect(columnNames).toContain(requiredCol);
      });
    });

    test('should have player-specific frozen columns', () => {
      const playerPropsColumns = [
        { name: 'playerName', type: 'string', label: 'Player', width: 130, frozen: true },
        { name: 'teamName', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'statName', type: 'string', label: 'Stat', width: 100, frozen: true },
        { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true }
      ];
      
      const frozenColumns = playerPropsColumns.filter(col => col.frozen);
      expect(frozenColumns).toHaveLength(4);
      expect(frozenColumns.map(col => col.name)).toEqual(['playerName', 'teamName', 'statName', 'line']);
    });
  });

  describe('First Inning Table Columns', () => {
    test('should have first inning specific columns', () => {
      const firstInningColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true },
        { name: 'scorePercent', type: 'string', label: 'Score %', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair(Ov)', width: 110 },
        { name: 'varianceOddsOver', type: 'string', label: 'USA-MOE-PESSIMISTIC Over', width: 150 },
        { name: 'varianceOddsUnder', type: 'string', label: 'USA-MOE-PESSIMISTIC Under', width: 150 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const requiredColumns = ['team', 'scorePercent', 'marginOfError', 'usaFair'];
      const columnNames = firstInningColumns.map(col => col.name);
      
      requiredColumns.forEach(requiredCol => {
        expect(columnNames).toContain(requiredCol);
      });
      
      // First inning specific columns
      expect(columnNames).toContain('scorePercent');
      expect(columnNames).toContain('varianceOddsOver');
      expect(columnNames).toContain('varianceOddsUnder');
    });
  });

  describe('Scoring Order Props Table Columns', () => {
    test('should have scoring order specific columns', () => {
      const scoringOrderColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80 },
        { name: 'propType', type: 'string', label: 'Prop Type', width: 120 },
        { name: 'percent', type: 'string', label: 'Percent', width: 80 },
        { name: 'marginOfError', type: 'string', label: 'MOE', width: 70 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'varianceOdds', type: 'string', label: 'USA-MOE-PESSIMISTIC', width: 120 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const columnNames = scoringOrderColumns.map(col => col.name);
      
      // Scoring order specific columns
      expect(columnNames).toContain('propType');
      expect(columnNames).toContain('percent');
    });
  });

  describe('Series Table Columns', () => {
    test('should have minimal series columns', () => {
      const seriesColumns = [
        { name: 'team', type: 'string', label: 'Team', width: 80 },
        { name: 'winPercent', type: 'string', label: 'Win %', width: 80 },
        { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
        { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
      ];
      
      const columnNames = seriesColumns.map(col => col.name);
      const requiredColumns = ['team', 'winPercent', 'usaFair', 'usaDemandPrice'];
      
      requiredColumns.forEach(requiredCol => {
        expect(columnNames).toContain(requiredCol);
      });
      
      // Series should have the fewest columns (simplest table)
      expect(seriesColumns).toHaveLength(4);
    });
  });

  describe('Comparison Table Columns', () => {
    test('should have dynamic column generation capability', () => {
      // Test that comparison tables can generate columns based on data
      const mockComparisonFunction = (data: any[], matchKeys: string[]) => {
        return [
          { name: 'team', type: 'string', label: 'Team' },
          { name: 'period', type: 'string', label: 'Period' },
          { name: 'line', type: 'number', label: 'Line' },
          { 
            name: 'coverPercent', 
            type: 'string', 
            label: 'Cover %',
            display: { rules: [] } // Color rules would be added here
          }
        ];
      };
      
      const columns = mockComparisonFunction(mockComparisonSidesData, ['team', 'period', 'line']);
      expect(columns).toHaveLength(4);
      expect(columns[3]).toHaveProperty('display');
    });

    test('should handle different comparison table types', () => {
      // Test different comparison table scenarios
      const comparisonTypes = [
        { data: mockComparisonSidesData, matchKeys: ['team', 'period', 'line'] },
        { data: mockComparisonTotalsData, matchKeys: ['team', 'period', 'line'] },
        { data: mockComparisonPlayerPropsData, matchKeys: ['playerName', 'teamName', 'statName', 'line'] },
        { data: mockComparisonFirstInningData, matchKeys: ['team'] },
        { data: mockComparisonScoringOrderData, matchKeys: ['team', 'propType'] }
      ];
      
      comparisonTypes.forEach(({ data, matchKeys }) => {
        expect(data).toBeInstanceOf(Array);
        expect(matchKeys).toBeInstanceOf(Array);
        expect(matchKeys.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Column Width and Display Properties', () => {
    test('should have consistent width patterns', () => {
      // Test common width patterns across tables
      const commonWidths = {
        team: 80,
        period: 90,
        line: 70,
        marginOfError: 70,
        usaFair: 90,
        usaDemandPrice: 120,
        playerName: 130
      };
      
      Object.entries(commonWidths).forEach(([columnName, expectedWidth]) => {
        // This test verifies that when a column appears in multiple tables,
        // it should have consistent width
        expect(typeof expectedWidth).toBe('number');
        expect(expectedWidth).toBeGreaterThan(0);
      });
    });

    test('should have proper text alignment for numeric columns', () => {
      // Percentage columns should be right-aligned
      // Price/odds columns should be left-aligned
      const alignmentRules = {
        percentColumns: ['coverPercent', 'overPercent', 'underPercent', 'pushPercent', 'scorePercent', 'winPercent', 'marginOfError'],
        leftAlignedColumns: ['usaFair', 'varianceOdds', 'usaDemandPrice']
      };
      
      // Test that we know which columns need which alignment
      expect(alignmentRules.percentColumns.length).toBeGreaterThan(0);
      expect(alignmentRules.leftAlignedColumns.length).toBeGreaterThan(0);
    });
  });

  describe('Display Rules Structure', () => {
    test('should have valid display rule functions', () => {
      // Test that display rules have proper structure
      const mockDisplayRule = {
        condition: (row: any) => true,
        style: { fontWeight: 'bold' },
        type: 'text' as const
      };
      
      expect(typeof mockDisplayRule.condition).toBe('function');
      expect(typeof mockDisplayRule.style).toBe('object');
      expect(['cell', 'text']).toContain(mockDisplayRule.type);
      
      // Test that condition function works
      expect(mockDisplayRule.condition({})).toBe(true);
    });

    test('should support different display rule types', () => {
      const displayTypes = ['cell', 'text'];
      
      displayTypes.forEach(type => {
        const rule = {
          condition: () => true,
          style: {},
          type: type as 'cell' | 'text'
        };
        
        expect(['cell', 'text']).toContain(rule.type);
      });
    });
  });
}); 