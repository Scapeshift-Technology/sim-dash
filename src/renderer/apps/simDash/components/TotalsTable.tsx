import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/simDash/utils/display';
import { TotalsData } from '@/types/bettingResults';

// ---------- Types ----------

interface TotalsTableProps {
  data: TotalsData[];
}

interface FormattedTotalsData extends Omit<TotalsData, 'overPercent' | 'underPercent' | 'pushPercent' | 'marginOfError' | 'usaFairOver' | 'usaFairUnder' | 'varianceOddsOver' | 'varianceOddsUnder'> {
  overPercent: string;
  underPercent: string;
  pushPercent: string;
  marginOfError: string;
  usaFairOver: string;
  usaFairUnder: string;
  varianceOddsOver: string;
  varianceOddsUnder: string;
}

// ---------- Column config ----------

const totalsColumns: ColumnConfig[] = [
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
    name: 'period', 
    type: 'string', 
    label: 'Period',
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
        }
      ]
    }
  },
  { 
    name: 'underPercent', 
    type: 'string', 
    label: 'Under %',
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
    name: 'pushPercent', 
    type: 'string', 
    label: 'Push %',
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
    name: 'usaFairOver', 
    type: 'string', 
    label: 'USA-Fair Over'
  },
  { 
    name: 'usaFairUnder', 
    type: 'string', 
    label: 'USA-Fair Under'
  },
  { 
    name: 'varianceOddsOver', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC Over'
  },
  { 
    name: 'varianceOddsUnder', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC Under'
  }
];

// ---------- Data format function ----------

function formatTotalsData(data: TotalsData[]): FormattedTotalsData[] {
  return data.map(row => ({
    ...row,
    overPercent: `${(100 * row.overPercent).toFixed(2)}%`,
    underPercent: `${(100 * row.underPercent).toFixed(2)}%`,
    pushPercent: `${(100 * row.pushPercent).toFixed(2)}%`,
    marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
    usaFairOver: displayAmericanOdds(Number(row.usaFairOver.toFixed(2))),
    usaFairUnder: displayAmericanOdds(Number(row.usaFairUnder.toFixed(2))),
    varianceOddsOver: displayAmericanOdds(Number(row.varianceOddsOver.toFixed(2))),
    varianceOddsUnder: displayAmericanOdds(Number(row.varianceOddsUnder.toFixed(2)))
  }));
}

// ---------- Component ----------

const TotalsTable: React.FC<TotalsTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatTotalsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={totalsColumns}
    />
  );
};

export default TotalsTable; 
export { totalsColumns, formatTotalsData };