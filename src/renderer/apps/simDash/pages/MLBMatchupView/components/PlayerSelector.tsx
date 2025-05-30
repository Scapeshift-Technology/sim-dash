import React from 'react';
import { Typography, Select, MenuItem, FormControl } from '@mui/material';
import { Player } from '@@/types/mlb';

interface PlayerSelectorProps {
  label: string; // e.g., "AB:", "P:"
  currentPlayer: string; // The current player's name
  currentPlayerId: number | undefined; // The current player's ID
  availablePlayers: Player[]; // Available players to select from
  isEditable: boolean;
  textAlign?: 'left' | 'right' | 'center';
  onPlayerChange?: (playerId: number) => void; // Callback for when selection changes
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  label,
  currentPlayer,
  currentPlayerId,
  availablePlayers,
  isEditable,
  textAlign = 'left',
  onPlayerChange
}) => {
  const handleChange = (event: any) => {
    const playerId = event.target.value as number;
    if (onPlayerChange) {
      onPlayerChange(playerId);
    }
  };

  if (!isEditable) {
    return (
      <Typography sx={{ textAlign }}>
        {label} {currentPlayer}
      </Typography>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 140, textAlign }}>
      <Select
        value={currentPlayerId || ''}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return `${label} ${currentPlayer}`;
          }
          const player = availablePlayers.find(p => p.id === selected);
          return `${label} ${player?.name || currentPlayer}`;
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: '2px 8px',
            fontSize: '0.875rem',
            textAlign: textAlign === 'right' ? 'right' : 'left'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: '1px solid rgba(0, 0, 0, 0.23)'
          }
        }}
      >
        {availablePlayers.map((player) => (
          <MenuItem key={player.id} value={player.id}>
            {player.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default PlayerSelector; 