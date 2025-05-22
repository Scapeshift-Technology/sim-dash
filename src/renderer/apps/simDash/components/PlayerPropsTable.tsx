import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { PlayerPropsData } from '@/types/bettingResults';

// ---------- Types ----------

interface PlayerPropsTableProps {
  data: PlayerPropsData[];
}

interface FormattedPlayerPropsData extends Omit<PlayerPropsData, 'overPercent' | 'marginOfError' | 'usaFair' | 'varianceOdds'> {
  overPercent: string;
  marginOfError: string;
  usaFair: string;
  varianceOdds: string;
}

// ---------- Column Config ----------

const playerPropsColumns: ColumnConfig[] = [
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
]

// ---------- Data format function ----------

function formatPlayerPropsData(data: PlayerPropsData[]): FormattedPlayerPropsData[] {
  const formattedData = data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    varianceOdds: displayAmericanOdds(Number(formatDecimal(row.varianceOdds)))
  }));

  return formattedData;
}

// ---------- Component ----------

const PlayerPropsTable: React.FC<PlayerPropsTableProps> = ({ data }) => {
  const formattedData = formatPlayerPropsData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={playerPropsColumns}
    />
  );
};

export default PlayerPropsTable; 
export { playerPropsColumns, formatPlayerPropsData };