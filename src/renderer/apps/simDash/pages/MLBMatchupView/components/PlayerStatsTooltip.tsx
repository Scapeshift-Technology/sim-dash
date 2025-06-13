import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip
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

  // ---------- State ----------

  const slash = calculateTripleSlash(stats);
  const slashLabel = isOpponentLine ? 'Opponent Line' : 'Triple Slash';

  // ---------- Render ----------
  
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

  // ---------- State ----------

  const backupRoles = player.alternateRoleStats ? Object.keys(player.alternateRoleStats) : [];
  const [selectedRole, setSelectedRole] = useState<string>(player.position || '');
  const selectedIsPitcher = selectedRole === 'SP' || selectedRole === 'RP';

  // ---------- Handlers ----------

  const handlePositionClick = (position: string) => {
    setSelectedRole(position);
  };

  // ---------- Helper functions ----------
  
  const getSelectedStats = () => { // Get stats for the selected role
    if (selectedRole === player.position) {
      return player.stats; // Current role stats
    }
    return player.alternateRoleStats?.[selectedRole]; // Backup role stats
  };

  // ---------- Render ----------

  const selectedStats = getSelectedStats();

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
      {/* Header with name and positions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {player.name}
        </Typography>
        
        {/* Position chips in top right */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
          {/* Current position */}
          {player.position && (
            <Chip
              label={player.position}
              size="small"
              variant={selectedRole === player.position ? "filled" : "outlined"}
              color={selectedRole === player.position ? "primary" : "default"}
              onClick={() => handlePositionClick(player.position!)}
              sx={{ 
                height: 20,
                fontSize: '0.75rem',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: selectedRole === player.position ? 'primary.dark' : 'action.hover'
                }
              }}
            />
          )}
          
          {/* Backup roles */}
          {backupRoles.map((role) => (
            <Chip
              key={role}
              label={role}
              size="small"
              variant={selectedRole === role ? "filled" : "outlined"}
              color={selectedRole === role ? "secondary" : "default"}
              onClick={() => handlePositionClick(role)}
              sx={{ 
                height: 20,
                fontSize: '0.75rem',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: selectedRole === role ? 'secondary.dark' : 'action.hover'
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {selectedStats && (selectedStats.hitVsL || selectedStats.hitVsR || selectedStats.pitchVsL || selectedStats.pitchVsR) ? (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
            {selectedIsPitcher ? `Pitching Stats (${selectedRole})` : `Hitting Stats (${selectedRole})`}
          </Typography>
          
          {selectedIsPitcher ? (
            // Pitcher Stats for selected role
            <>
              {selectedStats?.pitchVsL && (
                <StatsDisplay 
                  title="vs LHB" 
                  stats={selectedStats.pitchVsL} 
                  isOpponentLine={true}
                />
              )}
              {selectedStats?.pitchVsR && (
                <StatsDisplay 
                  title="vs RHB" 
                  stats={selectedStats.pitchVsR} 
                  isOpponentLine={true}
                />
              )}
            </>
          ) : (
            // Hitter Stats
            <>
              {selectedStats?.hitVsL && (
                <StatsDisplay 
                  title="vs LHP" 
                  stats={selectedStats.hitVsL} 
                />
              )}
              {selectedStats?.hitVsR && (
                <StatsDisplay 
                  title="vs RHP" 
                  stats={selectedStats.hitVsR} 
                />
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No stats available for {selectedRole}
        </Typography>
      )}
    </Paper>
  );
};

export default PlayerStatsTooltip; 