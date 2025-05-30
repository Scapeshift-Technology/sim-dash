import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ComparisonTotalsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

interface ComparisonTotalsTableProps {
  data: ComparisonTotalsData[];
}

interface FormattedComparisonTotalsData extends Omit<ComparisonTotalsData, 'overPercent' | 'underPercent' | 'pushPercent'> {
  overPercent: string;
  underPercent: string;
  pushPercent: string;
}

// ---------- Column config ----------

function getComparisonTotalsColumns(data: ComparisonTotalsData[]): ColumnConfig[] {
  const matchKeys: (keyof ComparisonTotalsData)[] = ['team', 'period', 'line'];
  
  return [
    { 
      name: 'team', 
      type: 'string', 
      label: 'Team',
      display: {
        rules: [
          {
            condition: () => true,
            style: { fontWeight: 'bold' },
            type: 'text'
          }
        ]
      }
    },
    { 
      name: 'period', 
      type: 'string', 
      label: 'Period',
      display: {
        rules: [
          {
            condition: () => true,
            style: { color: 'text.secondary' },
            type: 'text'
          }
        ]
      }
    },
    { 
      name: 'line', 
      type: 'number', 
      label: 'Line'
    },
    {
      name: 'overPercent',
      type: 'string',
      label: 'Over %',
      display: {
        rules: [
          {
            condition: () => true,
            style: { textAlign: 'right' },
            type: 'text'
          },
          ...createComparisonColorRules(
            data, 
            'overPercent', 
            COLOR_MAX_VALUES.percent,
            matchKeys
          )
        ]
      }
    },
    {
      name: 'underPercent',
      type: 'string',
      label: 'Under %',
      display: {
        rules: createComparisonColorRules(
          data, 
          'underPercent', 
          COLOR_MAX_VALUES.percent,
          matchKeys
        )
      }
    },
    {
      name: 'pushPercent',
      type: 'string',
      label: 'Push %',
      display: {
        rules: createComparisonColorRules(
          data, 
          'pushPercent', 
          COLOR_MAX_VALUES.percent,
          matchKeys
        )
      }
    }
  ];
}

// ---------- Data format function ----------

function formatComparisonTotalsData(data: ComparisonTotalsData[]): FormattedComparisonTotalsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    underPercent: `${formatDecimal(100 * row.underPercent)}%`,
    pushPercent: `${formatDecimal(100 * row.pushPercent)}%`
  }));
}

// ---------- Component ----------

const ComparisonTotalsTable: React.FC<ComparisonTotalsTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatComparisonTotalsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={getComparisonTotalsColumns(data)}
    />
  );
};

export default ComparisonTotalsTable; 
export { getComparisonTotalsColumns, formatComparisonTotalsData };
