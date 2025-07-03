import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { SidesData } from '@/types/bettingResults';
import { formatSidesData, FormattedSidesData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface SidesTableProps {
  data: SidesData[];
}

// ---------- Column config ----------

const sidesColumns: ColumnConfig[] = [
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
    name: 'coverPercent', 
    type: 'string', 
    label: 'Cover %',
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
    name: 'usaFair', 
    type: 'string', 
    label: 'USA-Fair',
    width: 90
  },
  { 
    name: 'varianceOdds', 
    type: 'number', 
    label: 'USA-MOE-PESSIMISTIC',
    width: 120,
    display: {
      rules: [
        {
          condition: () => true,
          style: { textAlign: 'left' },
          type: 'text'
        }
      ]
    }
  },
  { 
    name: 'usaDemandPrice', 
    type: 'string', 
    label: 'ROI Demand Price',
    width: 120,
    display: {
      rules: [
        {
          condition: () => true,
          style: { textAlign: 'left' },
          type: 'text'
        }
      ]
    }
  }
];

// ---------- Component ----------

const SidesTable: React.FC<SidesTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatSidesData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={sidesColumns}
    />
  );
};

export default SidesTable; 
export { sidesColumns };