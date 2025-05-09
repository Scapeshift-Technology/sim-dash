import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, 
    Typography, 
    CircularProgress, 
    Alert, 
    Grid, 
    Button,
    IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { MatchupLineups, TeamLineup, Player } from '@/types/mlb';
import type { SimResultsMLB } from '@/types/bettingResults';
import MLBSimulationResultsSummary from '@/components/simulation/MLBSimulationResultsSummary';
import DraggableLineup from '@/components/DraggableLineup';
import { SimHistoryEntry } from '@/types/simHistory';
import { RootState, AppDispatch } from '@/store/store';
import { fetchSimResults, selectMatchSimResults, selectMatchSimStatus } from '@/store/slices/scheduleSlice';
import { 
    fetchMlbLineup, 
    fetchMlbGamePlayerStats,
    selectGameLineupsData, 
    selectGameLineupsStatus, 
    selectGameLineupsError,
    selectGamePlayerStatsStatus,
    selectGamePlayerStatsError,
    clearGameData,
    reorderLineup
} from '@/store/slices/simInputsSlice';

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
    const dispatch = useDispatch<AppDispatch>();
    
    // ---------- State ----------
    const simResults = useSelector((state: RootState) => selectMatchSimResults(state, league, matchId));
    const simStatus = useSelector((state: RootState) => selectMatchSimStatus(state, league, matchId));
    const lineupData = useSelector((state: RootState) => selectGameLineupsData(state, matchId));
    const lineupStatus = useSelector((state: RootState) => selectGameLineupsStatus(state, matchId));
    const lineupError = useSelector((state: RootState) => selectGameLineupsError(state, matchId));
    const playerStatsStatus = useSelector((state: RootState) => selectGamePlayerStatsStatus(state, matchId));
    const playerStatsError = useSelector((state: RootState) => selectGamePlayerStatsError(state, matchId));

    // ---------- Effect ----------
    useEffect(() => { // Fetch lineup data
        if (lineupStatus === 'idle') {
            dispatch(fetchMlbLineup({
                league,
                date,
                participant1,
                participant2,
                daySequence,
                matchId
            }));
        }
    }, [dispatch, league, date, participant1, participant2, daySequence, matchId]);

    useEffect(() => { // Fetch player stats
        if (lineupStatus === 'succeeded' && playerStatsStatus === 'idle' && lineupData) {
            dispatch(fetchMlbGamePlayerStats({
                matchupLineups: (lineupData),
                matchId: matchId
            }));
        }
    }, [dispatch, lineupStatus, playerStatsStatus, lineupData, matchId]);

    useEffect(() => { // Fetch sim history
        if (!matchId) return;
        if (simStatus === 'idle') {
            dispatch(fetchSimResults({ league, matchId }));
        }
    }, [dispatch, matchId, league, simStatus]);

    // ---------- Handlers ----------
    const handleRunSimulation = async () => {
        // Get timestamp for later 
        const timestamp = new Date().toISOString();

        // Run simulation
        const simResults: SimResultsMLB = await window.electronAPI.simulateMatchupMLB({
            // TO ADD:
            // League avg stats
            // Player stats
            numGames: 50000
        });

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

        // Fetch updated sim history
        dispatch(fetchSimResults({ league, matchId }));
    };

    const handleRefresh = () => {
        // Clear the game data
        dispatch(clearGameData(matchId));
        
        // Fetch new lineup data(this will trigger the useEffect to fetch player stats)
        dispatch(fetchMlbLineup({
            league,
            date,
            participant1,
            participant2,
            daySequence,
            matchId
        }));
    };

    const handleLineupReorder = (team: 'home' | 'away', newOrder: Player[]) => {
        dispatch(reorderLineup({ matchId, team, newOrder }));
    };

    // ---------- Render ----------
    if (lineupStatus === 'loading') return <CircularProgress />;
    if (lineupError) return <Alert severity="error">{lineupError}</Alert>;
    if (!lineupData) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                    {participant1} @ {participant2}
                </Typography>
                <IconButton 
                    onClick={handleRefresh}
                    size="small"
                    sx={{ ml: 2 }}
                    disabled={!lineupData}
                >
                    <RefreshIcon />
                </IconButton>
            </Box>
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
                        simHistory={simResults || []}
                        isLoading={simStatus === 'loading'}
                    />
                </Box>
            </Box>
            <Grid container spacing={2}>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    <DraggableLineup
                        teamName={`${participant1} (Away)`}
                        teamData={lineupData.away}
                        team="away"
                        onLineupReorder={handleLineupReorder}
                    />
                </Box>
                <Box sx={{ width: { xs: '12', md: '6' }, p: 1 }}>
                    <DraggableLineup
                        teamName={`${participant2} (Home)`}
                        teamData={lineupData.home}
                        team="home"
                        onLineupReorder={handleLineupReorder}
                    />
                </Box>
            </Grid>
        </Box>
    );
};

export default MLBMatchupView; 