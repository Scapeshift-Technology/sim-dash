import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

export interface BettingTableProps<T> {
  data: T[];
  columns: ColumnConfig[];
  comparison?: boolean;
  comparisonConfig?: {
    colorFields: string[];
    matchKeys: string[];
    maxValues: Record<string, number>;
  };
}

// ---------- Column Configurations ----------

export const sidesColumns: ColumnConfig[] = [
  { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true, display: { rules: [{ condition: () => true, style: { fontWeight: 'bold' }, type: 'text' }] } },
  { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true, display: { rules: [{ condition: () => true, style: { color: 'text.secondary' }, type: 'text' }] } },
  { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
  { name: 'coverPercent', type: 'string', label: 'Cover %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'marginOfError', type: 'string', label: 'MOE', width: 70, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
  { name: 'varianceOdds', type: 'number', label: 'USA-MOE-PESSIMISTIC', width: 120, display: { rules: [{ condition: () => true, style: { textAlign: 'left' }, type: 'text' }] } },
  { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120, display: { rules: [{ condition: () => true, style: { textAlign: 'left' }, type: 'text' }] } }
];

export const totalsColumns: ColumnConfig[] = [
  { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true, display: { rules: [{ condition: () => true, style: { fontWeight: 'bold' }, type: 'text' }] } },
  { name: 'period', type: 'string', label: 'Period', width: 90, frozen: true, display: { rules: [{ condition: () => true, style: { color: 'text.secondary' }, type: 'text' }] } },
  { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
  { name: 'overPercent', type: 'string', label: 'Over %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'underPercent', type: 'string', label: 'Under %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'pushPercent', type: 'string', label: 'Push %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'marginOfError', type: 'string', label: 'MOE', width: 70, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFairOver', type: 'string', label: 'USA-Fair Over', width: 110 },
  { name: 'usaFairUnder', type: 'string', label: 'USA-Fair Under', width: 110 },
  { name: 'varianceOddsOver', type: 'string', label: 'USA-MOE-PESSIMISTIC Over', width: 150 },
  { name: 'varianceOddsUnder', type: 'string', label: 'USA-MOE-PESSIMISTIC Under', width: 150 },
  { name: 'usaDemandPriceOver', type: 'string', label: 'ROI Demand Price Over', width: 140 },
  { name: 'usaDemandPriceUnder', type: 'string', label: 'ROI Demand Price Under', width: 140 }
];

export const playerPropsColumns: ColumnConfig[] = [
  { name: 'playerName', type: 'string', label: 'Player', width: 130, frozen: true, display: { rules: [{ condition: () => true, style: { fontWeight: 'bold' }, type: 'text' }] } },
  { name: 'teamName', type: 'string', label: 'Team', width: 80, frozen: true, display: { rules: [{ condition: () => true, style: { color: 'text.secondary' }, type: 'text' }] } },
  { name: 'statName', type: 'string', label: 'Stat', width: 80, frozen: true, display: { rules: [{ condition: () => true, style: { fontWeight: 'medium' }, type: 'text' }] } },
  { name: 'line', type: 'number', label: 'Line', width: 70, frozen: true },
  { name: 'overPercent', type: 'string', label: 'Over %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'marginOfError', type: 'string', label: 'MOE', width: 70, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
  { name: 'varianceOdds', type: 'string', label: 'USA-MOE-PESSIMISTIC', width: 120 },
  { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
];

export const firstInningColumns: ColumnConfig[] = [
  { name: 'team', type: 'string', label: 'Team', width: 80, frozen: true, display: { rules: [{ condition: () => true, style: { fontWeight: 'bold' }, type: 'text' }] } },
  { name: 'scorePercent', type: 'string', label: 'Score %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'marginOfError', type: 'string', label: 'MOE', width: 70, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFair', type: 'string', label: 'USA-Fair(Ov)', width: 110 },
  { name: 'varianceOddsOver', type: 'string', label: 'USA-MOE-PESSIMISTIC Over', width: 150, display: { rules: [{ condition: () => true, style: { textAlign: 'left' }, type: 'text' }] } },
  { name: 'varianceOddsUnder', type: 'string', label: 'USA-MOE-PESSIMISTIC Under', width: 150, display: { rules: [{ condition: () => true, style: { textAlign: 'left' }, type: 'text' }] } },
  { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120, display: { rules: [{ condition: () => true, style: { textAlign: 'left' }, type: 'text' }] } }
];

export const scoringOrderPropsColumns: ColumnConfig[] = [
  { name: 'team', type: 'string', label: 'Team', width: 80, display: { rules: [{ condition: () => true, style: { color: 'text.secondary' }, type: 'text' }] } },
  { name: 'propType', type: 'string', label: 'Prop Type', width: 120, display: { rules: [{ condition: () => true, style: { textTransform: 'capitalize' }, type: 'text' }] } },
  { name: 'percent', type: 'string', label: 'Percent', width: 80 },
  { name: 'marginOfError', type: 'string', label: 'MOE', width: 70, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
  { name: 'varianceOdds', type: 'string', label: 'USA-MOE-PESSIMISTIC', width: 120 },
  { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
];

export const seriesColumns: ColumnConfig[] = [
  { name: 'team', type: 'string', label: 'Team', width: 80, display: { rules: [{ condition: () => true, style: { fontWeight: 'bold' }, type: 'text' }] } },
  { name: 'winPercent', type: 'string', label: 'Win %', width: 80, display: { rules: [{ condition: () => true, style: { textAlign: 'right' }, type: 'text' }] } },
  { name: 'usaFair', type: 'string', label: 'USA-Fair', width: 90 },
  { name: 'usaDemandPrice', type: 'string', label: 'ROI Demand Price', width: 120 }
];

// ---------- Comparison Column Configurations ----------

// Helper function to create comparison columns with color rules
function createComparisonColumns(
  baseColumns: ColumnConfig[], 
  data: any[], 
  colorFields: string[], 
  matchKeys: string[]
): ColumnConfig[] {
  return baseColumns.map(column => {
    // If this column should have color coding
    if (colorFields.includes(column.name)) {
      const maxValue = COLOR_MAX_VALUES.percent;
      
      return {
        ...column,
        label: `${column.label} Δ`, // Add delta symbol for comparison
        display: {
          rules: [
            ...(column.display?.rules || []),
            ...createComparisonColorRules(data, column.name, maxValue, matchKeys)
          ]
        }
      };
    }
    
    return column;
  });
}

// Comparison column generators
export const getComparisonSidesColumns = (data: any[]): ColumnConfig[] => 
  createComparisonColumns(
    [
      sidesColumns[0], // team
      sidesColumns[1], // period 
      sidesColumns[2], // line
      sidesColumns[3]  // coverPercent
    ],
    data,
    ['coverPercent'],
    ['team', 'period', 'line']
  );

export const getComparisonTotalsColumns = (data: any[]): ColumnConfig[] =>
  createComparisonColumns(
    [
      totalsColumns[0], // team
      totalsColumns[1], // period
      totalsColumns[2], // line
      totalsColumns[3], // overPercent
      totalsColumns[4], // underPercent
      totalsColumns[5]  // pushPercent
    ],
    data,
    ['overPercent', 'underPercent', 'pushPercent'],
    ['team', 'period', 'line']
  );

export const getComparisonPlayerPropsColumns = (data: any[]): ColumnConfig[] =>
  createComparisonColumns(
    [
      playerPropsColumns[0], // playerName
      playerPropsColumns[1], // teamName
      playerPropsColumns[2], // statName
      playerPropsColumns[3], // line
      playerPropsColumns[4]  // overPercent
    ],
    data,
    ['overPercent'],
    ['playerName', 'teamName', 'statName', 'line']
  );

export const getComparisonFirstInningPropsColumns = (data: any[]): ColumnConfig[] =>
  createComparisonColumns(
    [
      firstInningColumns[0], // team
      firstInningColumns[1]  // scorePercent
    ],
    data,
    ['scorePercent'],
    ['team']
  );

export const getComparisonScoringOrderPropsColumns = (data: any[]): ColumnConfig[] =>
  createComparisonColumns(
    [
      scoringOrderPropsColumns[0], // team
      scoringOrderPropsColumns[1], // propType
      scoringOrderPropsColumns[2]  // percent
    ],
    data,
    ['percent'],
    ['team', 'propType']
  );

// ---------- Main BettingTable Component ----------

function BettingTable<T extends Record<string, any>>({
  data,
  columns,
  comparison = false,
  comparisonConfig
}: BettingTableProps<T>): React.ReactElement {
  // For comparison tables, apply color rules to specified columns
  const finalColumns = React.useMemo(() => {
    if (!comparison || !comparisonConfig) {
      return columns;
    }

    const { colorFields, matchKeys, maxValues } = comparisonConfig;

    return columns.map(column => {
      if (colorFields.includes(column.name)) {
        const maxValue = maxValues[column.name] || COLOR_MAX_VALUES.percent;
        
        return {
          ...column,
          display: {
            rules: [
              ...(column.display?.rules || []),
              ...createComparisonColorRules(data, column.name, maxValue, matchKeys)
            ]
          }
        };
      }
      
      return column;
    });
  }, [columns, comparison, comparisonConfig, data]);

  return (
    <Inline 
      data={data} 
      columns={finalColumns}
    />
  );
}

export default BettingTable; 