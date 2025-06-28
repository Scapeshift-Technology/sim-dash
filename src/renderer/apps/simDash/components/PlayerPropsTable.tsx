import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { formatROIDemandPrice } from '@/simDash/utils/roiCalculations';
import { PlayerPropsData } from '@/types/bettingResults';

// ---------- Types ----------

interface PlayerPropsTableProps {
  data: PlayerPropsData[];
}

interface FormattedPlayerPropsData extends Omit<PlayerPropsData, 'overPercent' | 'marginOfError' | 'usaFair' | 'varianceOdds' | 'usaDemandPrice'> {
  overPercent: string;
  marginOfError: string;
  usaFair: string;
  varianceOdds: string;
  usaDemandPrice: string;
}

// ---------- Column Config ----------

const playerPropsColumns: ColumnConfig[] = [
  { 
    name: 'playerName', 
    type: 'string', 
    label: 'Player',
    width: 130,
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
    name: 'teamName', 
    type: 'string', 
    label: 'Team',
    width: 80,
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
    name: 'statName', 
    type: 'string', 
    label: 'Stat',
    width: 100,
    frozen: true
  },
  { 
    name: 'line', 
    type: 'number', 
    label: 'Line',
    width: 70,
    frozen: true
  },
  { 
    name: 'overPercent', 
    type: 'string', 
    label: 'Over %',
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
    type: 'string', 
    label: 'USA-MOE-PESSIMISTIC',
    width: 120
  },
  { 
    name: 'usaDemandPrice', 
    type: 'string', 
    label: 'ROI Demand Price',
    width: 120
  }
]

// ---------- Data format function ----------

function formatPlayerPropsData(data: PlayerPropsData[]): FormattedPlayerPropsData[] {
  const formattedData = data.map(row => ({
    ...row,
    overPercent: `${formatDecimal(100 * row.overPercent)}%`,
    marginOfError: `${formatDecimal(100 * row.marginOfError)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    varianceOdds: displayAmericanOdds(Number(formatDecimal(row.varianceOdds))),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
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