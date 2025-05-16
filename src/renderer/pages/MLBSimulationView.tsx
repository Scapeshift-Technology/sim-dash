import React, { useEffect, useState } from 'react';
import type { SimResultsMLB } from '@/types/bettingResults';
import { 
  teamNameToAbbreviationMLB, 
  transformSidesCountsMLB, 
  transformTotalsCountsMLB,
  transformPropsCountsMLB,
  transformSeriesProbsMLB
} from '@/utils/displayMLB';
import SidesTable from '@/components/SidesTable';
import { Box, Typography, IconButton, CircularProgress, Divider } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import TotalsTable from '@/components/TotalsTable';
import FirstInningTable from '@/components/FirstInningTable';
import PlayerPropsTable from '@/components/PlayerPropsTable';
import SeriesTable from '@/components/SeriesTable';
import { MLBGameSimInputs } from '@@/types/simInputs';

// ---------- Collapsible Section ----------

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => (
  <Box sx={{ mb: 3 }}>
    <Box 
      onClick={onToggle}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        cursor: 'pointer',
        '&:hover': { opacity: 0.8 }
      }}
    >
      <Typography variant="h5" component="h2">{title}</Typography>
      <IconButton size="small">
        {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      </IconButton>
    </Box>
    {isOpen && (
      <Box sx={{ mt: 3 }}>
        {children}
      </Box>
    )}
  </Box>
);

// ---------- MLB Simulation View ----------

const MLBSimulationView: React.FC = () => {
  // ---------- State ----------
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputData, setInputData] = useState<MLBGameSimInputs | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState({
    inputs: true,
    series: true,
    sides: true,
    totals: true,
    firstInningProps: true,
    playerProps: true
  });
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null);
  const awayTeamAbbreviation = awayTeamName ? teamNameToAbbreviationMLB(awayTeamName) : '';
  const homeTeamAbbreviation = homeTeamName ? teamNameToAbbreviationMLB(homeTeamName) : '';

  // ---------- Effects ----------
  useEffect(() => {
    const fetchSimData = async () => {
      try {
        setLoading(true);
        const data = await window.electronAPI.getSimData();
        console.log('Sim data received:', data);
        if (data) {
          setSimData(data.simData);
          setInputData(data.inputData);
          setTimestamp(data.timestamp);
          setAwayTeamName(data.awayTeamName);
          setHomeTeamName(data.homeTeamName);
        }
      } catch (error) {
        console.error('Error fetching sim data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimData();
  }, []);

  const toggleSection = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading simulation data...
        </Typography>
      </Box>
    );
  }

  if (!simData) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        flexDirection="column"
        gap={2}
      >
        <Typography variant="h6" color="text.secondary">
          No simulation data available
        </Typography>
      </Box>
    );
  }

  const renderTeamLeans = (teamType: 'away' | 'home', teamName: string | null) => {
    if (!inputData) return null;
    const teamData = inputData[teamType];
    function formatLean(lean: number) {
      return lean.toFixed(2);
    }
    
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{teamName}</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography>
            Team Hitting Lean: {formatLean(teamData.teamHitterLean)}%
          </Typography>
          <Typography>
            Team Pitching Lean: {formatLean(teamData.teamPitcherLean)}%
          </Typography>
          
          {Object.keys(teamData.individualHitterLeans).length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">Individual Hitter Leans:</Typography>
              {Object.entries(teamData.individualHitterLeans).map(([playerId, lean]) => (
                <Typography key={playerId} sx={{ pl: 2 }}>
                  Player {playerId}: {formatLean(lean)}%
                </Typography>
              ))}
            </Box>
          )}
          
          {Object.keys(teamData.individualPitcherLeans).length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">Individual Pitcher Leans:</Typography>
              {Object.entries(teamData.individualPitcherLeans).map(([playerId, lean]) => (
                <Typography key={playerId} sx={{ pl: 2 }}>
                  Player {playerId}: {formatLean(lean)}%
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Data for betting tables
  const sidesData = transformSidesCountsMLB(simData.sides, awayTeamAbbreviation, homeTeamAbbreviation);
  const totalsData = transformTotalsCountsMLB(simData.totals, awayTeamAbbreviation, homeTeamAbbreviation);
  const propsData = transformPropsCountsMLB(simData.props, awayTeamAbbreviation, homeTeamAbbreviation);
  const seriesData = simData.series ? transformSeriesProbsMLB(simData.series, awayTeamAbbreviation, homeTeamAbbreviation) : [];

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h5" component="h2"
        style={{ marginBottom: '0px', paddingBottom: '0px' }}
      >
        {awayTeamName} @ {homeTeamName}
      </Typography>
      {timestamp && (
        <h5 style={{ marginTop: '0px', paddingTop: '0px' }}>Simulated at {new Date(timestamp).toLocaleString()}</h5>
      )}
      
      <CollapsibleSection
        title="Simulation Inputs"
        isOpen={sectionVisibility.inputs}
        onToggle={() => toggleSection('inputs')}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          border: 1,
          borderColor: 'divider'
        }}>
          {renderTeamLeans('away', awayTeamName)}
          <Divider sx={{ my: 2 }} />
          {renderTeamLeans('home', homeTeamName)}
        </Box>
      </CollapsibleSection>

      {simData.series && (
        <CollapsibleSection
          title="Series Win Probabilities"
          isOpen={sectionVisibility.series}
          onToggle={() => toggleSection('series')}
        >
          <SeriesTable data={seriesData} />
        </CollapsibleSection>
      )}
      
      <CollapsibleSection
        title="Simulated Sides Results"
        isOpen={sectionVisibility.sides}
        onToggle={() => toggleSection('sides')}
      >
        <SidesTable data={sidesData} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated Totals Results"
        isOpen={sectionVisibility.totals}
        onToggle={() => toggleSection('totals')}
      >
        <TotalsTable data={totalsData} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated First Inning Scoring Props Results"
        isOpen={sectionVisibility.firstInningProps}
        onToggle={() => toggleSection('firstInningProps')}
      >
        <FirstInningTable data={propsData.firstInning} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated Player Props Results"
        isOpen={sectionVisibility.playerProps}
        onToggle={() => toggleSection('playerProps')}
      >
        <PlayerPropsTable data={propsData.player} />
      </CollapsibleSection>
    </div>
  );
};

export default MLBSimulationView;
