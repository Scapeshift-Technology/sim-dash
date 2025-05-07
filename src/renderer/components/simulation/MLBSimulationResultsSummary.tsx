import React, { useEffect, useState } from 'react';
import { Box, Typography, SxProps, Theme, TypographyVariant, Paper } from '@mui/material';
import type { SimResultsMLB } from '@/types/bettingResults';
import { calculateResultsSummaryDisplayMLB } from '@/utils/oddsUtilsMLB';

interface MLBSimulationResultsSummaryProps {
  simResults: SimResultsMLB | null;
  awayTeamName: string;
  homeTeamName: string;
  sx?: SxProps<Theme>;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const MLBSimulationResultsSummary: React.FC<MLBSimulationResultsSummaryProps> = ({
  simResults,
  awayTeamName,
  homeTeamName,
  sx = {},
  className,
  size = 'medium'
}) => {
  // ---------- State ----------
  const [display, setDisplay] = useState<{
    topLine: string;
    bottomLine: string;
  } | null>(null);

  // ---------- Effect ----------
  useEffect(() => {
    if (simResults) {
      setDisplay(calculateResultsSummaryDisplayMLB(simResults, awayTeamName, homeTeamName));
    }
  }, [simResults]);

  // ---------- Styles ----------
  const sizeStyles: Record<string, { py: number | string; px: number | string; typography: TypographyVariant }> = {
    small: {
      py: 1,
      px: 2,
      typography: 'body2'
    },
    medium: {
      py: '12px',
      px: '20px',
      typography: 'body1'
    },
    large: {
      py: 2,
      px: 3,
      typography: 'h6'
    }
  };

  // ---------- Handler ----------
  const handleClick = async () => {
    if (simResults) {
      try {
        await window.electronAPI.createSimWindow({ league: 'MLB', simData: simResults, awayTeamName, homeTeamName });
      } catch (error) {
        console.error('Failed to create simulation window:', error);
      }
    }
  };

  // ---------- Render ----------
  return (
    <Paper
      className={className}
      onClick={handleClick}
      elevation={1}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        backgroundColor: 'background.paper',
        color: 'text.primary',
        cursor: simResults ? 'pointer' : 'default',
        opacity: simResults ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover': simResults ? {
          elevation: 4,
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          '& .view-icon': {
            opacity: 1,
            transform: 'translateY(0)',
          },
          '&::after': {
            opacity: 0.1,
          }
        } : {},
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, primary.main 0%, transparent 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none',
        },
        ...sizeStyles[size],
        ...sx
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography 
          variant={sizeStyles[size].typography} 
          sx={{ 
            textAlign: 'center',
            fontWeight: 'medium',
            color: 'text.primary',
            mb: 0.5
          }}
        >
          {display?.topLine}
        </Typography>
        <Typography 
          variant={sizeStyles[size].typography} 
          sx={{ 
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          {display?.bottomLine}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MLBSimulationResultsSummary;
