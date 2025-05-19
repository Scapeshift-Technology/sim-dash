import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { ReducedPlayer } from '@@/types/simHistory';

interface LineupDisplayProps {
  teamName: string;
  teamLineup: {
    startingPitcher: ReducedPlayer;
    bullpen: ReducedPlayer[];
    lineup: ReducedPlayer[];
    bench: ReducedPlayer[];
  };
}

const LineupDisplay: React.FC<LineupDisplayProps> = ({ teamName, teamLineup }) => {
  const renderPlayerList = (players: ReducedPlayer[]) => (
    <List dense sx={{ py: 0 }}>
      {players.map((player) => (
        <ListItem key={player.id} sx={{ py: 0 }}>
          <ListItemText primary={player.name} sx={{ m: 0 }} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
        {teamName}
      </Typography>
      
      <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
        Starting Pitcher
      </Typography>
      <List dense sx={{ py: 0 }}>
        <ListItem sx={{ py: 0 }}>
          <ListItemText primary={teamLineup.startingPitcher.name} sx={{ m: 0 }} />
        </ListItem>
      </List>

      <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
        Bullpen
      </Typography>
      {renderPlayerList(teamLineup.bullpen)}

      <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
        Lineup
      </Typography>
      {renderPlayerList(teamLineup.lineup)}

      <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
        Bench
      </Typography>
      {renderPlayerList(teamLineup.bench)}
    </Box>
  );
};

export default LineupDisplay;
