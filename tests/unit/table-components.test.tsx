/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the new unified BettingTable component with column configs
import BettingTable, {
  sidesColumns,
  totalsColumns,
  playerPropsColumns,
  firstInningColumns,
  scoringOrderPropsColumns,
  seriesColumns,
  getComparisonSidesColumns,
  getComparisonTotalsColumns,
  getComparisonPlayerPropsColumns,
  getComparisonFirstInningPropsColumns,
  getComparisonScoringOrderPropsColumns
} from '../../src/renderer/apps/simDash/components/BettingTable';

// Import data formatters
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

// Import test fixtures
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

// Mock the utility functions using path aliases
jest.mock('@/simDash/utils/copyUtils', () => ({
  convertTableToTSV: jest.fn(() => 'mocked-tsv-content')
}));

jest.mock('@/simDash/utils/display', () => ({
  formatDecimal: jest.fn((value: number, places: number = 2) => value.toFixed(places)),
  formatAmericanOdds: jest.fn((value: number) => value >= 0 ? `+${value.toFixed(2)}` : `${value.toFixed(2)}`),
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

// Mock the Inline component to avoid complex table rendering
jest.mock('../../src/renderer/apps/simDash/components/Inline', () => {
  return function MockInline({ data, columns }: any) {
    return (
      <div data-testid="table-container">
        <div data-testid="column-count">Columns: {columns.length}</div>
        <div data-testid="row-count">Rows: {data.length}</div>
        <div data-testid="first-column">{columns[0]?.name}</div>
        {data.map((row: any, index: number) => (
          <div key={index} data-testid={`row-${index}`}>
            {JSON.stringify(row)}
          </div>
        ))}
      </div>
    );
  };
});

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('Unified BettingTable Component Tests', () => {
  describe('Main Table Modes', () => {
    test('SidesTable functionality', () => {
      const formattedData = formatSidesData(mockSidesData);
      render(<BettingTable data={formattedData} columns={sidesColumns} />);
      
      // Should render table container
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 8');
      expect(screen.getByTestId('row-count')).toHaveTextContent('Rows: 3');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
      
      // Should render data rows
      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.getByTestId('row-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-2')).toBeInTheDocument();
    });

    test('TotalsTable functionality', () => {
      const formattedData = formatTotalsData(mockTotalsData);
      render(<BettingTable data={formattedData} columns={totalsColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 13');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('PlayerPropsTable functionality', () => {
      const formattedData = formatPlayerPropsData(mockPlayerPropsData);
      render(<BettingTable data={formattedData} columns={playerPropsColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 9');
      expect(screen.getByTestId('first-column')).toHaveTextContent('playerName');
    });

    test('FirstInningTable functionality', () => {
      const formattedData = formatFirstInningData(mockFirstInningData);
      render(<BettingTable data={formattedData} columns={firstInningColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 7');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('ScoringOrderPropsTable functionality', () => {
      const formattedData = formatScoringOrderPropsData(mockScoringOrderPropsData);
      render(<BettingTable data={formattedData} columns={scoringOrderPropsColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 7');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('SeriesTable functionality', () => {
      const formattedData = formatSeriesData(mockSeriesData);
      render(<BettingTable data={formattedData} columns={seriesColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 4');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });
  });

  describe('Comparison Table Modes', () => {
    test('ComparisonSidesTable functionality', () => {
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
            maxValues: { coverPercent: 0.25 }
          }}
        />
      );
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 4');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('ComparisonTotalsTable functionality', () => {
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
            maxValues: { overPercent: 0.25, underPercent: 0.25, pushPercent: 0.25 }
          }}
        />
      );
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 6');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('ComparisonPlayerPropsTable functionality', () => {
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
            maxValues: { overPercent: 0.25 }
          }}
        />
      );
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 5');
      expect(screen.getByTestId('first-column')).toHaveTextContent('playerName');
    });

    test('ComparisonFirstInningPropsTable functionality', () => {
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
            maxValues: { scorePercent: 0.25 }
          }}
        />
      );
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 2');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });

    test('ComparisonScoringOrderPropsTable functionality', () => {
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
            maxValues: { percent: 0.25 }
          }}
        />
      );
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('column-count')).toHaveTextContent('Columns: 3');
      expect(screen.getByTestId('first-column')).toHaveTextContent('team');
    });
  });

  describe('Error Handling', () => {
    test('handles empty data arrays', () => {
      render(<BettingTable data={[]} columns={sidesColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('row-count')).toHaveTextContent('Rows: 0');
    });

    test('handles null/undefined values in data', () => {
      const dataWithNulls = [{
        team: null,
        period: 'FG',
        line: -1.5,
        coverPercent: '50.00%',
        marginOfError: '5.00%',
        usaFair: 'N/A',
        varianceOdds: 'N/A',
        usaDemandPrice: 'N/A'
      }];
      
      render(<BettingTable data={dataWithNulls} columns={sidesColumns} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.getByTestId('row-count')).toHaveTextContent('Rows: 1');
    });

    test('validates comparison mode without config', () => {
      const formattedData = formatComparisonSidesData(mockComparisonSidesData);
      const columns = getComparisonSidesColumns(mockComparisonSidesData);
      
      // Should still render without comparisonConfig
      render(<BettingTable data={formattedData} columns={columns} comparison={true} />);
      
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
    });
  });
}); 