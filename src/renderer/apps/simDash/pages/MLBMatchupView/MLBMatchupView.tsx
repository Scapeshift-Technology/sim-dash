import React, { useState, useEffect } from 'react';
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
import type { MatchupLineups, MlbLiveDataApiResponse, Player, Position } from '@/types/mlb';
import DraggableLineup from './components/DraggableLineup';
import MLBMatchupHeader from './components/MLBMatchupHeader';
import BettingBoundsSection from './components/BettingBoundsSection';
import { RootState, AppDispatch } from '@/store/store';
import { fetchSimResults, selectMatchSimResults, selectMatchSimStatus } from '@/simDash/store/slices/scheduleSlice';
import {
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
    editMLBUnavailablePitchers,
    selectGamePlayerStatsError,
    selectGameSeriesGames,
    selectMLBGameContainer,
    switchCurrentSeriesGame,
    selectGameMetadata,
    selectGameMlbGameId,
    selectGameSimMode,
    selectGameCustomModeDataLineups,
    updateSimMode,
    selectGameCustomModeDataGameState,
    updateCustomModeGameState
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
import { useMLBMatchupData } from './hooks/useMLBMatchupData';
import { SimType } from '@@/types/mlb/mlb-sim';
import { useLineupFinder } from './hooks/useLineupFinder';
import { convertGameStateWithLineupsToLiveData } from '@@/services/mlb/utils/gameState';
import { 
    initializeLeague,
    getActiveStatCaptureConfiguration,
    selectActiveConfig,
    selectActiveConfigLoading,
    selectActiveConfigError
} from '@/simDash/store/slices/statCaptureSettingsSlice';

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
    const simType = useSelector((state: RootState) => selectGameSimMode(state, league, matchId));
    const gameMetadata = useSelector((state: RootState) => selectGameMetadata(state, league, matchId));
    const mlbGameId = useSelector((state: RootState) => selectGameMlbGameId(state, league, matchId));
    const customModeLineups = useSelector((state: RootState) => selectGameCustomModeDataLineups(state, league, matchId));
    const customModeGameState = useSelector((state: RootState) => selectGameCustomModeDataGameState(state, league, matchId));
    const traditionalSimulationStatus = useSelector((state: RootState) => selectTraditionalSimulationStatus(state, league, matchId));
    const traditionalSimulationError = useSelector((state: RootState) => selectTraditionalSimulationError(state, league, matchId));
    const seriesSimulationStatus = useSelector((state: RootState) => selectSeriesSimulationStatus(state, league, matchId));
    const seriesSimulationError = useSelector((state: RootState) => selectSeriesSimulationError(state, league, matchId));
    const activeConfig = useSelector((state: RootState) => selectActiveConfig(state, league));
    const activeConfigLoading = useSelector((state: RootState) => selectActiveConfigLoading(state, league));
    const activeConfigError = useSelector((state: RootState) => selectActiveConfigError(state, league));

    const [selectedGameTab, setSelectedGameTab] = useState(0);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [hasHistoricalStats, setHasHistoricalStats] = useState(false);
    const [liveGameData, setLiveGameData] = useState<MlbLiveDataApiResponse | undefined>(undefined);

    const { usedLineups } = useLineupFinder({
        standardGameLineups: gameLineups,
        liveGameData,
        customGameLineups: customModeLineups,
        simType
    });

    const {
        hasInvalidLeans,
        invalidLeansCount,
        showInvalidLeansSnackbar,
        setShowInvalidLeansSnackbar
    } = useLeanValidation({ league, matchId });

    // Create liveGameData either using the liveGameData from the API or the custom mode game state
    const bannerLiveGameData = simType === 'custom' && customModeGameState && usedLineups
        ? convertGameStateWithLineupsToLiveData(customModeGameState, usedLineups, participant1, participant2)
        : liveGameData;

    // ---------- Effect ----------

    useMLBMatchupData({
        matchId,
        league,
        date,
        participant1,
        participant2,
        daySequence,
        playerStatsStatus,
        gameLineups,
        gameContainer,
        simHistoryStatus,
        setHasHistoricalStats,
        mlbGameId,
        setLiveGameData
    });

    useEffect(() => {
        dispatch(initializeLeague(league)); // Only initializes if no league yet; won't overwrite anything
        if (!activeConfig && !activeConfigLoading && !activeConfigError) {
            dispatch(getActiveStatCaptureConfiguration(league));
        }
    }, [dispatch, league, activeConfig, activeConfigLoading, activeConfigError]);

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

    const saveAndUpdateHistory = async (simResults: SimResultsMLB, inputData: MLBGameInputs2, liveGameData?: MlbLiveDataApiResponse) => {
        // Transform data to specific DB types
        const dbInputData: MLBGameSimInputData = transformMLBGameInputs2ToDB(inputData, liveGameData);
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

    const handleRunSimulation = async (simType: SimType) => {
        if (!gameContainer || !teamInputs) return;

        let result;

        const gameInputs: MLBGameInputs2 = {
            ...gameContainer.currentGame,
            lineups: usedLineups as MatchupLineups
        } as MLBGameInputs2;
        
        if (simType === 'series') {
            if (!gameContainer.seriesGames) return;
            console.log('Running series simulation.');
            result = await dispatch(runSeriesSimulationThunk({
                league,
                matchId,
                gameInputs: gameContainer.seriesGames,
                activeConfig: activeConfig || undefined
            })).unwrap();
        } else if (simType === 'live') {
            if (!gameContainer.currentGame) return;
            console.log('Running live simulation.');
            result = await dispatch(runSimulationThunk({
                league,
                matchId,
                gameInputs: gameInputs,
                numGames: 90000,
                liveGameData: liveGameData,
                activeConfig: activeConfig || undefined
            })).unwrap();

            await saveAndUpdateHistory(result, gameContainer.currentGame as MLBGameInputs2, liveGameData);
            return;
        } else if (simType === 'custom') {
            if (!gameContainer.customModeData) return;
            result = await dispatch(runSimulationThunk({
                league,
                matchId,
                gameInputs: gameInputs,
                numGames: 90000,
                liveGameData: bannerLiveGameData,
                activeConfig: activeConfig || undefined
            })).unwrap();
            console.log('result', result);

            await saveAndUpdateHistory(result, gameInputs, bannerLiveGameData);
            return;
        } else {
            if (!gameContainer.currentGame) return;
            result = await dispatch(runSimulationThunk({
                league,
                matchId,
                gameInputs: gameContainer.currentGame,
                activeConfig: activeConfig || undefined
            })).unwrap();
        }

        await saveAndUpdateHistory(result, gameContainer.currentGame as MLBGameInputs2);
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
        dispatch(editMLBLineup({ matchId, simType: simType as SimType, team, newLineup }));
        if (newBench) {
            dispatch(editMLBBench({ matchId, simType: simType as SimType, team, newBench }));
        }
    };

    const handlePitcherReorder = (team: 'home' | 'away', newStartingPitcher: Player | null, newBullpen: Player[], newUnavailablePitchers: Player[] | undefined) => {
        if (newStartingPitcher) {
            dispatch(editMLBStartingPitcher({ matchId, simType: simType as SimType, team, newStartingPitcher }));
        }
        dispatch(editMLBBullpen({ matchId, simType: simType as SimType, team, newBullpen }));
        if (newUnavailablePitchers) {
            dispatch(editMLBUnavailablePitchers({ matchId, simType: simType as SimType, team, newUnavailablePitchers }));
        }
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
        if (!usedLineups || !gameMetadata) return;
        const tsvString = convertLineupsToTSV(usedLineups, gameMetadata, participant1, participant2);

        navigator.clipboard.writeText(tsvString).then(() => {
            setShowCopySuccess(true);
        }).catch(err => {
            console.error('Failed to copy lineup: ', err);
        });
    };

    const handleChangeSimType = (simType: SimType) => {
        if (liveGameData && liveGameData.gameData.status.abstractGameState === 'Live') {
            dispatch(updateSimMode({ league, matchId, simType, liveGameData }));
        } else {
            dispatch(updateSimMode({ league, matchId, simType }));
        }
    };

    const handleGameStateUpdate = (field: 'awayScore' | 'homeScore' | 'inning' | 'outs' | 'topInning', value: number | boolean) => {
        if (!customModeGameState) return;
        
        const updatedGameState = { ...customModeGameState };
        
        if (field === 'awayScore') {
            updatedGameState.awayScore = value as number;
        } else if (field === 'homeScore') {
            updatedGameState.homeScore = value as number;
        } else if (field === 'inning') {
            updatedGameState.inning = value as number;
        } else if (field === 'outs') {
            updatedGameState.outs = value as number;
        } else if (field === 'topInning') {
            updatedGameState.topInning = value as boolean;
        }
        
        dispatch(updateCustomModeGameState({ league, matchId, gameState: updatedGameState }));
    };

    const handlePlayerChange = (field: 'currentBatter' | 'currentPitcher', playerId: number) => {
        if (!customModeGameState || !usedLineups) return;
        
        const updatedGameState = { ...customModeGameState };
        
        if (field === 'currentBatter') {
            if (updatedGameState.topInning) {
                const playerIndex = updatedGameState.awayLineup.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    updatedGameState.awayLineupPos = playerIndex;
                }
            } else {
                const playerIndex = updatedGameState.homeLineup.findIndex(p => p.id === playerId);
                if (playerIndex !== -1) {
                    updatedGameState.homeLineupPos = playerIndex;
                }
            }
        } else if (field === 'currentPitcher') {
            const findPlayerInTeamPitchers = (teamLineup: { startingPitcher: Player; bullpen: Player[] }) => {
                if (teamLineup.startingPitcher.id === playerId) {
                    return { player: teamLineup.startingPitcher, isStarter: true };
                }
                const reliever = teamLineup.bullpen.find(p => p.id === playerId);
                return reliever ? { player: reliever, isStarter: false } : null;
            };

            if (updatedGameState.topInning) {
                const pitcherInfo = findPlayerInTeamPitchers(usedLineups.home);
                if (pitcherInfo) {
                    updatedGameState.homePitcher = {
                        id: playerId,
                        battersFaced: updatedGameState.homePitcher.battersFaced,
                        recentResults: updatedGameState.homePitcher.recentResults,
                        position: pitcherInfo.isStarter ? 'SP' : 'RP'
                    };
                }
            } else {
                const pitcherInfo = findPlayerInTeamPitchers(usedLineups.away);
                if (pitcherInfo) {
                    updatedGameState.awayPitcher = {
                        id: playerId,
                        battersFaced: updatedGameState.awayPitcher.battersFaced,
                        recentResults: updatedGameState.awayPitcher.recentResults,
                        position: pitcherInfo.isStarter ? 'SP' : 'RP'
                    };
                }
            }
        }
        
        dispatch(updateCustomModeGameState({ league, matchId, gameState: updatedGameState }));
    };

    const handleBaseChange = (base: 'first' | 'second' | 'third', occupied: boolean) => {
        if (!customModeGameState) return;
        
        const updatedGameState = { ...customModeGameState };
        const baseIndex = base === 'first' ? 0 : base === 'second' ? 1 : 2;
        
        // Update the bases array - [first, second, third]
        updatedGameState.bases = [...updatedGameState.bases];
        updatedGameState.bases[baseIndex] = occupied;
        
        dispatch(updateCustomModeGameState({ league, matchId, gameState: updatedGameState }));
    };

    const handleBattersFacedChange = (battersFaced: number) => {
        if (!customModeGameState || !bannerLiveGameData) return;
        
        const updatedGameState = { ...customModeGameState };
        const outs = updatedGameState.outs;
        const isTopInning = updatedGameState.topInning;
        
        if (isTopInning || (!isTopInning && outs === 3)) {
            updatedGameState.homePitcher = {
                ...updatedGameState.homePitcher,
                battersFaced: battersFaced
            };
        } else {
            updatedGameState.awayPitcher = {
                ...updatedGameState.awayPitcher,
                battersFaced: battersFaced
            };
        }
        
        dispatch(updateCustomModeGameState({ league, matchId, gameState: updatedGameState }));
    };

    // ---------- Render ----------
    if (dataStatus === 'loading' || playerStatsStatus === 'loading' || (dataStatus === 'succeeded' && playerStatsStatus === 'idle')) return <CircularProgress />;
    if (dataError) return <ErrorAlert message="Error fetching game data. Please try again." onRetry={handleRefresh} />;
    if (playerStatsError) return <ErrorAlert message="Error fetching player stats. Please try again." onRetry={handleRefresh} />;
    if (!usedLineups) return <Alert severity="info">No lineup data found.</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            <MLBGameBanner 
                liveGameData={bannerLiveGameData} 
                lineupData={usedLineups}
                isEditable={simType === 'custom'}
                onGameStateUpdate={handleGameStateUpdate}
                onPlayerChange={handlePlayerChange}
                onBaseChange={handleBaseChange}
                onBattersFacedChange={handleBattersFacedChange}
            />
            <MLBMatchupHeader
                participant1={participant1}
                participant2={participant2}
                daySequence={daySequence}
                dateTime={dateTime}
                isSimulating={traditionalSimulationStatus === 'loading' || seriesSimulationStatus === 'loading'}
                simError={traditionalSimulationError || seriesSimulationError}
                simResults={simResults}
                simStatus={simHistoryStatus}
                simType={simType}
                lineupData={usedLineups}
                hasInvalidLeans={hasInvalidLeans}
                seriesGames={seriesGames}
                liveGameData={liveGameData}
                onRefresh={handleRefresh}
                onRunSimulation={handleRunSimulation}
                onChangeSimType={handleChangeSimType}
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
                            teamData={usedLineups.away}
                            teamType="away"
                            matchId={matchId}
                            league={league}
                            liveGameData={liveGameData}
                            onLineupReorder={handleLineupReorder}
                            onPitcherReorder={handlePitcherReorder}
                            onPositionChange={handlePositionChange}
                        />
                    </TeamCard>
                    <TeamCard>
                        <DraggableLineup
                            teamName={`${participant2} (Home)`}
                            teamData={usedLineups.home}
                            teamType="home"
                            matchId={matchId}
                            league={league}
                            liveGameData={liveGameData}
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