import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SimResultsMLB } from '@/types/bettingResults';
import { 
  teamNameToAbbreviationMLB, 
  transformSidesCountsMLB, 
  transformTotalsCountsMLB,
  transformFirstInningCountsMLB,
  transformPropsCountsMLB
} from '@/utils/displayMLB';
import SidesTable from '@/components/SidesTable';
import { Box, Typography, IconButton } from '@mui/material';
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
  const [sectionVisibility, setSectionVisibility] = useState({
    sides: true,
    totals: true,
    firstInningProps: true,
    playerProps: true
  });
  const location = useLocation();
  const windowId = new URLSearchParams(location.search).get('windowId');
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null);
  const awayTeamAbbreviation = awayTeamName ? teamNameToAbbreviationMLB(awayTeamName) : '';
  const homeTeamAbbreviation = homeTeamName ? teamNameToAbbreviationMLB(homeTeamName) : '';

  // ---------- Effects ----------
  useEffect(() => {
    const fetchSimData = async () => {
      if (!windowId) {
        console.error('No windowId provided');
        return;
      }
      
      try {
        const data = await window.electronAPI.getSimData({ windowId });
        setSimData(data.simData);
        setAwayTeamName(data.awayTeamName);
        setHomeTeamName(data.homeTeamName);
      } catch (error) {
        console.error('Error fetching sim data:', error);
      }
    };

    fetchSimData();
  }, [windowId, location]);

  const toggleSection = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!simData) {
    return <div>No simulation data provided</div>;
  }

  // Data for betting tables
  const sidesData = transformSidesCountsMLB(simData.sides, awayTeamAbbreviation, homeTeamAbbreviation);
  const totalsData = transformTotalsCountsMLB(simData.totals, awayTeamAbbreviation, homeTeamAbbreviation);
  const propsData = transformPropsCountsMLB(simData.props, awayTeamAbbreviation, homeTeamAbbreviation);
  console.log('simData.props', simData.props);
  console.log('propsData', propsData);

  return (
    <div style={{ padding: '20px' }}>
      <h3>{awayTeamName} @ {homeTeamName}</h3>
      
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
