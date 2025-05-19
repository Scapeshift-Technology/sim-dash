import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => (
  <Box sx={{ mb: 3 }}>
    <Box 
      onClick={onToggle}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        cursor: 'pointer',
        '&:hover': { opacity: 0.8 }
      }}
    >
      <Typography variant="h5" component="h2">{title}</Typography>
      <IconButton size="small">
        {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      </IconButton>
    </Box>
    {isOpen && (
      <Box sx={{ mt: 3 }}>
        {children}
      </Box>
    )}
  </Box>
);

export default CollapsibleSection;
