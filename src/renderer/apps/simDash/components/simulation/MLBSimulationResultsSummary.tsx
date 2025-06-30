import React, { useEffect, useState } from 'react';
import { Box, Typography, SxProps, Theme, TypographyVariant, Paper, IconButton, Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { SimHistoryEntry } from '@/types/simHistory';
import { calculateResultsSummaryDisplayMLB, formatBettingBoundsDisplay, isBettingBoundsComplete } from '@/simDash/utils/oddsUtilsMLB';
import { selectBettingBoundsValues } from '@/simDash/store/slices/bettingBoundsSlice';

interface MLBSimulationResultsSummaryProps {
  simHistory: SimHistoryEntry[];
  isLoading?: boolean;
  awayTeamName: string;
  homeTeamName: string;
  daySequence: number | undefined;
  matchId?: number; // Optional for backward compatibility
  sx?: SxProps<Theme>;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  displayHistory?: boolean;
}

const MLBSimulationResultsSummary: React.FC<MLBSimulationResultsSummaryProps> = ({
  simHistory,
  isLoading = false,
  awayTeamName,
  homeTeamName,
  daySequence,
  matchId,
  sx = {},
  className,
  size = 'medium',
  displayHistory = false
}) => {
  // ---------- Redux State ----------
  const bettingBounds = useSelector((state: RootState) => 
    matchId ? selectBettingBoundsValues(state, 'MLB', matchId) : null
  );

  // ---------- State ----------
  const [display, setDisplay] = useState<{
    topLine: string;
    bottomLine: string;
  } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSim, setSelectedSim] = useState<SimHistoryEntry | null>(null);

  // ---------- Helper function to get display info for any simulation ----------
  const getHistoryDisplayInfo = (simEntry: SimHistoryEntry) => {
    // Always start with simulation results as the base
    const simDisplayInfo = calculateResultsSummaryDisplayMLB(simEntry.simResults, awayTeamName, homeTeamName);
    
    // Try to enhance with betting bounds from the sim entry's input data
    const simBettingBounds = simEntry.inputData?.gameInfo?.bettingBounds;
    
    if (simBettingBounds) {
      const boundsData = {
        awayML: simBettingBounds.awayML.toString(),
        homeML: simBettingBounds.homeML.toString(),
        totalLine: simBettingBounds.over.line.toString(),
        overOdds: simBettingBounds.over.odds.toString(),
        underOdds: simBettingBounds.under.odds.toString()
      };
      
      if (isBettingBoundsComplete(boundsData)) {
        return formatBettingBoundsDisplay(boundsData, awayTeamName, homeTeamName);
      }
    }
    
    // Fall back to simulation results
    return simDisplayInfo;
  };

  // ---------- Effect ----------
  useEffect(() => {
    // Set the most recent simulation as selected by default when history changes
    if (simHistory.length > 0) {
      setSelectedSim(simHistory[0]);
    }
  }, [simHistory]);

  useEffect(() => {
    if (selectedSim) {
      // Always start with simulation results as the base
      const simDisplayInfo = calculateResultsSummaryDisplayMLB(selectedSim.simResults, awayTeamName, homeTeamName);
      
      // Try to enhance with betting bounds if available and complete
      if (bettingBounds && isBettingBoundsComplete(bettingBounds)) {
        setDisplay(formatBettingBoundsDisplay(bettingBounds, awayTeamName, homeTeamName));
      } else {
        // Check if the selected sim has betting bounds in its input data
        const simBettingBounds = selectedSim.inputData?.gameInfo?.bettingBounds;
        
        if (simBettingBounds) {
          const boundsData = {
            awayML: simBettingBounds.awayML.toString(),
            homeML: simBettingBounds.homeML.toString(),
            totalLine: simBettingBounds.over.line.toString(),
            overOdds: simBettingBounds.over.odds.toString(),
            underOdds: simBettingBounds.under.odds.toString()
          };
          
          if (isBettingBoundsComplete(boundsData)) {
            setDisplay(formatBettingBoundsDisplay(boundsData, awayTeamName, homeTeamName));
          } else {
            // Fall back to simulation results
            setDisplay(simDisplayInfo);
          }
        } else {
          // Fall back to simulation results
          setDisplay(simDisplayInfo);
        }
      }
    }
  }, [selectedSim, awayTeamName, homeTeamName, bettingBounds]);

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

  // ---------- Handlers ----------
  const handleClick = async () => {
    if (selectedSim) {
      try {
        await window.electronAPI.createSimWindow({ 
          league: 'MLB',
          matchupId: selectedSim.matchId,
          timestamp: selectedSim.timestamp,
          awayTeamName, 
          homeTeamName,
          daySequence
        });
      } catch (error) {
        console.error('Failed to create simulation window:', error);
      }
    }
  };

  const handleHistoryClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleHistoryClose = () => {
    setAnchorEl(null);
  };

  const handleHistoryItemClick = (historyEntry: SimHistoryEntry) => {
    setSelectedSim(historyEntry);
    handleHistoryClose();
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
        cursor: selectedSim ? 'pointer' : 'default',
        opacity: 1,
        transition: 'all 0.3s ease-in-out',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover': selectedSim ? {
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
      {displayHistory && (
        <>
          <IconButton
            size="small"
            onClick={handleHistoryClick}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 2,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleHistoryClose}
            onClick={(e) => e.stopPropagation()}
            slotProps={{
              paper: {
                sx: {
                  maxHeight: 300,
                  width: 250,
                },
              },
            }}
          >
            {isLoading ? (
              <MenuItem disabled>
                <ListItemText primary="Loading history..." />
              </MenuItem>
            ) : simHistory.length === 0 ? (
              <MenuItem disabled>
                <ListItemText primary="No history available" />
              </MenuItem>
            ) : (
              simHistory.map((entry) => {
                const displayInfo = getHistoryDisplayInfo(entry);
                return (
                  <MenuItem 
                    key={entry.timestamp} 
                    onClick={() => handleHistoryItemClick(entry)}
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon>
                      <AccessTimeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={new Date(entry.timestamp).toLocaleString()}
                      secondary={`${displayInfo.topLine} / ${displayInfo.bottomLine}`}
                    />
                  </MenuItem>
                );
              })
            )}
          </Menu>
        </>
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {isLoading ? (
          <Typography 
            variant={sizeStyles[size].typography} 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            Loading...
          </Typography>
        ) : !selectedSim ? (
          <Typography 
            variant={sizeStyles[size].typography} 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            No simulations available
          </Typography>
        ) : (
          <>
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
          </>
        )}
      </Box>
    </Paper>
  );
};

export default MLBSimulationResultsSummary; 