import { Box, Typography } from '@mui/material';
import { MlbApiOfficial, OfficialType } from '@@/types/mlb/mlb-api';

interface UmpiresDisplayProps {
  officials?: MlbApiOfficial[];
  textAlign?: 'left' | 'right' | 'center';
}

const UmpiresDisplay: React.FC<UmpiresDisplayProps> = ({ 
  officials, 
  textAlign = 'center' 
}) => {
  if (!officials || officials.length === 0) return null;

  // ---------- Variables ----------

  const sortedOfficials = [...officials].sort((a, b) => {
    const order = ['Home Plate', 'First Base', 'Second Base', 'Third Base', 'Left Field', 'Right Field'];
    return order.indexOf(a.officialType) - order.indexOf(b.officialType);
  });

  // ---------- Helpers ----------

  const getAbbreviation = (officialType: OfficialType): string => {
    switch (officialType) {
      case 'Home Plate': return 'HP';
      case 'First Base': return '1B';
      case 'Second Base': return '2B';
      case 'Third Base': return '3B';
      case 'Left Field': return 'LF';
      case 'Right Field': return 'RF';
      default: return officialType;
    }
  };

  const getLastName = (fullName: string): string => {
    const parts = fullName.split(' ');
    return parts[parts.length - 1];
  };

  // ---------- Render ----------

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      overflow: 'hidden'
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary', 
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: 'fit-content'
        }}
      >
        Officials:
      </Typography>
      <Box sx={{ 
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        overflow: 'hidden',
        flexWrap: 'nowrap',
        flex: 1
      }}>
        {sortedOfficials.map((official) => (
          <Typography 
            key={official.official.id}
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              fontSize: '0.7rem',
              textAlign,
              minWidth: 'fit-content',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {getAbbreviation(official.officialType)}: {getLastName(official.official.fullName)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default UmpiresDisplay;
