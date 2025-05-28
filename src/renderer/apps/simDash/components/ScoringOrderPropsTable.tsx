import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { ScoringOrderPropsData } from '@/types/bettingResults';

// ---------- Types ----------

interface ScoringOrderTableProps {
  data: ScoringOrderPropsData[];
}

interface FormattedScoringOrderPropsData extends Omit<ScoringOrderPropsData, 'percent' | 'usaFair' | 'varianceOdds' | 'marginOfError'> {
  percent: string;
  marginOfError: string;
  usaFair: string;
  varianceOdds: string;
}

// ---------- Column Config ----------

const scoringOrderPropsColumns: ColumnConfig[] = [
  { 
    name: 'team', 
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
    name: 'propType', 
    type: 'string', 
    label: 'Prop Type',
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
    label: 'Percent'
  },
  { 
    name: 'marginOfError', 
    type: 'string', 
    label: 'MOE',
    display: {
      rules: [
        {
          condition: () => true,
          style: { textAlign: 'right' },
          type: 'text'
        }
      ]
    }
  },
  { 
    name: 'usaFair', 
    type: 'string', 
    label: 'USA-Fair'
  },
  { 
    name: 'varianceOdds', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC'
  }
]

// ---------- Data format function ----------

function formatScoringOrderPropsData(data: ScoringOrderPropsData[]): FormattedScoringOrderPropsData[] {
  const formattedData = data.map(row => ({
    ...row,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    percent: `${formatDecimal(100 * row.percent)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    varianceOdds: displayAmericanOdds(Number(formatDecimal(row.varianceOdds)))
  }));

  return formattedData;
}

// ---------- Component ----------

const ScoringOrderPropsTable: React.FC<ScoringOrderTableProps> = ({ data }) => {
  console.log(data);
  const formattedData = formatScoringOrderPropsData(data);
  console.log(formattedData);

  return (
    <Inline 
      data={formattedData} 
      columns={scoringOrderPropsColumns}
    />
  );
};

export default ScoringOrderPropsTable; 
export { scoringOrderPropsColumns, formatScoringOrderPropsData };