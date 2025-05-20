import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { MLBGameSimInputs } from '@/types/simInputs';
import { SimMetadataMLB } from '@@/types/simHistory';
import BettingBounds from './BettingBounds';

interface SimInputsProps {
  simInputs: MLBGameSimInputs | null;
  gameInfo: SimMetadataMLB | null;
  awayTeamName: string | null;
  homeTeamName: string | null;
}

const SimInputs: React.FC<SimInputsProps> = ({ simInputs, gameInfo, awayTeamName, homeTeamName }) => {
  const renderTeamLeans = (teamType: 'away' | 'home', teamName: string | null) => {
    if (!simInputs) return null;
    const teamData = simInputs[teamType];
    const automatedData = gameInfo?.automatedLeans?.[teamType];
    
    function formatLean(lean: number) {
      return lean.toFixed(2);
    }

    function renderLeanWithDelta(currentLean: number, automatedLean: number | undefined, label: string) {
      if (automatedLean === undefined) return `${label}: ${formatLean(currentLean)}%`;
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{label}: {formatLean(currentLean)}%</span>
          <Tooltip title={
            <Box>
              <Typography variant="body2">Automated Lean: {formatLean(automatedLean)}%</Typography>
              <Typography variant="body2">Manual Adjustment: {formatLean(currentLean - automatedLean)}%</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">Final Lean: {formatLean(currentLean)}%</Typography>
            </Box>
          }>
            <InfoIcon sx={{ fontSize: 16, color: 'action.active', cursor: 'help' }} />
          </Tooltip>
        </Box>
      );
    }
    
    return (
      <>
        <Typography variant="subtitle1" component="h5" sx={{ mb: 1, fontWeight: 'bold' }}>{teamName}</Typography>
        <Box sx={{ pl: 2 }}>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0 }}>
              <ListItemText 
                primary={renderLeanWithDelta(
                  teamData.teamHitterLean,
                  automatedData?.teamHitterLean,
                  'Team Hitting Lean'
                )}
                sx={{ m: 0 }} 
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText 
                primary={renderLeanWithDelta(
                  teamData.teamPitcherLean,
                  automatedData?.teamPitcherLean,
                  'Team Pitching Lean'
                )}
                sx={{ m: 0 }} 
              />
            </ListItem>
          </List>
          
          {Object.keys(teamData.individualHitterLeans).length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Individual Hitter Leans
              </Typography>
              <List dense sx={{ py: 0 }}>
                {Object.entries(teamData.individualHitterLeans).map(([playerId, lean]) => (
                  <ListItem key={playerId} sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`Player ${playerId}: ${formatLean(lean)}%`} 
                      sx={{ m: 0 }} 
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          {Object.keys(teamData.individualPitcherLeans).length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Individual Pitcher Leans
              </Typography>
              <List dense sx={{ py: 0 }}>
                {Object.entries(teamData.individualPitcherLeans).map(([playerId, lean]) => (
                  <ListItem key={playerId} sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`Player ${playerId}: ${formatLean(lean)}%`} 
                      sx={{ m: 0 }} 
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'background.paper', 
      borderRadius: 1,
      border: 1,
      borderColor: 'divider'
    }}>
      <BettingBounds gameInfo={gameInfo} awayTeamName={awayTeamName} homeTeamName={homeTeamName} />
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Team Leans
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: 4,
        minWidth: { xs: '100%', sm: '600px' },
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          {renderTeamLeans('away', awayTeamName)}
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          {renderTeamLeans('home', homeTeamName)}
        </Box>
      </Box>
    </Box>
  );
};

export default SimInputs;
