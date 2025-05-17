import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/utils/display';
import { FirstInningPropsData } from '@/types/bettingResults';

interface FirstInningTableProps {
  data: FirstInningPropsData[];
}

// Helper function to convert probability to American odds
function probabilityToAmericanOdds(p: number): number {
  const epsilon = 1e-7; // Small epsilon to prevent division by zero and handle near 0/1 probabilities

  // Clamp probability to avoid extreme values or division by zero
  if (p >= 1.0 - epsilon) {
    p = 1.0 - epsilon;
  } else if (p <= epsilon) {
    p = epsilon;
  }

  if (p >= 0.5) {
    return Math.round(-(100 * p) / (1 - p));
  } else {
    return Math.round((100 * (1 - p)) / p);
  }
}

const FirstInningTable: React.FC<FirstInningTableProps> = ({ data }) => {
  const columns: ColumnConfig[] = [
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

  // Transform the data to ensure proper formatting and calculate virtual columns
  const formattedData = data.map(row => {
    const probScore = row.scorePercent; // This is a fraction (0-1)
    const moe = row.marginOfError;     // This is a fraction (0-1)

    const probForOverCalc = probScore - moe;
    const probForUnderCalc = 1-(probScore + moe);

    const americanOddsOver = probabilityToAmericanOdds(probForOverCalc);
    const americanOddsUnder = probabilityToAmericanOdds(probForUnderCalc);

    return {
      ...row,
      scorePercent: `${(100 * probScore).toFixed(2)}%`,
      marginOfError: `${(100 * moe).toFixed(2)}%`,
      usaFair: displayAmericanOdds(Number(row.usaFair.toFixed(2))),
      // Note: row.varianceOdds is part of FirstInningPropsData but not directly used for these new columns
      varianceOddsOver: displayAmericanOdds(americanOddsOver),
      varianceOddsUnder: displayAmericanOdds(americanOddsUnder)
    };
  });

  return (
    <Inline 
      data={formattedData} 
      columns={columns}
    />
  );
};

export default FirstInningTable; 