import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ComparisonSidesData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

interface ComparisonSidesTableProps {
  data: ComparisonSidesData[];
}

interface FormattedComparisonSidesData extends Omit<ComparisonSidesData, 'coverPercent' | 'usaFair'> {
  coverPercent: string;
  usaFair: string;
}

// ---------- Column config ----------

function getComparisonSidesColumns(data: ComparisonSidesData[]): ColumnConfig[] {
  const matchKeys: (keyof ComparisonSidesData)[] = ['team', 'period', 'line'];
  
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
      name: 'coverPercent', 
      type: 'string', 
      label: 'Cover %',
      display: {
        rules: [
          {
            condition: () => true,
            style: { textAlign: 'right' },
            type: 'text'
          },
          ...createComparisonColorRules(
            data, 
            'coverPercent', 
            COLOR_MAX_VALUES.coverPercent,
            matchKeys
          )
        ]
      }
    },
    { 
      name: 'usaFair', 
      type: 'string', 
      label: 'USA-Fair',
      display: {
        rules: createComparisonColorRules(
          data, 
          'usaFair', 
          COLOR_MAX_VALUES.usaFair,
          matchKeys
        )
      }
    }
  ];
}

// ---------- Data format function ----------

function formatComparisonSidesData(data: ComparisonSidesData[]): FormattedComparisonSidesData[] {
  return data.map(row => ({
    ...row,
    coverPercent: `${formatDecimal(100 * row.coverPercent)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair)))
  }));
}

// ---------- Component ----------

const ComparisonSidesTable: React.FC<ComparisonSidesTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatComparisonSidesData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={getComparisonSidesColumns(data)}
    />
  );
};

export default ComparisonSidesTable; 
export { getComparisonSidesColumns, formatComparisonSidesData };
