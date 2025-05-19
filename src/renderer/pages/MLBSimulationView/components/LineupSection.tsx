import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { ReducedMatchupLineups } from '@@/types/simHistory';
import LineupDisplay from './LineupDisplay';
import { LineupsSource } from '@@/types/mlb';

interface LineupSectionProps {
  lineups: ReducedMatchupLineups | null;
  awayTeamName: string | null;
  homeTeamName: string | null;
  lineupsSource?: LineupsSource;
}

const LineupSection: React.FC<LineupSectionProps> = ({ lineups, awayTeamName, homeTeamName, lineupsSource }) => {
  return (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'background.paper', 
      borderRadius: 1,
      border: 1,
      borderColor: 'divider'
    }}>
      {lineups && (
        <>
          {lineupsSource && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Source: {lineupsSource}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ 
            display: 'flex', 
            gap: 4,
            minWidth: { xs: '100%', sm: '600px' },
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            <LineupDisplay teamName={awayTeamName || 'Away Team'} teamLineup={lineups.away} />
            <Divider orientation="vertical" flexItem />
            <LineupDisplay teamName={homeTeamName || 'Home Team'} teamLineup={lineups.home} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default LineupSection;
