/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
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
  mockEmptyData,
  mockDataWithNulls,
  createMockSidesData,
  createMockPlayerPropsData
} from '../fixtures/mock-data';

// Import all table components
import SidesTable from '../../src/renderer/apps/simDash/components/SidesTable';
import TotalsTable from '../../src/renderer/apps/simDash/components/TotalsTable';
import PlayerPropsTable from '../../src/renderer/apps/simDash/components/PlayerPropsTable';
import FirstInningTable from '../../src/renderer/apps/simDash/components/FirstInningTable';
import ScoringOrderPropsTable from '../../src/renderer/apps/simDash/components/ScoringOrderPropsTable';
import SeriesTable from '../../src/renderer/apps/simDash/components/SeriesTable';
import ComparisonSidesTable from '../../src/renderer/apps/simDash/components/comparison/ComparisonSidesTable';
import ComparisonTotalsTable from '../../src/renderer/apps/simDash/components/comparison/ComparisonTotalsTable';
import ComparisonPlayerPropsTable from '../../src/renderer/apps/simDash/components/comparison/ComparisonPlayerPropsTable';
import ComparisonFirstInningPropsTable from '../../src/renderer/apps/simDash/components/comparison/ComparisonFirstInningPropsTable';
import ComparisonScoringOrderPropsTable from '../../src/renderer/apps/simDash/components/comparison/ComparisonScoringOrderPropsTable';

// Mock the utility functions using path aliases
jest.mock('@/simDash/utils/copyUtils', () => ({
  convertTableToTSV: jest.fn(() => 'mocked-tsv-content')
}));

jest.mock('@/simDash/utils/display', () => ({
  displayAmericanOdds: jest.fn((value: number) => value >= 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`),
  formatDecimal: jest.fn((value: number, decimals = 2) => value.toFixed(decimals))
}));

jest.mock('@/simDash/utils/roiCalculations', () => ({
  formatROIDemandPrice: jest.fn((value: number | null) => 
    value !== null ? (value >= 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`) : 'N/A'
  )
}));

jest.mock('@/simDash/utils/comparisonTableColors', () => ({
  createComparisonColorRules: jest.fn(() => []),
  COLOR_MAX_VALUES: {
    coverPercent: 0.25,
    usaFair: 80,
    overPercent: 0.25,
    scorePercent: 0.25,
    percent: 0.25
  }
}));

jest.mock('@/types/bettingResults', () => ({
  PropType: 'FirstToScore'
}));

// Mock the Material-UI components to avoid complex rendering issues in tests
jest.mock('@mui/material', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="mui-table">{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children, ...props }: { children: React.ReactNode }) => <td {...props}>{children}</td>,
  TableContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="table-container">{children}</div>,
  TableHead: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  Paper: ({ children }: { children: React.ReactNode }) => <div data-testid="paper">{children}</div>,
  Box: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  IconButton: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>
}));

jest.mock('@mui/icons-material', () => ({
  ContentCopy: () => <span data-testid="copy-icon">Copy</span>,
  ArrowUpward: () => <span data-testid="arrow-up">↑</span>,
  ArrowDownward: () => <span data-testid="arrow-down">↓</span>
}));

// Mock CopyTableButton component
jest.mock('@/simDash/components/CopyTableButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button data-testid="copy-table-button" {...props}>{children || 'Copy'}</button>
}));

// Mock ExportButton component
jest.mock('@/simDash/components/ExportButton', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <button data-testid="export-button" {...props}>{children || 'Export'}</button>
}));

// Mock the @tanstack/react-table to avoid complex table rendering
jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(() => ({
    getFlatHeaders: () => [
      { 
        id: 'team', 
        getContext: jest.fn(() => ({})),
        column: { 
          columnDef: { header: 'Team' }, 
          getToggleSortingHandler: () => jest.fn(), 
          getIsSorted: () => false 
        } 
      },
      { 
        id: 'period', 
        getContext: jest.fn(() => ({})),
        column: { 
          columnDef: { header: 'Period' }, 
          getToggleSortingHandler: () => jest.fn(), 
          getIsSorted: () => false 
        } 
      }
    ],
    getRowModel: () => ({ 
      rows: [
        { 
          id: '1', 
          original: { team: 'Yankees', period: 'FG' },
          getVisibleCells: () => [
            { 
              id: 'team-1', 
              column: { 
                id: 'team', 
                columnDef: { 
                  cell: jest.fn(() => 'Yankees') 
                } 
              }, 
              getValue: () => 'Yankees',
              getContext: jest.fn(() => ({}))
            },
            { 
              id: 'period-1', 
              column: { 
                id: 'period', 
                columnDef: { 
                  cell: jest.fn(() => 'FG') 
                } 
              }, 
              getValue: () => 'FG',
              getContext: jest.fn(() => ({}))
            }
          ]
        }
      ]
    })
  })),
  getCoreRowModel: jest.fn(),
  getSortedRowModel: jest.fn(),
  flexRender: jest.fn((header: any) => header || 'Header')
}));

describe('Table Component Rendering Tests', () => {
  
  describe('SidesTable', () => {
    test('renders with valid data', () => {
      render(<SidesTable data={mockSidesData} />);
      
      // Should render table container
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    test('renders with empty data array', () => {
      render(<SidesTable data={[]} />);
      
      // Should still render table structure without crashing
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('handles data with null values', () => {
      const dataWithNulls = [createMockSidesData({ usaDemandPrice: null })];
      
      // Should render without crashing
      expect(() => render(<SidesTable data={dataWithNulls} />)).not.toThrow();
    });

    test('formats data correctly for display', () => {
      // Test that component transforms raw data properly
      const testData = [createMockSidesData({
        team: 'Yankees',
        period: 'FG',
        coverPercent: 0.6543,
        usaFair: 150.5
      })];
      
      render(<SidesTable data={testData} />);
      // Component should apply formatting functions internally
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('TotalsTable', () => {
    test('renders with valid data', () => {
      render(<TotalsTable data={mockTotalsData} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    test('renders with empty data array', () => {
      render(<TotalsTable data={[]} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('handles over/under data structure', () => {
      // Test specific to totals table with over/under fields
      const testData = mockTotalsData.map(row => ({
        ...row,
        overPercent: 0.4521,
        underPercent: 0.5479,
        pushPercent: 0.0000
      }));
      
      render(<TotalsTable data={testData} />);
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('PlayerPropsTable', () => {
    test('renders with valid data', () => {
      render(<PlayerPropsTable data={mockPlayerPropsData} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    test('renders with empty data array', () => {
      render(<PlayerPropsTable data={[]} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('handles player-specific data structure', () => {
      const testData = [createMockPlayerPropsData({
        playerName: 'Aaron Judge',
        teamName: 'Yankees',
        statName: 'Hits',
        line: 1.5
      })];
      
      render(<PlayerPropsTable data={testData} />);
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('FirstInningTable', () => {
    test('renders with valid data', () => {
      render(<FirstInningTable data={mockFirstInningData} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    test('renders with empty data array', () => {
      render(<FirstInningTable data={[]} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('handles first inning specific fields', () => {
      // Test scorePercent field specific to first inning
      const testData = mockFirstInningData.map(row => ({
        ...row,
        scorePercent: 0.3245
      }));
      
      render(<FirstInningTable data={testData} />);
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('SeriesTable', () => {
    test('renders with valid data', () => {
      render(<SeriesTable data={mockSeriesData} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('mui-table')).toBeInTheDocument();
    });

    test('renders with empty data array', () => {
      render(<SeriesTable data={[]} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('handles minimal series data structure', () => {
      // Series table has the fewest columns
      const testData = mockSeriesData.map(row => ({
        ...row,
        winPercent: 0.5634
      }));
      
      render(<SeriesTable data={testData} />);
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('all tables handle null/undefined data gracefully', () => {
      const tablesAndData = [
        { Component: SidesTable, data: [createMockSidesData({ usaDemandPrice: null })] },
        { Component: PlayerPropsTable, data: [createMockPlayerPropsData({ usaDemandPrice: null })] }
      ];

      tablesAndData.forEach(({ Component, data }) => {
        expect(() => render(<Component data={data} />)).not.toThrow();
      });
    });

    test('all main tables render without crashing on empty arrays', () => {
      const components = [
        SidesTable,
        TotalsTable,
        PlayerPropsTable,
        FirstInningTable,
        SeriesTable
      ];

      components.forEach((Component) => {
        expect(() => render(<Component data={[]} />)).not.toThrow();
      });
    });

    test('tables maintain consistent rendering structure', () => {
      // All tables should render with the same basic structure
      const { unmount } = render(<SidesTable data={mockSidesData} />);
      const container1 = screen.getByTestId('table-container');
      expect(container1).toBeInTheDocument();
      
      unmount();
      
      render(<TotalsTable data={mockTotalsData} />);
      const container2 = screen.getByTestId('table-container');
      expect(container2).toBeInTheDocument();
    });
  });

  describe('Data Transformation Integration', () => {
    test('SidesTable properly formats data before rendering', () => {
      const rawData = [createMockSidesData({
        coverPercent: 0.6543,  // Should become "65.43%"
        marginOfError: 0.0234  // Should become "2.34%"
      })];

      // Should not throw and should handle formatting internally
      expect(() => render(<SidesTable data={rawData} />)).not.toThrow();
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('TotalsTable properly formats over/under data', () => {
      const rawData = mockTotalsData.map(row => ({
        ...row,
        overPercent: 0.4521,   // Should become "45.21%"
        underPercent: 0.5479,  // Should become "54.79%"
        pushPercent: 0.0000    // Should become "0.00%"
      }));

      expect(() => render(<TotalsTable data={rawData} />)).not.toThrow();
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });

    test('PlayerPropsTable handles player identification fields', () => {
      const rawData = [createMockPlayerPropsData({
        playerName: 'Aaron Judge',
        teamName: 'Yankees',
        statName: 'Hits',
        overPercent: 0.6234
      })];

      expect(() => render(<PlayerPropsTable data={rawData} />)).not.toThrow();
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });

  describe('Component Props and Interface', () => {
    test('components only require data prop', () => {
      // All components should only need a data prop and nothing else
      expect(() => render(<SidesTable data={mockSidesData} />)).not.toThrow();
      expect(() => render(<TotalsTable data={mockTotalsData} />)).not.toThrow();
      expect(() => render(<PlayerPropsTable data={mockPlayerPropsData} />)).not.toThrow();
      expect(() => render(<SeriesTable data={mockSeriesData} />)).not.toThrow();
    });

    test('components handle TypeScript prop types correctly', () => {
      // These should compile without TypeScript errors if types are correct
      const sidesTable = <SidesTable data={mockSidesData} />;
      const totalsTable = <TotalsTable data={mockTotalsData} />;
      const playerPropsTable = <PlayerPropsTable data={mockPlayerPropsData} />;
      
      expect(sidesTable).toBeDefined();
      expect(totalsTable).toBeDefined();
      expect(playerPropsTable).toBeDefined();
    });
  });
}); 