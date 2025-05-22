import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, 
    CircularProgress, 
    Alert, 
    Grid,
    Snackbar,
    Tabs,
    Tab,
    Typography,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { Player, Position } from '@/types/mlb';
import DraggableLineup from './components/DraggableLineup';
import MLBMatchupHeader from './components/MLBMatchupHeader';
import BettingBoundsSection from './components/BettingBoundsSection';
import { RootState, AppDispatch } from '@/store/store';
import { fetchSimResults, selectMatchSimResults, selectMatchSimStatus } from '@/simDash/store/slices/scheduleSlice';
import {
    fetchMlbGamePlayerStats,
    fetchMlbGameData,
    selectGameDataStatus, 
    selectGameDataError,
    selectGamePlayerStatsStatus,
    clearGameData,
    editMLBLineup,
    updateMLBPlayerPosition,
    updateTeamLean,
    updatePlayerLean,
    selectTeamInputs,
    selectGameLineups,
    editMLBBench,
    editMLBStartingPitcher,
    editMLBBullpen,
    selectGamePlayerStatsError,
    selectGameSeriesGames,
    selectMLBGameContainer,
    switchCurrentSeriesGame,
    selectGameMetadata,
    selectGameMlbGameId
} from '@/simDash/store/slices/simInputsSlice';
import { LeagueName } from '@@/types/league';
import { useLeanValidation } from './hooks/leanValidation';
import { 
    runSeriesSimulationThunk, 
    runSimulationThunk, 
    selectSeriesSimulationError, 
    selectSeriesSimulationStatus, 
    selectTraditionalSimulationError, 
    selectTraditionalSimulationStatus 
} from '@/simDash/store/slices/simulationStatusSlice';
import { MLBGameInputs2 } from '@@/types/simInputs';
import { MLBGameSimInputData } from '@@/types/simHistory';
import { SimHistoryEntry } from '@@/types/simHistory';
import { transformMLBGameInputs2ToDB } from '@/simDash/utils/transformers';
import { SimResultsMLB } from '@@/types/bettingResults';
import { convertLineupsToTSV } from '@/simDash/utils/copyUtils';
import MLBGameBanner from './components/MLBGameBanner';

// ---------- Sub-components ----------

const ErrorAlert: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <Alert 
        severity="error"
        action={
            <Button color="inherit" size="small" onClick={onRetry}>
                Retry
            </Button>
        }
    >
        {message}
    </Alert>
);

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
    dateTime: string;
    participant1: string; // Away Team
    participant2: string; // Home Team
    daySequence?: number;
}

const MLBMatchupView: React.FC<MLBMatchupViewProps> = ({
    matchId,
    league,
    date,
    dateTime,
    participant1,
    participant2,
    daySequence 
}) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // ---------- State ----------
    const gameContainer = useSelector((state: RootState) => selectMLBGameContainer(state, league, matchId));
    const simResults = useSelector((state: RootState) => selectMatchSimResults(state, league, matchId));
    const simHistoryStatus = useSelector((state: RootState) => selectMatchSimStatus(state, league, matchId));
    const gameLineups = useSelector((state: RootState) => selectGameLineups(state, league, matchId));
    const dataStatus = useSelector((state: RootState) => selectGameDataStatus(state, league, matchId));
    const dataError = useSelector((state: RootState) => selectGameDataError(state, league, matchId));
    const playerStatsStatus = useSelector((state: RootState) => selectGamePlayerStatsStatus(state, league, matchId));
    const playerStatsError = useSelector((state: RootState) => selectGamePlayerStatsError(state, league, matchId));
    const teamInputs = useSelector((state: RootState) => selectTeamInputs(state, league, matchId));
    const seriesGames = useSelector((state: RootState) => selectGameSeriesGames(state, league, matchId));
    const gameMetadata = useSelector((state: RootState) => selectGameMetadata(state, league, matchId));
    const mlbGameId = useSelector((state: RootState) => selectGameMlbGameId(state, league, matchId));
    const traditionalSimulationStatus = useSelector((state: RootState) => selectTraditionalSimulationStatus(state, league, matchId));
    const traditionalSimulationError = useSelector((state: RootState) => selectTraditionalSimulationError(state, league, matchId));
    const seriesSimulationStatus = useSelector((state: RootState) => selectSeriesSimulationStatus(state, league, matchId));
    const seriesSimulationError = useSelector((state: RootState) => selectSeriesSimulationError(state, league, matchId));

    const [selectedGameTab, setSelectedGameTab] = useState(0);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [hasHistoricalStats, setHasHistoricalStats] = useState(false);

    const {
        hasInvalidLeans,
        invalidLeansCount,
        showInvalidLeansSnackbar,
        setShowInvalidLeansSnackbar
    } = useLeanValidation({ league, matchId });

    // ---------- Effect ----------
    useEffect(() => { // Fetch game data
        if (dataStatus === 'idle') {
            dispatch(fetchMlbGameData({
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
        if (dataStatus === 'succeeded' && playerStatsStatus === 'idle' && gameLineups) {
            dispatch(fetchMlbGamePlayerStats({
                matchId: matchId,
                matchupLineups: (gameLineups),
                date: date,
                seriesGames: gameContainer?.seriesGames
            }));
        }
    }, [dispatch, dataStatus, playerStatsStatus, gameLineups, matchId]);

    useEffect(() => { // Fetch sim history
        if (!matchId) return;
        if (simHistoryStatus === 'idle') {
            dispatch(fetchSimResults({ league, matchId }));
        }
    }, [dispatch, matchId, league, simHistoryStatus]);

    useEffect(() => {
        if (!gameLineups) return;
        
        const checkHistoricalStats = () => {
            const allPlayers = [
                ...gameLineups.away.lineup,
                ...gameLineups.away.bench,
                ...gameLineups.away.bullpen,
                gameLineups.away.startingPitcher,
                ...gameLineups.home.lineup,
                ...gameLineups.home.bench,
                ...gameLineups.home.bullpen,
                gameLineups.home.startingPitcher
            ];
    
            return allPlayers.some(player => 
                player.stats?.statsDate && player.stats.statsDate !== date
            );
        };
    
        setHasHistoricalStats(checkHistoricalStats());
    }, [gameLineups, date]);

    // ---------- Handlers ----------
    const handleTeamLeanUpdate = (teamType: 'home' | 'away', leanType: 'offense' | 'defense', value: number) => {
        dispatch(updateTeamLean({
            league,
            matchId,
            teamType,
            leanType,
            value
        }));
    };

    const handlePlayerLeanUpdate = (teamType: 'home' | 'away', playerType: 'hitter' | 'pitcher', playerId: number, value: number) => {
        dispatch(updatePlayerLean({
            league,
            matchId,
            teamType,
            playerType,
            playerId,
            value
        }));
    };

    const saveAndUpdateHistory = async (simResults: SimResultsMLB, inputData: MLBGameInputs2) => {
        // Transform data to specific DB types
        const dbInputData: MLBGameSimInputData = transformMLBGameInputs2ToDB(inputData);
        const timestamp = new Date().toISOString();

        const simHistoryEntry: SimHistoryEntry = {
            matchId,
            timestamp,
            simResults,
            inputData: dbInputData
        };

        try {
            const saveSuccess = await window.electronAPI.saveSimHistory(simHistoryEntry);
            if (!saveSuccess) {
                throw new Error('Unknown error');
            }
            dispatch(fetchSimResults({ league, matchId }));
        } catch (error) {
            throw new Error(`Error while saving simulation results`);
        }
    };

    const handleRunSimulation = async (isSeries: boolean) => {
        if (!gameContainer || !teamInputs) return;
        
        if (isSeries) {
            if (!gameContainer.seriesGames) return;
            const result = await dispatch(runSeriesSimulationThunk({
                league,
                matchId,
                gameInputs: gameContainer.seriesGames
            })).unwrap();
            await saveAndUpdateHistory(result, gameContainer.currentGame as MLBGameInputs2);
        } else {
            if (!gameContainer.currentGame) return;
            const result = await dispatch(runSimulationThunk({
                league,
                matchId,
                gameInputs: gameContainer.currentGame
            })).unwrap();
            await saveAndUpdateHistory(result, gameContainer.currentGame as MLBGameInputs2);
        }
    };

    const handleRefresh = () => {
        // Clear the game data
        dispatch(clearGameData({ league, matchId }));
        
        // Fetch new lineup data(this will trigger the useEffect to fetch player stats)
        dispatch(fetchMlbGameData({
            league,
            date,
            participant1,
            participant2,
            daySequence,
            matchId
        }));
    };

    const handleLineupReorder = (team: 'home' | 'away', newLineup: Player[], newBench: Player[] | null) => {
        dispatch(editMLBLineup({ matchId, team, newLineup }));
        if (newBench) {
            dispatch(editMLBBench({ matchId, team, newBench }));
        }
    };

    const handlePitcherReorder = (team: 'home' | 'away', newStartingPitcher: Player | null, newBullpen: Player[]) => {
        if (newStartingPitcher) {
            dispatch(editMLBStartingPitcher({ matchId, team, newStartingPitcher }));
        }
        dispatch(editMLBBullpen({ matchId, team, newBullpen }));
    }

    const handlePositionChange = (team: 'home' | 'away', playerId: number, position: Position) => {
        dispatch(updateMLBPlayerPosition({ matchId, team, playerId, position }));
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setSelectedGameTab(newValue);
        dispatch(switchCurrentSeriesGame({ 
          league,
          matchId, 
          gameNumber: newValue + 1,
        }));
    };

    const handleCopyLineup = () => {
        if (!gameLineups || !gameMetadata) return;
        const tsvString = convertLineupsToTSV(gameLineups, gameMetadata, participant1, participant2);

        navigator.clipboard.writeText(tsvString).then(() => {
            setShowCopySuccess(true);
        }).catch(err => {
            console.error('Failed to copy lineup: ', err);
        });
    };

    // ---------- Render ----------
    if (dataStatus === 'loading' || playerStatsStatus === 'loading' || (dataStatus === 'succeeded' && playerStatsStatus === 'idle')) return <CircularProgress />;
    if (dataError) return <ErrorAlert message="Error fetching game data. Please try again." onRetry={handleRefresh} />;
    if (playerStatsError) return <ErrorAlert message="Error fetching player stats. Please try again." onRetry={handleRefresh} />;
    if (!gameLineups) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <MLBGameBanner mlbGameId={mlbGameId} />
            <MLBMatchupHeader
                participant1={participant1}
                participant2={participant2}
                dateTime={dateTime}
                isSimulating={traditionalSimulationStatus === 'loading' || seriesSimulationStatus === 'loading'}
                simError={traditionalSimulationError || seriesSimulationError}
                simResults={simResults}
                simStatus={simHistoryStatus}
                lineupData={gameLineups}
                hasInvalidLeans={hasInvalidLeans}
                seriesGames={seriesGames}
                onRefresh={handleRefresh}
                onRunSimulation={handleRunSimulation}
            />
            <BettingBoundsSection
                awayTeamName={participant1}
                homeTeamName={participant2}
                gameContainer={gameContainer}
                matchId={matchId}
                onUpdateTeamLean={handleTeamLeanUpdate}
                onUpdatePlayerLean={handlePlayerLeanUpdate}
            />
            
            {seriesGames && Object.keys(seriesGames).length > 0 && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={selectedGameTab} onChange={handleTabChange}>
                        {Object.keys(seriesGames).map((gameNumber: string) => (
                            <Tab key={gameNumber} label={`Game ${gameNumber}`} />
                        ))}
                    </Tabs>
                </Box>
            )}
            
            <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, mb: 2 }}>
                {gameMetadata && (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        pb: 1,
                        borderBottom: '1px dashed',
                        borderColor: 'divider',
                        color: 'text.secondary'
                    }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontStyle: 'italic',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <span style={{ color: 'text.primary' }}>Lineup Source:</span> {gameMetadata.lineupsSource}
                        </Typography>
                        <Tooltip title="Copy lineup information">
                            <IconButton onClick={handleCopyLineup} size="small" sx={{ ml: 1 }}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                <Grid container spacing={2} sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    <TeamCard>
                        <DraggableLineup
                            teamName={`${participant1} (Away)`}
                            teamData={gameLineups.away}
                            teamType="away"
                            matchId={matchId}
                            league={league}
                            onLineupReorder={handleLineupReorder}
                            onPitcherReorder={handlePitcherReorder}
                            onPositionChange={handlePositionChange}
                        />
                    </TeamCard>
                    <TeamCard>
                        <DraggableLineup
                            teamName={`${participant2} (Home)`}
                            teamData={gameLineups.home}
                            teamType="home"
                            matchId={matchId}
                            league={league}
                            onLineupReorder={handleLineupReorder}
                            onPitcherReorder={handlePitcherReorder}
                            onPositionChange={handlePositionChange}
                        />
                    </TeamCard>
                </Grid>
            </Box>

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
            <Snackbar
                open={showCopySuccess}
                autoHideDuration={3000}
                onClose={() => setShowCopySuccess(false)}
                message="Lineup information copied to clipboard!"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
            <Snackbar
                open={hasHistoricalStats}
                autoHideDuration={null}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity="warning"
                    sx={{ width: '100%' }}
                >
                    Some players are using projected stats from a different date
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MLBMatchupView; 