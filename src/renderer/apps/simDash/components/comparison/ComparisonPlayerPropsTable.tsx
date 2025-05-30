import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ComparisonPlayerPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

interface ComparisonPlayerPropsTableProps {
  data: ComparisonPlayerPropsData[];
}

interface FormattedComparisonPlayerPropsData extends Omit<ComparisonPlayerPropsData, 'overPercent'> {
  overPercent: string;
}

// ---------- Column config ----------

function getComparisonPlayerPropsColumns(data: ComparisonPlayerPropsData[]): ColumnConfig[] {
  const matchKeys: (keyof ComparisonPlayerPropsData)[] = ['playerName', 'teamName', 'statName', 'line'];
  
  return [
    { 
      name: 'playerName', 
      type: 'string', 
      label: 'Player',
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
      name: 'teamName', 
      type: 'string', 
      label: 'Team',
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
      name: 'statName', 
      type: 'string', 
      label: 'Stat'
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
            COLOR_MAX_VALUES.overPercent,
            matchKeys
          )
        ]
      }
    }
  ];
}

// ---------- Data format function ----------

function formatComparisonPlayerPropsData(data: ComparisonPlayerPropsData[]): FormattedComparisonPlayerPropsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`
  }));
}

// ---------- Component ----------

const ComparisonPlayerPropsTable: React.FC<ComparisonPlayerPropsTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatComparisonPlayerPropsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={getComparisonPlayerPropsColumns(data)}
    />
  );
};

export default ComparisonPlayerPropsTable; 
export { getComparisonPlayerPropsColumns, formatComparisonPlayerPropsData }; 