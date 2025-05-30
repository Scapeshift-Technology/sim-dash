import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ComparisonScoringOrderPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

interface ComparisonScoringOrderPropsTableProps {
  data: ComparisonScoringOrderPropsData[];
}

interface FormattedComparisonScoringOrderPropsData extends Omit<ComparisonScoringOrderPropsData, 'percent'> {
  percent: string;
}

// ---------- Column config ----------

function getComparisonScoringOrderPropsColumns(data: ComparisonScoringOrderPropsData[]): ColumnConfig[] {
  const matchKeys: (keyof ComparisonScoringOrderPropsData)[] = ['team', 'propType'];
  
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
      name: 'propType', 
      type: 'string', 
      label: 'Prop Type',
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
      name: 'percent',
      type: 'string',
      label: 'Percent %',
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

// ---------- Data format function ----------

function formatComparisonScoringOrderPropsData(data: ComparisonScoringOrderPropsData[]): FormattedComparisonScoringOrderPropsData[] {
  return data.map(row => ({
    ...row,
    percent: `${formatDecimal(100 * row.percent)}%`
  }));
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
export { getComparisonScoringOrderPropsColumns, formatComparisonScoringOrderPropsData }; 