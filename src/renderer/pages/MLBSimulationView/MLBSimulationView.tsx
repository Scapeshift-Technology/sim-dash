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
import { Box, Typography, CircularProgress, Divider, List, ListItem, ListItemText, Tooltip } from '@mui/material';
import TotalsTable from '@/components/TotalsTable';
import FirstInningTable from '@/components/FirstInningTable';
import PlayerPropsTable from '@/components/PlayerPropsTable';
import SeriesTable from '@/components/SeriesTable';
import { ReducedMatchupLineups, SimMetadataMLB } from '@@/types/simHistory';
import { MLBGameSimInputs } from '@/types/simInputs';
import CollapsibleSection from './components/CollapsibleSection';
import SimInputs from './components/SimInputs';
import LineupSection from './components/LineupSection';

// ---------- Main component ----------

const MLBSimulationView: React.FC = () => {
  // ---------- State ----------
  const [simData, setSimData] = useState<SimResultsMLB | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineups, setLineups] = useState<ReducedMatchupLineups | null>(null);
  const [simInputs, setSimInputs] = useState<MLBGameSimInputs | null>(null);
  const [gameInfo, setGameInfo] = useState<SimMetadataMLB | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState({
    lineups: false,
    inputs: false,
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
          setSimInputs(data.inputData.simInputs);
          setLineups(data.inputData.lineups);
          setGameInfo(data.inputData.gameInfo);
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
        title="Team Lineups"
        isOpen={sectionVisibility.lineups}
        onToggle={() => toggleSection('lineups')}
      >
        <LineupSection 
          lineups={lineups}
          awayTeamName={awayTeamName}
          homeTeamName={homeTeamName}
          lineupsSource={gameInfo?.lineupsSource}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulation Inputs"
        isOpen={sectionVisibility.inputs}
        onToggle={() => toggleSection('inputs')}
      >
        <SimInputs 
          simInputs={simInputs}
          gameInfo={gameInfo}
          awayTeamName={awayTeamName}
          homeTeamName={homeTeamName}
        />
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
