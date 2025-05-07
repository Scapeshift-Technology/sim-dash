import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';

interface ExportButtonProps {
  data: Record<string, any>[];
  columns: { name: string; label: string }[];
  filename?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, columns, filename = 'sim_results.csv' }) => {
  const handleExport = () => {
    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.name];
        // Handle values that might contain commas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Tooltip title="Export to CSV">
      <IconButton 
        onClick={handleExport}
        size="small"
        sx={{ 
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
      >
        <Download fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default ExportButton; 