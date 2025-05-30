import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

type InningDisplayProps = {
  inningStr: string;
  isEditable: boolean;
  outs?: number;
  onInningChange: (increment: boolean) => void;
  onInningHalfToggle?: () => void;
};

const InningDisplay = ({ 
  inningStr, 
  isEditable, 
  outs = 0,
  onInningChange,
  onInningHalfToggle
}: InningDisplayProps) => {
  // Split the inning string (e.g., "TOP 9" -> ["TOP", "9"])
  const inningParts = inningStr.split(' ');
  const inningHalf = inningParts[0]; // "TOP" or "BOT"
  const inningNumber = inningParts[1]; // "9"

  // ---------- Helper functions ----------

  const getDisplayInningHalf = () => {
    if (outs === 3) {
      return inningHalf === 'TOP' ? 'MID' : 'END';
    }
    return inningHalf;
  };

  const clickableInningHalf = (
    <Box
      component="span"
      onClick={isEditable && onInningHalfToggle ? onInningHalfToggle : undefined}
      sx={{
        cursor: isEditable && onInningHalfToggle ? 'pointer' : 'default',
        border: isEditable && onInningHalfToggle ? '1px solid' : 'none',
        borderColor: isEditable && onInningHalfToggle ? 'divider' : 'transparent',
        borderRadius: isEditable && onInningHalfToggle ? '4px' : 0,
        px: isEditable && onInningHalfToggle ? 0.5 : 0,
        py: isEditable && onInningHalfToggle ? 0.25 : 0,
        '&:hover': isEditable && onInningHalfToggle ? {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover'
        } : {}
      }}
    >
      {getDisplayInningHalf()}
    </Box>
  );

  // ---------- Render ----------

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        {isEditable && onInningHalfToggle ? (
          <Tooltip title={`Click to toggle between TOP and BOT`} arrow>
            {clickableInningHalf}
          </Tooltip>
        ) : (
          clickableInningHalf
        )}
        <Box component="span">{inningNumber}</Box>
      </Typography>
      {isEditable && (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => onInningChange(true)}
            sx={{ p: 0.25, fontSize: '0.75rem' }}
          >
            <KeyboardArrowUpIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onInningChange(false)}
            sx={{ p: 0.25, fontSize: '0.75rem' }}
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default InningDisplay; 