import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { displayAmericanOdds, formatDecimal } from '@/simDash/utils/display';
import { formatROIDemandPrice } from '@/simDash/utils/roiCalculations';
import { SeriesData } from '@/types/bettingResults';

// ---------- Types ----------

interface SeriesTableProps {
  data: SeriesData[];
}

interface FormattedSeriesData extends Omit<SeriesData, 'winPercent' | 'usaFair' | 'usaDemandPrice'> {
  winPercent: string;
  usaFair: string;
  usaDemandPrice: string;
}

// ---------- Column config ----------

const seriesColumns: ColumnConfig[] = [
  { 
    name: 'team', 
    type: 'string', 
    label: 'Team',
    width: 80,
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
    name: 'usaFair', 
    type: 'string', 
    label: 'USA-Fair',
    width: 90
  },
  { 
    name: 'usaDemandPrice', 
    type: 'string', 
    label: 'ROI Demand Price',
    width: 120
  }
];

// ---------- Data format function ----------

function formatSeriesData(data: SeriesData[]): FormattedSeriesData[] {
  return data.map(row => ({
    ...row,
    winPercent: `${formatDecimal(100 * row.winPercent)}%`,
    usaFair: displayAmericanOdds(Number(formatDecimal(row.usaFair))),
    usaDemandPrice: formatROIDemandPrice(row.usaDemandPrice)
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