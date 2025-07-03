import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { ComparisonScoringOrderPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';
import { formatComparisonScoringOrderPropsData, FormattedComparisonScoringOrderPropsData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface ComparisonScoringOrderPropsTableProps {
  data: ComparisonScoringOrderPropsData[];
}

// ---------- Column config ----------

function getComparisonScoringOrderPropsColumns(data: ComparisonScoringOrderPropsData[]): ColumnConfig[] {
  // Identify match keys for this table type
  const matchKeys: (keyof ComparisonScoringOrderPropsData)[] = ['team', 'propType'];
  
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
      name: 'propType', 
      type: 'string', 
      label: 'Prop Type',
      width: 120,
      display: {
        rules: [
          {
            condition: () => true,
            style: { textTransform: 'capitalize' },
            type: 'text'
          }
        ]
      }
    },
    {
      name: 'percent',
      type: 'string',
      label: 'Percent Δ',
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
            'percent', 
            COLOR_MAX_VALUES.percent,
            matchKeys
          )
        ]
      }
    }
  ];
}

// ---------- Component ----------

const ComparisonScoringOrderPropsTable: React.FC<ComparisonScoringOrderPropsTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatComparisonScoringOrderPropsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={getComparisonScoringOrderPropsColumns(data)}
    />
  );
};

export default ComparisonScoringOrderPropsTable;
export { getComparisonScoringOrderPropsColumns }; 