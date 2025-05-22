import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { FirstInningPropsData } from '@@/types/bettingResults';
import { proportionToAmericanOdds } from '@/simDash/utils/oddsCalculations';

// ---------- Types ----------

interface FirstInningTableProps {
  data: FirstInningPropsData[];
}

interface FormattedFirstInningData extends Omit<FirstInningPropsData, 'scorePercent' | 'marginOfError' | 'usaFair' | 'varianceOddsOver' | 'varianceOddsUnder'> {
  scorePercent: string;
  marginOfError: string;
  usaFair: string;
  varianceOddsOver: string;
  varianceOddsUnder: string;
}



// ---------- Column Config ----------

const firstInningColumns: ColumnConfig[] = [
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
    label: 'USA-Fair(Ov)'
  },
  { 
    name: 'varianceOddsOver', 
    type: 'string', // Type is string as displayAmericanOdds returns string
    label: 'USA-MOE-PESSIMISTIC Over',
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

function formatFirstInningData(data: FirstInningPropsData[]): FormattedFirstInningData[] {
  const formattedData = data.map(row => {
    const probScore = row.scorePercent; // This is a fraction (0-1)
    const moe = row.marginOfError;     // This is a fraction (0-1)

    const probForOverCalc = probScore - moe;
    const probForUnderCalc = 1-(probScore + moe);

    const americanOddsOver = proportionToAmericanOdds(probForOverCalc);
    const americanOddsUnder = proportionToAmericanOdds(probForUnderCalc);

    return {
      ...row,
      scorePercent: `${formatDecimal(100 * probScore)}%`,
      marginOfError: `${formatDecimal(100 * moe)}%`,
      usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
      // Note: row.varianceOdds is part of FirstInningPropsData but not directly used for these new columns
      varianceOddsOver: displayAmericanOdds(Number(formatDecimal(americanOddsOver))),
      varianceOddsUnder: displayAmericanOdds(Number(formatDecimal(americanOddsUnder)))
    };
  });

  return formattedData;
};

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
export { firstInningColumns, formatFirstInningData };