import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import type { Player, Stats } from '@/types/mlb';

// ---------- Types ----------

interface PlayerStatsTooltipProps {
  player: Player;
}

interface StatsDisplayProps {
  title: string;
  stats: Stats;
  isOpponentLine?: boolean;
}

// ---------- Helper functions ----------

// Calculate triple slash line (AVG/OBP/SLG) from sim stats
const calculateTripleSlash = (stats: Stats) => {
  const hits = stats.adj_perc_1B + stats.adj_perc_2B + stats.adj_perc_3B + stats.adj_perc_HR;
  const atBats = 1 - stats.adj_perc_BB;
  const onBase = hits + stats.adj_perc_BB;
  const totalBases = stats.adj_perc_1B + stats.adj_perc_2B * 2 + stats.adj_perc_3B * 3 + stats.adj_perc_HR * 4;
  
  const avg = atBats > 0 ? hits / atBats : 0;
  const obp = onBase;
  const slg = atBats > 0 ? totalBases / atBats : 0;
  
  return {
    avg: Math.min(avg, 1), // Cap at 1.000
    obp: Math.min(obp, 1), // Cap at 1.000  
    slg: Math.min(slg, 4)  // Cap at 4.000 (theoretical max)
  };
};

// Format percentage for display
const formatPct = (value: number) => `${(value * 100).toFixed(1)}%`;

// Format triple slash values
const formatTripleSlash = (value: number) => value.toFixed(3);

// ---------- Sub-components ----------

const StatsDisplay: React.FC<StatsDisplayProps> = ({ title, stats, isOpponentLine = false }) => {
  const slash = calculateTripleSlash(stats);
  const slashLabel = isOpponentLine ? 'Opponent Line' : 'Triple Slash';
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        fontSize: '0.75rem'
      }}>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          K: {formatPct(stats.adj_perc_K)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          BB: {formatPct(stats.adj_perc_BB)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          1B: {formatPct(stats.adj_perc_1B)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          2B: {formatPct(stats.adj_perc_2B)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          3B: {formatPct(stats.adj_perc_3B)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          HR: {formatPct(stats.adj_perc_HR)}
        </Typography>
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          OUT: {formatPct(stats.adj_perc_OUT)}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.5, display: 'block' }}>
        {slashLabel}: {formatTripleSlash(slash.avg)}/{formatTripleSlash(slash.obp)}/{formatTripleSlash(slash.slg)}
      </Typography>
    </Box>
  );
};

// ---------- Main component ----------

const PlayerStatsTooltip: React.FC<PlayerStatsTooltipProps> = ({ player }) => {
  // Determine if player is a pitcher based on position
  const isPitcher = player.position === 'SP' || player.position === 'RP';
  
  // Check if player has any stats
  const hasStats = player.stats?.hitVsL || player.stats?.hitVsR || player.stats?.pitchVsL || player.stats?.pitchVsR;

  return (
    <Paper 
      elevation={8}
      sx={{ 
        p: 2,
        maxWidth: 350,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
        {player.name}
      </Typography>
      
      {hasStats ? (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
            {isPitcher ? 'Pitching Stats' : 'Hitting Stats'}
          </Typography>
          
          {isPitcher ? (
            // Pitcher Stats
            <>
              {player.stats?.pitchVsL && (
                <StatsDisplay 
                  title="vs LHB" 
                  stats={player.stats.pitchVsL} 
                  isOpponentLine={true}
                />
              )}
              {player.stats?.pitchVsR && (
                <StatsDisplay 
                  title="vs RHB" 
                  stats={player.stats.pitchVsR} 
                  isOpponentLine={true}
                />
              )}
            </>
          ) : (
            // Hitter Stats
            <>
              {player.stats?.hitVsL && (
                <StatsDisplay 
                  title="vs LHP" 
                  stats={player.stats.hitVsL} 
                />
              )}
              {player.stats?.hitVsR && (
                <StatsDisplay 
                  title="vs RHP" 
                  stats={player.stats.hitVsR} 
                />
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No stats available
        </Typography>
      )}
    </Paper>
  );
};

export default PlayerStatsTooltip; 