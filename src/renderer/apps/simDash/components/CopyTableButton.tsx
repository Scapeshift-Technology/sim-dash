import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ColumnConfig } from './Inline';
import { convertTableToTSV } from '@/simDash/utils/copyUtils';

interface CopyTableButtonProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
}

const CopyTableButton: React.FC<CopyTableButtonProps> = ({ data, columns }) => {
  const handleCopy = async () => {
    try {
      const tsvContent = convertTableToTSV(data, columns);
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