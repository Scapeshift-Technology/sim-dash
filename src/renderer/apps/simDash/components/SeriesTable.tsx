import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';

// ---------- Types ----------

interface SeriesPropsData {
  team: string;
  winPercent: number;
  usaFair: number;
}

interface SeriesTableProps {
  data: SeriesPropsData[];
}

interface FormattedSeriesData extends Omit<SeriesPropsData, 'winPercent' | 'usaFair'> {
  winPercent: string;
  usaFair: string;
}

// ---------- Column config ----------

const seriesColumns: ColumnConfig[] = [
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

// ---------- Data format function ----------

function formatSeriesData(data: SeriesPropsData[]): FormattedSeriesData[] {
  return data.map(row => ({
    ...row,
    winPercent: `${formatDecimal(100 * row.winPercent)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair)))
  }));
}

// ---------- Component ----------

const SeriesTable: React.FC<SeriesTableProps> = ({ data }) => {
  // Transform the data to ensure proper formatting
  const formattedData = formatSeriesData(data);

  return (
    <Inline 
      data={formattedData} 
      columns={seriesColumns}
    />
  );
};

export default SeriesTable;
export { seriesColumns, formatSeriesData };