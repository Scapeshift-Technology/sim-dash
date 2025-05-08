import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/utils/display';
import { PlayerPropsData } from '@/types/bettingResults';

interface PlayerPropsTableProps {
  data: PlayerPropsData[];
}

const PlayerPropsTable: React.FC<PlayerPropsTableProps> = ({ data }) => {
  const columns: ColumnConfig[] = [
    { 
      name: 'playerName', 
      type: 'string', 
      label: 'Player',
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
      name: 'teamName', 
      type: 'string', 
      label: 'Team',
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
      name: 'statName', 
      type: 'string', 
      label: 'Stat'
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
      type: 'string', 
      label: 'USA-MOE-PESSIMISTIC'
    }
  ];

  // Transform the data to ensure proper formatting
  const formattedData = data.map(row => ({
    ...row,
    overPercent: `${(100 * row.overPercent).toFixed(2)}%`,
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

export default PlayerPropsTable; 