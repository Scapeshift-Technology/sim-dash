import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { SidesData } from '@/types/bettingResults';

// ---------- Types ----------

interface SidesTableProps {
  data: SidesData[];
}

interface FormattedSidesData extends Omit<SidesData, 'coverPercent' | 'marginOfError' | 'usaFair' | 'varianceOdds'> {
  coverPercent: string;
  marginOfError: string;
  usaFair: string;
  varianceOdds: string;
}

// ---------- Column config ----------

const sidesColumns: ColumnConfig[] = [
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
    name: 'coverPercent', 
    type: 'string', 
    label: 'Cover %',
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
    name: 'usaFair', 
    type: 'string', 
    label: 'USA-Fair'
  },
  { 
    name: 'varianceOdds', 
    type: 'number', 
    label: 'USA-MOE-PESSIMISTIC',
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

// ---------- Data format function ----------

function formatSidesData(data: SidesData[]): FormattedSidesData[] {
  return data.map(row => ({
    ...row,
    coverPercent: `${formatDecimal(100 * row.coverPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    varianceOdds: displayAmericanOdds(Number(formatDecimal(row.varianceOdds)))
  }));
}

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
export { sidesColumns, formatSidesData };