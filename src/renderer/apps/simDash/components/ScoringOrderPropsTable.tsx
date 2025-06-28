import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { formatROIDemandPrice } from '@/simDash/utils/roiCalculations';
import { ScoringOrderPropsData } from '@/types/bettingResults';

// ---------- Types ----------

interface ScoringOrderTableProps {
  data: ScoringOrderPropsData[];
}

interface FormattedScoringOrderPropsData extends Omit<ScoringOrderPropsData, 'percent' | 'usaFair' | 'varianceOdds' | 'marginOfError' | 'usaDemandPrice'> {
  percent: string;
  marginOfError: string;
  usaFair: string;
  varianceOdds: string;
  usaDemandPrice: string;
}

// ---------- Column Config ----------

const scoringOrderPropsColumns: ColumnConfig[] = [
  { 
    name: 'team', 
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
    label: 'Percent',
    width: 80
  },
  { 
    name: 'marginOfError', 
    type: 'string', 
    label: 'MOE',
    width: 70,
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
    label: 'USA-Fair',
    width: 90
  },
  { 
    name: 'varianceOdds', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC',
    width: 120
  },
  { 
    name: 'usaDemandPrice', 
    type: 'string', 
    label: 'ROI Demand Price',
    width: 120
  }
]

// ---------- Data format function ----------

function formatScoringOrderPropsData(data: ScoringOrderPropsData[]): FormattedScoringOrderPropsData[] {
  const formattedData = data.map(row => ({
    ...row,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    percent: `${formatDecimal(100 * row.percent)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    varianceOdds: displayAmericanOdds(Number(formatDecimal(row.varianceOdds))),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
  }));

  return formattedData;
}

// ---------- Component ----------

const ScoringOrderPropsTable: React.FC<ScoringOrderTableProps> = ({ data }) => {
  const formattedData = formatScoringOrderPropsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={scoringOrderPropsColumns}
    />
  );
};

export default ScoringOrderPropsTable; 
export { scoringOrderPropsColumns, formatScoringOrderPropsData };