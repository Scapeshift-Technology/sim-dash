import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { teamNameToAbbreviationMLB } from '@/simDash/utils/displayMLB';
import {
  transformComparisonSidesCountsMLB,
  transformComparisonTotalsCountsMLB,
  transformComparisonFirstInningPropsCountsMLB,
  transformComparisonPlayerPropsCountsMLB,
  transformComparisonScoringOrderPropsCountsMLB
} from '@/simDash/utils/displayMLB';

// NEW: Import unified BettingTable with comparison column configs
import BettingTable, {
  getComparisonSidesColumns,
  getComparisonTotalsColumns,
  getComparisonPlayerPropsColumns,
  getComparisonFirstInningPropsColumns,
  getComparisonScoringOrderPropsColumns
} from '@/simDash/components/BettingTable';

// Import comparison data formatters
import {
  formatComparisonSidesData,
  formatComparisonTotalsData,
  formatComparisonPlayerPropsData,
  formatComparisonFirstInningPropsData,
  formatComparisonScoringOrderPropsData
} from '@/simDash/utils/tableFormatters';

import { COLOR_MAX_VALUES } from '@/simDash/utils/comparisonTableColors';
import CollapsibleSection from '@/simDash/components/CollapsibleSection';
import SimDropdown from './components/SimDropdown';
import { SimHistoryEntry } from '@@/types/simHistory';

// ---------- Helper function ----------
const getUrlParams = () => {
  const hash = window.location.hash;
  const queryString = hash.split('?')[1];
  if (!queryString) return new URLSearchParams();
  return new URLSearchParams(queryString);
};

// ---------- Main component ----------

const MLBComparisonView: React.FC = () => {

  // ---------- State ----------

  const [simHistory, setSimHistory] = useState<SimHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchupData, setMatchupData] = useState<{
    matchupId: number;
    awayTeamName: string;
    homeTeamName: string;
    timestamp: string;
    daySequence?: number;
  } | null>(null);
  const [selectedSim1, setSelectedSim1] = useState<SimHistoryEntry | null>(null);
  const [selectedSim2, setSelectedSim2] = useState<SimHistoryEntry | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState({
    sides: true,
    totals: true,
    firstInningProps: true,
    playerProps: true,
    scoringOrderProps: true
  });

  // ---------- Helper function ----------

  const renderComparison = () => {
    if (!selectedSim1 || !selectedSim2) {
      return <Typography variant="body1" color="text.secondary">Please select two simulations to compare</Typography>;
    }

    // If we have sims to compare:
    const awayTeamAbbrev = teamNameToAbbreviationMLB(matchupData?.awayTeamName || '');
    const homeTeamAbbrev = teamNameToAbbreviationMLB(matchupData?.homeTeamName || '');

    const sidesComparisonData = transformComparisonSidesCountsMLB(selectedSim1.simResults.sides, selectedSim2.simResults.sides, awayTeamAbbrev, homeTeamAbbrev);
    const totalsComparisonData = transformComparisonTotalsCountsMLB(selectedSim1.simResults.totals, selectedSim2.simResults.totals, awayTeamAbbrev, homeTeamAbbrev);
    const firstInningPropsComparisonData = transformComparisonFirstInningPropsCountsMLB(selectedSim1.simResults.props.firstInning, selectedSim2.simResults.props.firstInning, awayTeamAbbrev, homeTeamAbbrev);
    const playerPropsComparisonData = transformComparisonPlayerPropsCountsMLB(selectedSim1.simResults.props.player, selectedSim2.simResults.props.player, awayTeamAbbrev, homeTeamAbbrev);
    const scoringOrderPropsComparisonData = transformComparisonScoringOrderPropsCountsMLB(selectedSim1.simResults.props.scoringOrder, selectedSim2.simResults.props.scoringOrder, awayTeamAbbrev, homeTeamAbbrev);

    // Format comparison data
    const formattedSidesComparison = formatComparisonSidesData(sidesComparisonData);
    const formattedTotalsComparison = formatComparisonTotalsData(totalsComparisonData);
    const formattedFirstInningComparison = formatComparisonFirstInningPropsData(firstInningPropsComparisonData);
    const formattedPlayerPropsComparison = formatComparisonPlayerPropsData(playerPropsComparisonData);
    const formattedScoringOrderComparison = formatComparisonScoringOrderPropsData(scoringOrderPropsComparisonData);

    return (
      <>
        <CollapsibleSection title="Sides Difference" isOpen={sectionVisibility.sides} onToggle={() => {setSectionVisibility({...sectionVisibility, sides: !sectionVisibility.sides})}}>
          <BettingTable 
            data={formattedSidesComparison} 
            columns={getComparisonSidesColumns(sidesComparisonData)}
            comparison={true}
                      comparisonConfig={{
            colorFields: ['coverPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { coverPercent: COLOR_MAX_VALUES.percent }
          }}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Totals Difference" isOpen={sectionVisibility.totals} onToggle={() => {setSectionVisibility({...sectionVisibility, totals: !sectionVisibility.totals})}}>
          <BettingTable 
            data={formattedTotalsComparison} 
            columns={getComparisonTotalsColumns(totalsComparisonData)}
            comparison={true}
                      comparisonConfig={{
            colorFields: ['overPercent', 'underPercent', 'pushPercent'],
            matchKeys: ['team', 'period', 'line'],
            maxValues: { 
              overPercent: COLOR_MAX_VALUES.percent,
              underPercent: COLOR_MAX_VALUES.percent,
              pushPercent: COLOR_MAX_VALUES.percent
            }
          }}
          />
        </CollapsibleSection>
        <CollapsibleSection title="First Inning Props Difference" isOpen={sectionVisibility.firstInningProps} onToggle={() => {setSectionVisibility({...sectionVisibility, firstInningProps: !sectionVisibility.firstInningProps})}}>
          <BettingTable 
            data={formattedFirstInningComparison} 
            columns={getComparisonFirstInningPropsColumns(firstInningPropsComparisonData)}
            comparison={true}
                      comparisonConfig={{
            colorFields: ['scorePercent'],
            matchKeys: ['team'],
            maxValues: { scorePercent: COLOR_MAX_VALUES.percent }
          }}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Player Props Difference" isOpen={sectionVisibility.playerProps} onToggle={() => {setSectionVisibility({...sectionVisibility, playerProps: !sectionVisibility.playerProps})}}>
          <BettingTable 
            data={formattedPlayerPropsComparison} 
            columns={getComparisonPlayerPropsColumns(playerPropsComparisonData)}
            comparison={true}
                      comparisonConfig={{
            colorFields: ['overPercent'],
            matchKeys: ['playerName', 'teamName', 'statName', 'line'],
            maxValues: { overPercent: COLOR_MAX_VALUES.percent }
          }}
          />
        </CollapsibleSection>
        {scoringOrderPropsComparisonData.length > 0 && (
          <CollapsibleSection title="Scoring Order Props Difference" isOpen={sectionVisibility.scoringOrderProps} onToggle={() => {setSectionVisibility({...sectionVisibility, scoringOrderProps: !sectionVisibility.scoringOrderProps})}}>
            <BettingTable 
              data={formattedScoringOrderComparison} 
              columns={getComparisonScoringOrderPropsColumns(scoringOrderPropsComparisonData)}
              comparison={true}
              comparisonConfig={{
                colorFields: ['percent'],
                matchKeys: ['team', 'propType'],
                maxValues: { percent: COLOR_MAX_VALUES.percent }
              }}
            />
          </CollapsibleSection>
        )}
      </>
    );
  };

  // ---------- Effect ----------
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get data from URL parameters
        const urlParams = getUrlParams();
        const matchupId = urlParams.get('matchupId');
        const awayTeamName = urlParams.get('awayTeamName');
        const homeTeamName = urlParams.get('homeTeamName');
        const timestamp = urlParams.get('timestamp');
        const daySequence = urlParams.get('daySequence');

        if (!matchupId || !awayTeamName || !homeTeamName || !timestamp) {
          throw new Error('Missing required parameters in URL');
        }

        const matchupInfo = {
          matchupId: parseInt(matchupId),
          awayTeamName,
          homeTeamName,
          timestamp,
          ...(daySequence && { daySequence: parseInt(daySequence) })
        };

        setMatchupData(matchupInfo);

        // Fetch sim history using the matchId
        const response: SimHistoryEntry[] = await window.electronAPI.getSimHistory(matchupInfo.matchupId);
        setSimHistory(response);
      } catch (err) {
        console.error('Error fetching sim history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sim history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          Loading simulation history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        flexDirection="column"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Box sx={{ minWidth: '400px' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          MLB Simulation Comparison
        </Typography>
        {matchupData && (
          <Typography variant="h6" component="h3" gutterBottom>
            {matchupData.awayTeamName} @ {matchupData.homeTeamName}
            {matchupData.daySequence && ` (Game ${matchupData.daySequence})`}
          </Typography>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 3, mt: 3, mb: 3 }}>
        <SimDropdown
          simHistory={simHistory}
          selectedSim={selectedSim1}
          onSelectionChange={setSelectedSim1}
          label="Simulation 1"
          awayTeamName={matchupData?.awayTeamName || ''}
          homeTeamName={matchupData?.homeTeamName || ''}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
          <ArrowForwardIcon sx={{ fontSize: '2rem' }} />
        </Box>
        <SimDropdown
          simHistory={simHistory}
          selectedSim={selectedSim2}
          onSelectionChange={setSelectedSim2}
          label="Simulation 2"
          awayTeamName={matchupData?.awayTeamName || ''}
          homeTeamName={matchupData?.homeTeamName || ''}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />
      
      {renderComparison()}
    </div>
  );
};

export default MLBComparisonView;
