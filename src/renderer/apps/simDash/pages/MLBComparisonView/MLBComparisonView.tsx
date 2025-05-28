import { useEffect, useState } from 'react';
import { SimHistoryEntry } from "@@/types/simHistory";
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SimDropdown from './components/SimDropdown';
import { 
  teamNameToAbbreviationMLB, 
  transformComparisonSidesCountsMLB, 
  transformComparisonTotalsCountsMLB, 
  transformComparisonFirstInningPropsCountsMLB,
  transformComparisonPlayerPropsCountsMLB,
  transformComparisonScoringOrderPropsCountsMLB
} from '@/simDash/utils/displayMLB';

import CollapsibleSection from '@/simDash/components/CollapsibleSection';
import ComparisonSidesTable from '@/simDash/components/comparison/ComparisonSidesTable';
import ComparisonTotalsTable from '@/simDash/components/comparison/ComparisonTotalsTable';
import ComparisonFirstInningPropsTable from '@/simDash/components/comparison/ComparisonFirstInningPropsTable';
import ComparisonPlayerPropsTable from '@/simDash/components/comparison/ComparisonPlayerPropsTable';
import ComparisonScoringOrderPropsTable from '@/simDash/components/comparison/ComparisonScoringOrderPropsTable';

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

    return (
      <>
        <CollapsibleSection title="Sides Difference" isOpen={sectionVisibility.sides} onToggle={() => {setSectionVisibility({...sectionVisibility, sides: !sectionVisibility.sides})}}>
          <ComparisonSidesTable data={sidesComparisonData} />
        </CollapsibleSection>
        <CollapsibleSection title="Totals Difference" isOpen={sectionVisibility.totals} onToggle={() => {setSectionVisibility({...sectionVisibility, totals: !sectionVisibility.totals})}}>
          <ComparisonTotalsTable data={totalsComparisonData} />
        </CollapsibleSection>
        <CollapsibleSection title="First Inning Props Difference" isOpen={sectionVisibility.firstInningProps} onToggle={() => {setSectionVisibility({...sectionVisibility, firstInningProps: !sectionVisibility.firstInningProps})}}>
          <ComparisonFirstInningPropsTable data={firstInningPropsComparisonData} />
        </CollapsibleSection>
        <CollapsibleSection title="Player Props Difference" isOpen={sectionVisibility.playerProps} onToggle={() => {setSectionVisibility({...sectionVisibility, playerProps: !sectionVisibility.playerProps})}}>
          <ComparisonPlayerPropsTable data={playerPropsComparisonData} />
        </CollapsibleSection>
        {scoringOrderPropsComparisonData.length > 0 && (
          <CollapsibleSection title="Scoring Order Props Difference" isOpen={sectionVisibility.scoringOrderProps} onToggle={() => {setSectionVisibility({...sectionVisibility, scoringOrderProps: !sectionVisibility.scoringOrderProps})}}>
            <ComparisonScoringOrderPropsTable data={scoringOrderPropsComparisonData} />
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
