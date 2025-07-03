import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { TotalsData } from '@/types/bettingResults';
import { formatTotalsData, FormattedTotalsData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface TotalsTableProps {
  data: TotalsData[];
}

// ---------- Column config ----------

const totalsColumns: ColumnConfig[] = [
  { 
    name: 'team', 
    type: 'string', 
    label: 'Team',
    width: 80,
    frozen: true,
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
    frozen: true,
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
    width: 70,
    frozen: true
  },
  { 
    name: 'overPercent', 
    type: 'string', 
    label: 'Over %',
    width: 80,
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
    width: 80,
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
    width: 80,
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
    name: 'usaFairOver', 
    type: 'string', 
    label: 'USA-Fair Over',
    width: 110
  },
  { 
    name: 'usaFairUnder', 
    type: 'string', 
    label: 'USA-Fair Under',
    width: 110
  },
  { 
    name: 'varianceOddsOver', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC Over',
    width: 150
  },
  { 
    name: 'varianceOddsUnder', 
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC Under',
    width: 150
  },
  { 
    name: 'usaDemandPriceOver', 
    type: 'string', 
    label: 'ROI Demand Price Over',
    width: 140
  },
  { 
    name: 'usaDemandPriceUnder', 
    type: 'string', 
    label: 'ROI Demand Price Under',
    width: 140
  }
];

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
export { totalsColumns };