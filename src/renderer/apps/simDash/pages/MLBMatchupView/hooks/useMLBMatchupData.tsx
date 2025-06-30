import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
// ----- Slices -----
import { 
    fetchMlbGameData, 
    fetchMlbGamePlayerStats, 
    fetchMlbGameParkEffects,
    fetchMlbGameUmpireEffects
} from '@/simDash/store/slices/simInputsSlice';
import { fetchSimResults } from '@/apps/simDash/store/slices/scheduleSlice';
// ----- Types
import { LeagueName } from '@@/types/league';
import { MatchupLineups, MlbLiveDataApiResponse, Player, TeamLineup } from '@@/types/mlb';
import { MLBGameContainer } from '@@/types/simInputs';
import { getMLBWebSocketManager } from '@/simDash/services/mlbWebSocketManager';

// ---------- Main hook ----------

export interface UseMLBMatchupDataProps {
    matchId: number;
    league: LeagueName;
    date: string;
    participant1: string;
    participant2: string;
    daySequence?: number;
    playerStatsStatus: string;
    parkEffectsStatus: string;
    gameDataStatus: string;
    gameLineups: MatchupLineups | undefined;
    gameContainer: MLBGameContainer | undefined;
    simHistoryStatus: string;
    setHasHistoricalStats: (hasHistoricalStats: boolean) => void;
    mlbGameId: number | undefined;
    setLiveGameData: (liveGameData: MlbLiveDataApiResponse) => void;
}

export const useMLBMatchupData = (props: UseMLBMatchupDataProps) => {

    // ---------- State ----------

    const { 
        matchId, league, date, participant1, participant2, daySequence, 
        playerStatsStatus, parkEffectsStatus, gameDataStatus, gameLineups, 
        gameContainer, simHistoryStatus,
        setHasHistoricalStats,
        mlbGameId, setLiveGameData
    } = props;
    const dispatch = useDispatch<AppDispatch>();

    // ---------- Effects ----------

    useEffect(() => { // Fetch game data
        if (gameDataStatus === 'idle') {
            dispatch(fetchMlbGameData({
                league,
                date,
                participant1,
                participant2,
                daySequence,
                matchId
            }));
        }
    }, [dispatch, league, date, participant1, participant2, daySequence, matchId, gameDataStatus]);

    useEffect(() => { // Fetch player stats
        if (gameDataStatus === 'succeeded' && playerStatsStatus === 'idle' && gameLineups) {
            dispatch(fetchMlbGamePlayerStats({
                matchId: matchId,
                matchupLineups: (gameLineups),
                date: date,
                seriesGames: gameContainer?.seriesGames
            }));
        }
    }, [dispatch, gameDataStatus, playerStatsStatus, gameLineups, matchId]);

    useEffect(() => { // Fetch park effects
        if (gameDataStatus === 'succeeded' && parkEffectsStatus === 'idle' && gameLineups && gameContainer?.currentGame?.gameInfo?.venueId) {
            const getTeamPlayers = (team: TeamLineup | undefined): Player[] => {
                if (!team) return [];
                return [
                    ...(team.lineup || []),
                    ...(team.bench || []),
                    ...(team.bullpen || []),
                    team.startingPitcher,
                    ...(team.unavailableHitters || []),
                    ...(team.unavailablePitchers || [])
                ].filter(Boolean) as Player[];
            };

            const playerList = [
                ...getTeamPlayers(gameLineups.away),
                ...getTeamPlayers(gameLineups.home)
            ];

            dispatch(fetchMlbGameParkEffects({
                matchId: matchId,
                venueId: gameContainer.currentGame.gameInfo.venueId,
                players: playerList
            }));
        }
    }, [dispatch, gameDataStatus, parkEffectsStatus, gameLineups, gameContainer?.currentGame?.gameInfo?.venueId, matchId]);

    useEffect(() => { // Fetch umpires
        const hpUmp = gameContainer?.currentGame?.gameInfo?.officials?.find(ump => ump.officialType === 'Home Plate');
        if (hpUmp && hpUmp.official?.id && gameDataStatus === 'succeeded') {
            console.log('HP umpire:', hpUmp)
            dispatch(fetchMlbGameUmpireEffects({
                matchId: matchId,
                umpireId: hpUmp.official.id
            }));
        }
    }, [dispatch, gameDataStatus, gameContainer?.currentGame?.gameInfo?.officials, matchId]);

    useEffect(() => { // Fetch sim history
        if (!matchId) return;
        if (simHistoryStatus === 'idle') {
            dispatch(fetchSimResults({ league, matchId }));
        }
    }, [dispatch, matchId, league, simHistoryStatus]);

    useEffect(() => { // Checks for players with non-current stats(will show warning in MLBMatchupView)
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

    useEffect(() => { // Gets live game data
        if (!mlbGameId) return;

        // Fetch initial live data first to check game status
        async function fetchInitialLiveData() {
            try {
                const liveData = await window.electronAPI.fetchInitialMLBLiveData({ gameId: mlbGameId! });
                setLiveGameData(liveData);
                
                // Check if game is Final before connecting to WebSocket
                const gameStatus = liveData.gameData?.status?.abstractGameState;
                const detailedState = liveData.gameData?.status?.detailedState;
                
                if (gameStatus === 'Final' || detailedState === 'Final') {
                    console.log(`[MLBMatchupView] Game ${mlbGameId} is Final, skipping WebSocket connection`);
                    return null; // Don't connect to WebSocket for Final games
                }
                
                // Only connect to WebSocket for non-Final games using the manager
                console.log(`[MLBMatchupView] Game ${mlbGameId} status: ${detailedState}, subscribing via WebSocket manager`);
                
                const manager = getMLBWebSocketManager();
                if (manager) {
                    await manager.subscribeToGame(mlbGameId!, league, matchId, `matchup-${matchId}`);
                } else {
                    console.error('WebSocket manager not available');
                }
                
                // Set up update listener
                const cleanup = window.electronAPI.onMLBGameUpdate((gameData: { data: MlbLiveDataApiResponse, gameId: number }) => {
                  if (mlbGameId! === gameData.gameId) {
                    console.log(`[MLBMatchupView] Received live data update for game ${gameData.gameId}:`, {
                      inning: gameData.data.liveData?.linescore?.currentInning,
                      inningHalf: gameData.data.liveData?.linescore?.inningHalf,
                      balls: gameData.data.liveData?.linescore?.balls,
                      strikes: gameData.data.liveData?.linescore?.strikes,
                      outs: gameData.data.liveData?.linescore?.outs,
                      awayScore: gameData.data.liveData?.linescore?.teams?.away?.runs,
                      homeScore: gameData.data.liveData?.linescore?.teams?.home?.runs,
                      gameStatus: gameData.data.gameData?.status?.detailedState
                    });
                    setLiveGameData(gameData.data);
                    console.log(`[MLBMatchupView] Live game data state updated for game ${gameData.gameId}`);
                  }
                });
                
                return cleanup;
            } catch (error) {
                console.error('Error fetching initial live data:', error);
                return null;
            }
        }

        // Execute async function and handle cleanup
        let cleanupFunction: (() => void) | null = null;
        
        fetchInitialLiveData().then(cleanup => {
            cleanupFunction = cleanup;
        });
    
        // Cleanup function
        return () => {
          console.log(`[MLBMatchupView] Unsubscribing from WebSocket for game ${mlbGameId}`);
          if (cleanupFunction) {
            cleanupFunction(); // Remove the update listener
          }
          
          // Unsubscribe from WebSocket manager
          const manager = getMLBWebSocketManager();
          if (manager && mlbGameId) {
            manager.unsubscribeFromGame(mlbGameId, `matchup-${matchId}`);
          }
        };
              }, [mlbGameId, league, matchId]);
};

