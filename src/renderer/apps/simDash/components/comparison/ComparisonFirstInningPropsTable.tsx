import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { ComparisonFirstInningPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';
import { formatComparisonFirstInningPropsData, FormattedComparisonFirstInningPropsData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface ComparisonFirstInningPropsTableProps {
  data: ComparisonFirstInningPropsData[];
}

// ---------- Column config ----------

function getComparisonFirstInningPropsColumns(data: ComparisonFirstInningPropsData[]): ColumnConfig[] {
  // Identify match keys for this table type
  const matchKeys: (keyof ComparisonFirstInningPropsData)[] = ['team'];
  
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
      name: 'scorePercent',
      type: 'string',
      label: 'Score % Δ',
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
            'scorePercent', 
            COLOR_MAX_VALUES.scorePercent,
            matchKeys
          )
        ]
      }
    }
  ];
}

// ---------- Component ----------

const ComparisonFirstInningPropsTable: React.FC<ComparisonFirstInningPropsTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatComparisonFirstInningPropsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={getComparisonFirstInningPropsColumns(data)}
    />
  );
};

export default ComparisonFirstInningPropsTable;
export { getComparisonFirstInningPropsColumns }; 