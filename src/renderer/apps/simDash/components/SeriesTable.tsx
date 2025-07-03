import React from 'react';
import { ColumnConfig } from './Inline';
import Inline from './Inline';
import { SeriesData } from '@/types/bettingResults';
import { formatSeriesData, FormattedSeriesData } from '@/simDash/utils/tableFormatters';

// ---------- Types ----------

interface SeriesTableProps {
  data: SeriesData[];
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
export { seriesColumns };