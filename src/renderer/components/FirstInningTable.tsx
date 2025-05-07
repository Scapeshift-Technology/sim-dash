import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/utils/display';
import { FirstInningPropsData } from '@/types/bettingResults';

interface FirstInningTableProps {
  data: FirstInningPropsData[];
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

  // Transform the data to ensure proper formatting
  const formattedData = data.map(row => ({
    ...row,
    scorePercent: `${(100 * row.scorePercent).toFixed(2)}%`,
    marginOfError: `${(100 * row.marginOfError).toFixed(2)}%`,
    usaFair: displayAmericanOdds(Number(row.usaFair.toFixed(2))),
    varianceOdds: displayAmericanOdds(Number(row.varianceOdds.toFixed(2)))
  }));

  return (
    <Inline 
      data={formattedData} 
      columns={columns}
    />
  );
};

export default FirstInningTable; 