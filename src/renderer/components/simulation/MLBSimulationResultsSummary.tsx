import React, { useEffect, useState } from 'react';
import { Box, Typography, SxProps, Theme, TypographyVariant } from '@mui/material';
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
      py: '8px',
      px: '16px',
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
        await window.electronAPI.createSimWindow({ league: 'MLB', simData: simResults });
      } catch (error) {
        console.error('Failed to create simulation window:', error);
      }
    }
  };

  // ---------- Render ----------
  return (
    <Box
      className={className}
      onClick={handleClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        border: '1px solid transparent',
        borderRadius: '4px',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        cursor: simResults ? 'pointer' : 'default',
        opacity: simResults ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        '&:hover': simResults ? {
          backgroundColor: 'primary.dark',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
        } : {},
        ...sizeStyles[size],
        ...sx
      }}
    >
      <Typography variant={sizeStyles[size].typography} sx={{ textAlign: 'center' }}>
        {display?.topLine}
      </Typography>
      <Typography variant={sizeStyles[size].typography} sx={{ textAlign: 'center' }}>
        {display?.bottomLine}
      </Typography>
    </Box>
  );
};

export default MLBSimulationResultsSummary;
