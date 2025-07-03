import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { ComparisonPlayerPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';
import { formatComparisonPlayerPropsData, FormattedComparisonPlayerPropsData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface ComparisonPlayerPropsTableProps {
  data: ComparisonPlayerPropsData[];
}

// ---------- Column config ----------

function getComparisonPlayerPropsColumns(data: ComparisonPlayerPropsData[]): ColumnConfig[] {
  // Identify match keys for this table type
  const matchKeys: (keyof ComparisonPlayerPropsData)[] = ['playerName', 'teamName', 'statName', 'line'];
  
  return [
    { 
      name: 'playerName', 
      type: 'string', 
      label: 'Player',
      width: 130,
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
      width: 80,
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
      label: 'Stat',
      width: 80
    },
    { 
      name: 'line', 
      type: 'number', 
      label: 'Line',
      width: 70
    },
    {
      name: 'overPercent',
      type: 'string',
      label: 'Over % Δ',
      width: 80,
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
export { getComparisonPlayerPropsColumns }; 