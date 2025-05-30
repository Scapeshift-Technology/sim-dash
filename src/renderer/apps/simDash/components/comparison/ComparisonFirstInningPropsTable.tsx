import React from 'react';
import { ColumnConfig } from '@/apps/simDash/components/Inline';
import Inline from '@/apps/simDash/components/Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ComparisonFirstInningPropsData } from '@/types/bettingResults';
import { 
  createComparisonColorRules, 
  COLOR_MAX_VALUES 
} from '@/simDash/utils/comparisonTableColors';

// ---------- Types ----------

interface ComparisonFirstInningPropsTableProps {
  data: ComparisonFirstInningPropsData[];
}

interface FormattedComparisonFirstInningPropsData extends Omit<ComparisonFirstInningPropsData, 'scorePercent'> {
  scorePercent: string;
}

// ---------- Column config ----------

function getComparisonFirstInningPropsColumns(data: ComparisonFirstInningPropsData[]): ColumnConfig[] {
  const matchKeys: (keyof ComparisonFirstInningPropsData)[] = ['team'];
  
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
      name: 'scorePercent',
      type: 'string',
      label: 'Score %',
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

// ---------- Data format function ----------

function formatComparisonFirstInningPropsData(data: ComparisonFirstInningPropsData[]): FormattedComparisonFirstInningPropsData[] {
  return data.map(row => ({
    ...row,
    scorePercent: `${formatDecimal(100 * row.scorePercent)}%`
  }));
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
export { getComparisonFirstInningPropsColumns, formatComparisonFirstInningPropsData }; 