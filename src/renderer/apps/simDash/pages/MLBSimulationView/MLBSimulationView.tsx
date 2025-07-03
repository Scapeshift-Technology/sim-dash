import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { SimResultsMLB } from '@/types/bettingResults';
import { 
  teamNameToAbbreviationMLB, 
  transformSidesCountsMLB, 
  transformTotalsCountsMLB,
  transformPropsCountsMLB,
  transformSeriesProbsMLB
} from '@/simDash/utils/displayMLB';
import { Box, Typography, CircularProgress, Button, Snackbar } from '@mui/material';
import { ReducedMatchupLineups, SimMetadataMLB } from '@@/types/simHistory';
import { MLBGameSimInputs } from '@/types/simInputs';
import CollapsibleSection from '@/simDash/components/CollapsibleSection';
import SimInputs from './components/SimInputs';
import LineupSection from './components/LineupSection';
import { copyAllResults } from './utils/copier';

import ROIDemandInput from '@/simDash/components/ROIDemandInput';
import { selectROIDemandDecimal } from '@/simDash/store/slices/userPreferencesSlice';
import type { RootState } from '@/store/store';
import BettingTable, { 
  sidesColumns,
  totalsColumns,
  firstInningColumns,
  playerPropsColumns,
  seriesColumns,
  scoringOrderPropsColumns
} from '@/simDash/components/BettingTable';
import {
  formatSidesData,
  formatTotalsData,
  formatFirstInningData,
  formatPlayerPropsData,
  formatSeriesData,
  formatScoringOrderPropsData
} from '@/simDash/utils/tableFormatters';

// ---------- Main component ----------

const MLBSimulationView: React.FC = () => {
  // ---------- Redux State ----------
  const roiDemandDecimal = useSelector((state: RootState) => selectROIDemandDecimal(state));
  
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
    playerProps: true,
    scoringOrderProps: true
  });
  const [simTimestamp, setSimTimestamp] = useState<string | null>(null);
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null);
  const [daySequence, setDaySequence] = useState<number | null>(null);
  const [matchupId, setMatchupId] = useState<number | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const awayTeamAbbreviation = awayTeamName ? teamNameToAbbreviationMLB(awayTeamName) : '';
  const homeTeamAbbreviation = homeTeamName ? teamNameToAbbreviationMLB(homeTeamName) : '';

  // ---------- Effects ----------
  useEffect(() => {
    const fetchSimData = async () => {
      try {
        setLoading(true);
        const data = await window.electronAPI.getMLBSimData();
        console.log('Sim data received:', data);
        if (data) {
          setSimData(data.simData);
          setSimInputs(data.inputData.simInputs);
          setLineups(data.inputData.lineups);
          setGameInfo(data.inputData.gameInfo);
          setSimTimestamp(data.timestamp);
          setAwayTeamName(data.awayTeamName);
          setHomeTeamName(data.homeTeamName);
          setMatchupId(data.matchId);
          setDaySequence(data.daySequence ? data.daySequence : null);
        }
      } catch (error) {
        console.error('Error fetching sim data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimData();
  }, []);

  // ---------- Handlers ----------

  const handleCreateComparisonWindow = async () => {
    try {
      await window.electronAPI.createComparisonWindow({ 
        league: 'MLB',
        matchupId: matchupId as number,
        timestamp: simTimestamp as string,
        awayTeamName: awayTeamName as string, 
        homeTeamName: homeTeamName as string,
        daySequence: daySequence as number
      });
    } catch (error) {
      console.error('Failed to create simulation window:', error);
    }
  }

  const toggleSection = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCopyResults = () => {
    const results = copyAllResults(sidesData, totalsData, propsData, seriesData, simInputs, lineups, gameInfo, awayTeamName, homeTeamName, simTimestamp);
    navigator.clipboard.writeText(results).then(() => {
      setShowCopySuccess(true);
    }).catch(err => {
      console.error('Failed to copy results: ', err);
    });
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
  console.log('MLBSimulationView - Render with roiDemandDecimal:', roiDemandDecimal);
  const sidesData = transformSidesCountsMLB(simData.sides, awayTeamAbbreviation, homeTeamAbbreviation, roiDemandDecimal);
  const totalsData = transformTotalsCountsMLB(simData.totals, awayTeamAbbreviation, homeTeamAbbreviation, roiDemandDecimal);
  const propsData = transformPropsCountsMLB(simData.props, awayTeamAbbreviation, homeTeamAbbreviation, roiDemandDecimal);
  const seriesData = simData.series ? transformSeriesProbsMLB(simData.series, awayTeamAbbreviation, homeTeamAbbreviation, roiDemandDecimal) : [];

  // Format data for display
  const formattedSidesData = formatSidesData(sidesData);
  const formattedTotalsData = formatTotalsData(totalsData);
  const formattedFirstInningData = formatFirstInningData(propsData.firstInning);
  const formattedPlayerPropsData = formatPlayerPropsData(propsData.player);
  const formattedSeriesData = formatSeriesData(seriesData);
  const formattedScoringOrderData = propsData.scoringOrder ? formatScoringOrderPropsData(propsData.scoringOrder) : [];

  return (
    <div style={{ padding: '20px' }}>
      <Box sx={{ 
        pb: 2, 
        mb: 3, 
        borderBottom: 1, 
        borderColor: 'divider' 
      }}>
        <Typography variant="h5" component="h2"
          style={{ marginBottom: '0px', paddingBottom: '0px' }}
        >
          {awayTeamName} @ {homeTeamName}
        </Typography>
        {simTimestamp && (
          <h5 style={{ marginTop: '0px', paddingTop: '0px', marginBottom: '8px' }}>Simulated at {new Date(simTimestamp).toLocaleString()}</h5>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleCopyResults}
            disabled={!simData}
          >
            Copy All Results
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleCreateComparisonWindow}
            disabled={!simData}
          >
            Compare Simulations
          </Button>
          <ROIDemandInput />
        </Box>
      </Box>
      
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
          <BettingTable data={formattedSeriesData} columns={seriesColumns} />
        </CollapsibleSection>
      )}
      
      <CollapsibleSection
        title="Simulated Sides Results"
        isOpen={sectionVisibility.sides}
        onToggle={() => toggleSection('sides')}
      >
        <BettingTable data={formattedSidesData} columns={sidesColumns} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated Totals Results"
        isOpen={sectionVisibility.totals}
        onToggle={() => toggleSection('totals')}
      >
        <BettingTable data={formattedTotalsData} columns={totalsColumns} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated First Inning Scoring Props Results"
        isOpen={sectionVisibility.firstInningProps}
        onToggle={() => toggleSection('firstInningProps')}
      >
        <BettingTable data={formattedFirstInningData} columns={firstInningColumns} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Simulated Player Props Results"
        isOpen={sectionVisibility.playerProps}
        onToggle={() => toggleSection('playerProps')}
      >
        <BettingTable data={formattedPlayerPropsData} columns={playerPropsColumns} />
      </CollapsibleSection>

      {propsData.scoringOrder && (
        <CollapsibleSection
          title="Simulated Scoring Order Props Results"
          isOpen={sectionVisibility.scoringOrderProps}
          onToggle={() => toggleSection('scoringOrderProps')}
        >
          <BettingTable data={formattedScoringOrderData} columns={scoringOrderPropsColumns} />
        </CollapsibleSection>
      )}

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
        message="Results copied to clipboard"
      />
    </div>
  );
};

export default MLBSimulationView;
