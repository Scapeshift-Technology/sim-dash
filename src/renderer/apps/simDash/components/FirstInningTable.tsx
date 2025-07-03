import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { FirstInningPropsData } from '@@/types/bettingResults';
import { formatFirstInningData, FormattedFirstInningData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface FirstInningTableProps {
  data: FirstInningPropsData[];
}

// ---------- Column Config ----------

const firstInningColumns: ColumnConfig[] = [
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
    name: 'scorePercent', 
    type: 'string', 
    label: 'Score %',
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
    label: 'USA-Fair(Ov)',
    width: 110
  },
  { 
    name: 'varianceOddsOver', 
    type: 'string', // Type is string as displayAmericanOdds returns string
    label: 'USA-MOE-PESSIMISTIC Over',
    width: 150,
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
    name: 'varianceOddsUnder',
    type: 'string', // Type is string as displayAmericanOdds returns string
    label: 'USA-MOE-PESSIMISTIC Under',
    width: 150,
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

const FirstInningTable: React.FC<FirstInningTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting and calculate virtual columns
  const formattedData = formatFirstInningData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={firstInningColumns}
    />
  );
};

export default FirstInningTable;
export { firstInningColumns };