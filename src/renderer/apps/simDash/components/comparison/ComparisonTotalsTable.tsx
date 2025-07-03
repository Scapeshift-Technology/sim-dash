import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { ComparisonTotalsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';
import { formatComparisonTotalsData, FormattedComparisonTotalsData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface ComparisonTotalsTableProps {
  data: ComparisonTotalsData[];
}

// ---------- Column config ----------

function getComparisonTotalsColumns(data: ComparisonTotalsData[]): ColumnConfig[] {
  // Identify match keys for this table type
  const matchKeys: (keyof ComparisonTotalsData)[] = ['team', 'period', 'line'];
  
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
    },
    {
      name: 'underPercent',
      type: 'string',
      label: 'Under % Δ',
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
            'underPercent', 
            COLOR_MAX_VALUES.overPercent, // Use same max value
            matchKeys
          )
        ]
      }
    },
    {
      name: 'pushPercent',
      type: 'string',
      label: 'Push % Δ',
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
            'pushPercent', 
            COLOR_MAX_VALUES.overPercent, // Use same max value
            matchKeys
          )
        ]
      }
    }
  ];
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
export { getComparisonTotalsColumns };
