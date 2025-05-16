import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds } from '@/utils/display';

interface SeriesPropsData {
  team: string;
  winPercent: number;
  usaFair: number;
}

interface SeriesTableProps {
  data: SeriesPropsData[];
}

const SeriesTable: React.FC<SeriesTableProps> = ({ data }) => {
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
      name: 'winPercent', 
      type: 'string', 
      label: 'Win %',
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
    }
  ];

  // Transform the data to ensure proper formatting
  const formattedData = data.map(row => ({
    ...row,
    winPercent: `${(100 * row.winPercent).toFixed(2)}%`,
    usaFair: displayAmericanOdds(Number(row.usaFair.toFixed(2)))
  }));

  return (
    <Inline 
      data={formattedData} 
      columns={columns}
    />
  );
};

export default SeriesTable; 