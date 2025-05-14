import React, { useEffect, useState } from 'react';
import type { SimResultsMLB } from '@/types/bettingResults';
import { 
  teamNameToAbbreviationMLB, 
  transformSidesCountsMLB, 
  transformTotalsCountsMLB,
  transformPropsCountsMLB
} from '@/utils/displayMLB';
import SidesTable from '@/components/SidesTable';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import TotalsTable from '@/components/TotalsTable';
import FirstInningTable from '@/components/FirstInningTable';
import PlayerPropsTable from '@/components/PlayerPropsTable';

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

const MLBSimulationView: React.FC = () => {
  // ---------- State ----------
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionVisibility, setSectionVisibility] = useState({
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

  // Data for betting tables
  const sidesData = transformSidesCountsMLB(simData.sides, awayTeamAbbreviation, homeTeamAbbreviation);
  const totalsData = transformTotalsCountsMLB(simData.totals, awayTeamAbbreviation, homeTeamAbbreviation);
  const propsData = transformPropsCountsMLB(simData.props, awayTeamAbbreviation, homeTeamAbbreviation);

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '0px', paddingBottom: '0px' }}>{awayTeamName} @ {homeTeamName}</h3>
      {timestamp && (
        <h6 style={{ marginTop: '0px', paddingTop: '0px' }}>Simulated at {new Date(timestamp).toLocaleString()}</h6>
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
