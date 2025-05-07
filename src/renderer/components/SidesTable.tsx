import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/utils/display';
import { SidesData } from '@/types/bettingResults';

interface SidesTableProps {
  data: SidesData[];
}

const SidesTable: React.FC<SidesTableProps> = ({ data }) => {
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

  // Transform the data to ensure proper formatting
  const formattedData = data.map(row => ({
    ...row,
    coverPercent: `${(100 * row.coverPercent).toFixed(2)}%`,
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

export default SidesTable; 