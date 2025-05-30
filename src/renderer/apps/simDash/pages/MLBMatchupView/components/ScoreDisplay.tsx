import { Box, Typography, IconButton } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// ---------- Component ----------

type ScoreDisplayProps = {
  teamName: string;
  score: number;
  isEditable: boolean;
  textAlign: 'left' | 'right';
  justifyContent: 'flex-start' | 'flex-end';
  onScoreChange: (increment: boolean) => void;
};

const ScoreDisplay = ({ 
  teamName, 
  score, 
  isEditable, 
  textAlign, 
  justifyContent, 
  onScoreChange 
}: ScoreDisplayProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent, gap: 0.5 }}>
    <Typography variant="h6">{teamName} {score}</Typography>
    {isEditable && (
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
        <IconButton 
          size="small" 
          onClick={() => onScoreChange(true)}
          sx={{ p: 0.25, fontSize: '0.75rem' }}
        >
          <KeyboardArrowUpIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => onScoreChange(false)}
          sx={{ p: 0.25, fontSize: '0.75rem' }}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      </Box>
    )}
  </Box>
);

export default ScoreDisplay;
