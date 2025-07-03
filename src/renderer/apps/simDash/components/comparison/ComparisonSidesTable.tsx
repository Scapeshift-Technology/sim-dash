import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { ComparisonSidesData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';
import { formatComparisonSidesData, FormattedComparisonSidesData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface ComparisonSidesTableProps {
  data: ComparisonSidesData[];
}

// ---------- Column config ----------

function getComparisonSidesColumns(data: ComparisonSidesData[]): ColumnConfig[] {
  // Identify match keys for this table type
  const matchKeys: (keyof ComparisonSidesData)[] = ['team', 'period', 'line'];
  
  return [
    { 
      name: 'team', 
      type: 'string', 
      label: 'Team',
      width: 80,
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
      width: 90,
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
      label: 'Line',
      width: 70
    },
    {
      name: 'coverPercent',
      type: 'string',
      label: 'Cover % Δ',
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
            'coverPercent', 
            COLOR_MAX_VALUES.coverPercent,
            matchKeys
          )
        ]
      }
    }
  ];
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
export { getComparisonSidesColumns };
