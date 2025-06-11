import { Box, Typography } from '@mui/material';
import { MlbApiWeather } from '@@/types/mlb/mlb-api';

interface LiveWeatherDisplayProps {
  weather?: MlbApiWeather;
  textAlign?: 'left' | 'right' | 'center';
}

const LiveWeatherDisplay: React.FC<LiveWeatherDisplayProps> = ({ 
  weather, 
  textAlign = 'center' 
}) => {

  // ---------- Render ----------

  if (!weather) return null;

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
        Weather:
      </Typography>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflow: 'hidden',
        flexWrap: 'nowrap',
        flex: 1
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            fontSize: '0.7rem',
            textAlign,
            fontWeight: 500,
            minWidth: 'fit-content'
          }}
        >
          Temp: {weather.temp}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            fontSize: '0.7rem',
            textAlign,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Condition: {weather.condition}
        </Typography>
        {weather.wind && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              fontSize: '0.7rem',
              textAlign,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            Wind: {weather.wind}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LiveWeatherDisplay;
