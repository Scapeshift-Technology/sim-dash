import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, 
    CircularProgress, 
    Alert, 
    Grid,
    Snackbar
} from '@mui/material';
import type { Player, Position } from '@/types/mlb';
import type { SimResultsMLB } from '@/types/bettingResults';
import DraggableLineup from './components/DraggableLineup';
import MLBMatchupHeader from './components/MLBMatchupHeader';
import BettingBoundsSection from './components/BettingBoundsSection';
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
    reorderMLBLineup,
    updateMLBPlayerPosition,
    updateTeamLean,
    updatePlayerLean,
    selectTeamInputs,
    selectGameLineups
} from '@/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';
import { applyMatchupLeansMLB } from './functions/leans';
import { useLeanValidation } from './hooks/leanValidation';

// ---------- Sub-components ----------

const TeamCard: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <Box sx={{ 
        width: { xs: '100%', md: 'calc(50% - 8px)' }, 
        minWidth: { md: '400px' },
        p: 1
    }}>
        {children}
    </Box>
  )
}

// ---------- Main component ----------

interface MLBMatchupViewProps {
    matchId: number;
    league: LeagueName;
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
    const [isSimulating, setIsSimulating] = useState(false);
    const [simError, setSimError] = useState<string | null>(null);
    const simResults = useSelector((state: RootState) => selectMatchSimResults(state, league, matchId));
    const simStatus = useSelector((state: RootState) => selectMatchSimStatus(state, league, matchId));
    const gameLineups = useSelector((state: RootState) => selectGameLineups(state, league, matchId));
    const lineupData = useSelector((state: RootState) => selectGameLineupsData(state, league, matchId));
    const lineupStatus = useSelector((state: RootState) => selectGameLineupsStatus(state, league, matchId));
    const lineupError = useSelector((state: RootState) => selectGameLineupsError(state, league, matchId));
    const playerStatsStatus = useSelector((state: RootState) => selectGamePlayerStatsStatus(state, league, matchId));
    // const playerStatsError = useSelector((state: RootState) => selectGamePlayerStatsError(state, league, matchId));
    const teamInputs = useSelector((state: RootState) => selectTeamInputs(state, league, matchId));

    const {
        hasInvalidLeans,
        invalidLeansCount,
        showInvalidLeansSnackbar,
        setShowInvalidLeansSnackbar
    } = useLeanValidation({ league, matchId });

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
        if (!gameLineups || !teamInputs) return;

        const redoneLineups = applyMatchupLeansMLB({
          lineups: gameLineups,
          inputs: teamInputs
        });

        try {
            setIsSimulating(true);
            setSimError(null);
            
            // Get timestamp for later 
            const timestamp = new Date().toISOString();

            // Run simulation
            let simResults: SimResultsMLB;
            try {
                simResults = await window.electronAPI.simulateMatchupMLB({
                    // TO ADD:
                    // League avg stats
                    // Player stats
                    matchupLineups: redoneLineups,
                    numGames: 50000
                });
            } catch (error) {
                throw new Error(`Error while running simulation`);
            }

            // Save sim history
            const simHistoryEntry: SimHistoryEntry = {
                matchId: matchId,
                timestamp: timestamp,
                simResults: simResults,
                inputData: teamInputs
            };
            
            try {
                const saveSuccess = await window.electronAPI.saveSimHistory(simHistoryEntry);
                if (!saveSuccess) {
                    throw new Error('Unknown error');
                }
            } catch (error) {
                throw new Error(`Error while saving simulation results`);
            }

            // Fetch updated sim history
            dispatch(fetchSimResults({ league, matchId }));
        } catch (error) {
            setSimError(error instanceof Error ? error.message : 'An unexpected error occurred');
            console.error('Simulation error:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleRefresh = () => {
        // Clear the game data
        dispatch(clearGameData({ league, matchId }));
        
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
        dispatch(reorderMLBLineup({ matchId, team, newOrder }));
    };

    const handlePositionChange = (team: 'home' | 'away', playerId: number, position: Position) => {
        dispatch(updateMLBPlayerPosition({ matchId, team, playerId, position }));
    };

    // ---------- Render ----------
    if (lineupStatus === 'loading') return <CircularProgress />;
    if (lineupError) return <Alert severity="error">{lineupError}</Alert>;
    if (!lineupData) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <MLBMatchupHeader
                participant1={participant1}
                participant2={participant2}
                date={date}
                isSimulating={isSimulating}
                simError={simError}
                simResults={simResults}
                simStatus={simStatus}
                lineupData={lineupData}
                hasInvalidLeans={hasInvalidLeans}
                onRefresh={handleRefresh}
                onRunSimulation={handleRunSimulation}
            />
            <BettingBoundsSection
                awayTeamName={participant1}
                homeTeamName={participant2}
                gameLineups={gameLineups}
                onUpdateTeamLean={(teamType, leanType, value) => {
                    console.log('TEAMTYPE', teamType);
                    console.log('LEANTYPE', leanType);
                    console.log('VALUE', value);
                    dispatch(updateTeamLean({
                        league,
                        matchId,
                        teamType,
                        leanType,
                        value
                    }));
                }}
                onUpdatePlayerLean={(teamType, playerType, playerId, value) => {
                    dispatch(updatePlayerLean({
                        league,
                        matchId,
                        teamType,
                        playerType,
                        playerId,
                        value
                    }));
                }}
            />
            <Grid container spacing={2} sx={{ display: 'flex', flexWrap: 'wrap' }}>
                <TeamCard>
                    <DraggableLineup
                        teamName={`${participant1} (Away)`}
                        teamData={lineupData.away}
                        teamType="away"
                        matchId={matchId}
                        league={league}
                        onLineupReorder={handleLineupReorder}
                        onPositionChange={handlePositionChange}
                    />
                </TeamCard>
                <TeamCard>
                    <DraggableLineup
                        teamName={`${participant2} (Home)`}
                        teamData={lineupData.home}
                        teamType="home"
                        matchId={matchId}
                        league={league}
                        onLineupReorder={handleLineupReorder}
                        onPositionChange={handlePositionChange}
                    />
                </TeamCard>
            </Grid>

            <Snackbar
                open={showInvalidLeansSnackbar}
                autoHideDuration={15000}
                onClose={() => setShowInvalidLeansSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowInvalidLeansSnackbar(false)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {invalidLeansCount} lean{invalidLeansCount !== 1 ? 's' : ''} {invalidLeansCount !== 1 ? 'are' : 'is'} outside the valid range (-10% to 10%)
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MLBMatchupView; 