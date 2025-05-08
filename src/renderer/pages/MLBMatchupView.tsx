import React, { useState, useEffect } from 'react';
import {
    Box, 
    Typography, 
    CircularProgress, 
    Alert, 
    Grid, 
    Paper, 
    List, 
    ListItem, 
    ListItemText,
    ListSubheader,
    Divider,
    Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { MatchupLineups, TeamLineup, Player } from '@/types/mlb';
import type { SimResultsMLB } from '@/types/bettingResults';
import MLBSimulationResultsSummary from '@/components/simulation/MLBSimulationResultsSummary';
import { SimHistoryEntry } from '@/types/simHistory';

function renderPlayerEntry(player: Player) {
  return (
    <ListItemText primary={`${player.battingOrder ? player.battingOrder + '. ' : ''}${player.name} | Pos: ${player.position ?? 'N/A'}`} />
  )
  {/* TODO: Display relevant player stats */}
}

interface MLBMatchupViewProps {
    matchId: number;
    league: string;
    date: string;
    participant1: string; // Away Team
    participant2: string; // Home Team
    daySequence?: number;
}

const MLBMatchupView: React.FC<MLBMatchupViewProps> = ({
    matchId,
    league,
    date,
    participant1,
    participant2,
    daySequence 
}) => {
    // ---------- State ----------
    const [lineupData, setLineupData] = useState<MatchupLineups | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [simulationResults, setSimulationResults] = useState<SimResultsMLB | null>(null);
    const [simHistory, setSimHistory] = useState<SimHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    // ---------- Effect ----------
    useEffect(() => { // Fetch lineup data
        const fetchLineup = async () => {
            setLoading(true);
            setError(null);
            setLineupData(null);
            try {
                const data = await window.electronAPI.fetchMlbLineup({
                    league,
                    date,
                    participant1,
                    participant2,
                    daySequence
                });
                setLineupData(data);
            } catch (err: any) {
                console.error('Error fetching MLB lineup:', err);
                setError(err.message || 'Failed to fetch lineup data');
            } finally {
                setLoading(false);
            }
        };

        fetchLineup();
    }, [league, date, participant1, participant2, daySequence]); // Refetch if props change

    useEffect(() => { // Fetch sim history
        const fetchSimHistory = async () => {
            if (!matchId) return;
            console.log('Fetching sim history for matchId:', matchId);
            
            setIsLoadingHistory(true);
            try {
                const history = await window.electronAPI.getSimHistory(matchId);
                setSimHistory(history);
            } catch (error) {
                console.error('Failed to fetch sim history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchSimHistory();
    }, [matchId]);

    // ---------- Handlers ----------
    const handleRunSimulation = async () => {
        // Get timestamp for later 
        const timestamp = new Date().toISOString();

        // Run simulation
        const simResults: SimResultsMLB = await window.electronAPI.simulateMatchupMLB({
          numGames: 50000
        });
        setSimulationResults(simResults);

        // Save sim history
        const simHistoryEntry: SimHistoryEntry = {
          matchId: matchId,
          timestamp: timestamp,
          simResults: simResults,
          inputData: { testField: 'test' }
        };
        const saveSuccess = await window.electronAPI.saveSimHistory(simHistoryEntry);
        if (!saveSuccess) {
            console.error('Error saving sim history');
        }

        // Add new sim history entry to top of list
        const updatedHistory = [simHistoryEntry, ...simHistory];
        setSimHistory(updatedHistory);
    };

    // ---------- Render functions ----------
    const renderTeamLineup = (teamName: string, teamData: TeamLineup | undefined) => {
        if (!teamData) return <Typography>Lineup data unavailable.</Typography>;

        const renderPlayerList = (players: Player[], subheader: string) => (
          <List 
            dense 
            subheader={
              <ListSubheader sx={{ lineHeight: '30px', pb: 0 }}>
                {subheader}
              </ListSubheader>
            }
            sx={{ pt: 0 }}
          >
                {players.map((player) => (
                    <ListItem key={player.id} sx={{ py: 0 }}>
                        {renderPlayerEntry(player)}
                    </ListItem>
                ))}
            </List>
        );

        return (
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>{teamName}</Typography>
            <Divider sx={{ mb: 1 }}/>
            
            {renderPlayerList([teamData.startingPitcher], 'Starting Pitcher')}
            {renderPlayerList(teamData.lineup, 'Batting Order')}
            {renderPlayerList(teamData.bullpen, 'Bullpen')}
            {/* Add Bench here later */}
          </Paper>
        );
    };

    // ---------- Render ----------
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!lineupData) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                {participant1} @ {participant2}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
                {date}
            </Typography>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                gap: 2, 
                mb: 3,
                alignItems: 'stretch'
            }}>
                <Box sx={{ 
                    flex: '0 0 200px',  // grow shrink basis
                    maxWidth: '200px'
                }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleRunSimulation}
                        sx={{ 
                            height: '100%', 
                            width: '100%',
                            py: '8px',
                            px: '16px'
                        }}
                    >
                        Run Simulation
                    </Button>
                </Box>
                <Box sx={{ 
                    flex: '0 0 200px',
                    maxWidth: '200px'
                }}>
                    <MLBSimulationResultsSummary
                        awayTeamName={participant1}
                        homeTeamName={participant2}
                        displayHistory={true}
                        simHistory={simHistory}
                        isLoading={isLoadingHistory}
                    />
                </Box>
            </Box>
            <Grid container spacing={2}>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    {renderTeamLineup(`${participant1} (Away)`, lineupData.away)}
                </Box>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    {renderTeamLineup(`${participant2} (Home)`, lineupData.home)}
                </Box>
            </Grid>
        </Box>
    );
};

export default MLBMatchupView; 