import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ColumnConfig } from './Inline';

interface CopyTableButtonProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
}

const CopyTableButton: React.FC<CopyTableButtonProps> = ({ data, columns }) => {
  const convertToTSV = () => {
    // Create header row using column labels
    const headers = columns.map(col => col.label).join('\t');
    
    // Convert each data row
    const rows = data.map(row => {
      return columns
        .map(col => {
          const value = row[col.name];
          if (value === null || value === undefined) return '';
          
          // Handle different data types
          switch (col.type) {
            case 'date':
              return new Date(value).toLocaleDateString();
            case 'time':
              return new Date(value).toLocaleTimeString();
            case 'datetime':
              return new Date(value).toLocaleString();
            case 'boolean':
              return value ? 'Yes' : 'No';
            default:
              return String(value);
          }
        })
        .join('\t');
    });

    // Combine headers and rows
    return [headers, ...rows].join('\n');
  };

  const handleCopy = async () => {
    try {
      const tsvContent = convertToTSV();
      await navigator.clipboard.writeText(tsvContent);
    } catch (err) {
      console.error('Failed to copy table:', err);
    }
  };

  return (
    <Tooltip title="Copy to Excel">
      <IconButton 
        onClick={handleCopy}
        size="small"
        sx={{ 
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default CopyTableButton; 