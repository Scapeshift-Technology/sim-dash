import {
  useSortable
} from '@dnd-kit/sortable';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Typography,
  ListItem,
  ListItemText,
  TextField
} from '@mui/material';
import type { Player, Position } from '@/types/mlb';

// ---------- Main component ----------

interface SortablePlayerItemProps {
  player: Player;
  isDraggable?: boolean;
  onPositionChange?: (playerId: number, position: Position) => void;
  lineupPosition?: number;
  onLeanChange?: (playerId: number, value: number) => void;
  leanValue?: number;
  dragId?: string;
  isCurrentPlayer?: boolean;
}

const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ 
  player, 
  isDraggable,
  onPositionChange,
  lineupPosition,
  onLeanChange,
  leanValue = 0,
  dragId,
  isCurrentPlayer
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: dragId || player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  };

  const getLeanColor = (value: number) => {
    if (value > 10 || value < -10) return 'error.main';
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const isLeanValid = (value: number) => value >= -10 && value <= 10;

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{ 
        py: 0, 
        px: .5,
        ...(isCurrentPlayer && {
          animation: 'pulse 2s infinite',
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          boxShadow: 'inset 2px 0 0 #1976d2',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        })
      }}
    >
      {lineupPosition && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mr: 0.5
          }}
        >
          {lineupPosition}.
        </Typography>
      )}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <ListItemText
            primary={
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: isCurrentPlayer ? 'bold' : 'normal' 
                }}
              >
                {player.name}
              </Typography>
            }
            sx={{ flex: '1 1 auto' }}
          />
            {/* <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                Pos:
              </Typography>
              <PositionSelector
                value={player.position || ''}
                onChange={(position) => onPositionChange?.(player.id, position)}
                disabled={!isDraggable}
              />
            </Box> */}
            <TextField
              type="number"
              size="small"
              value={leanValue}
              onChange={(e) => onLeanChange?.(player.id, Number(e.target.value))}
              error={!isLeanValid(leanValue)}
              slotProps={{
                input: {
                inputProps: { 
                  min: -10, 
                  max: 10,
                  step: .5,
                  style: {
                    padding: '0 4px',
                    textAlign: 'right',
                    MozAppearance: 'textfield'
                  }
                },
                endAdornment: <Typography variant="body2" sx={{ ml: 0.0, pr: 0.0 }}>%</Typography>
                },
              }}
              sx={{ 
                width: '55px',
                '& .MuiInputBase-root': {
                  height: '28px',
                  padding: '0 4px'
                },
                '& .MuiInputLabel-root': {
                  color: getLeanColor(leanValue)
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: getLeanColor(leanValue)
                  },
                  '&:hover fieldset': {
                    borderColor: getLeanColor(leanValue)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: getLeanColor(leanValue)
                  }
                },
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                }
              }}
        />
        </Box>
        {isDraggable && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              ml: 1,
              '&:active': { cursor: 'grabbing' }
            }}
          >
            <DragIndicatorIcon fontSize="small" color="action" />
          </Box>
        )}
    </ListItem>
  );
};

export default SortablePlayerItem;