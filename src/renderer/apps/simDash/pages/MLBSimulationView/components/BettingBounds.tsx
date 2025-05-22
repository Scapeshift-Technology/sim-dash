import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { SimMetadataMLB } from '@@/types/simHistory';

interface BettingBoundsProps {
  gameInfo: SimMetadataMLB | null;
  awayTeamName: string | null;
  homeTeamName: string | null;
}

const BettingBounds: React.FC<BettingBoundsProps> = ({ gameInfo, awayTeamName, homeTeamName }) => {
  if (!gameInfo?.bettingBounds) return null;
  const bounds = gameInfo.bettingBounds;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Betting Bounds
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 4, 
        alignItems: 'flex-start',
        minWidth: { xs: '100%', sm: '600px' },
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Moneyline
          </Typography>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0 }}>
              <ListItemText primary={`${awayTeamName}: ${bounds.awayML}`} sx={{ m: 0 }} />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText primary={`${homeTeamName}: ${bounds.homeML}`} sx={{ m: 0 }} />
            </ListItem>
          </List>
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Total
          </Typography>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0 }}>
              <ListItemText primary={`o${bounds.over.line} (${bounds.over.odds})`} sx={{ m: 0 }} />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText primary={`u${bounds.under.line} (${bounds.under.odds})`} sx={{ m: 0 }} />
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
};

export default BettingBounds;
