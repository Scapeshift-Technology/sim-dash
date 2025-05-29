import React from 'react';
import { Box, Typography } from '@mui/material';
import { ReducedGameStateMLB } from '@@/types/simHistory';

interface GameStateProps {
  gameState: ReducedGameStateMLB;
  awayTeamName: string | null;
  homeTeamName: string | null;
}

const GameState: React.FC<GameStateProps> = ({ gameState, awayTeamName, homeTeamName }) => {
  const getInningDisplay = () => {
    const half = gameState.topInning ? 'Top' : 'Bottom';
    return `${half} ${gameState.inning}`;
  };

  const getBasesDisplay = () => {
    // gameState.bases is [first, second, third]
    const baseLabels = ['1st', '2nd', '3rd'];
    const occupiedBases = gameState.bases
      .map((occupied, index) => occupied ? baseLabels[index] : null)
      .filter(Boolean);
    
    return occupiedBases.length > 0 ? occupiedBases.join(', ') : 'Bases empty';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Game State
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ minWidth: '120px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Inning
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {getInningDisplay()}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: '200px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Score
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {awayTeamName || 'Away'} {gameState.awayScore} - {gameState.homeScore} {homeTeamName || 'Home'}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: '80px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Outs
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {gameState.outs}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Runners
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {getBasesDisplay()}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Away Pitcher
          </Typography>
          <Typography variant="body1">
            ID: {gameState.awayPitcher.id}
          </Typography>
        </Box>
        
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Home Pitcher
          </Typography>
          <Typography variant="body1">
            ID: {gameState.homePitcher.id}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default GameState;
