import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
// ----- Slices -----
import { fetchMlbGameData, fetchMlbGamePlayerStats, selectGameDataStatus } from '@/simDash/store/slices/simInputsSlice';
import { fetchSimResults } from '@/apps/simDash/store/slices/scheduleSlice';
// ----- Types
import { LeagueName } from '@@/types/league';
import { MatchupLineups, MlbLiveDataApiResponse } from '@@/types/mlb';
import { MLBGameContainer } from '@@/types/simInputs';


export interface UseMLBMatchupDataProps {
    matchId: number;
    league: LeagueName;
    date: string;
    participant1: string;
    participant2: string;
    daySequence?: number;
    playerStatsStatus: string;
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
        playerStatsStatus, gameLineups, gameContainer,
        simHistoryStatus,
        setHasHistoricalStats,
        mlbGameId, setLiveGameData
    } = props;
    const dispatch = useDispatch<AppDispatch>();
    const dataStatus = useSelector((state: RootState) => selectGameDataStatus(state, league, matchId));

    // ---------- Effects ----------

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
    }, [dispatch, league, date, participant1, participant2, daySequence, matchId, dataStatus]);

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

        // Fetch initial live data (We don't want to rely on the websocket to start quickly)
        async function fetchInitialLiveData() {
            try {
                const liveData = await window.electronAPI.fetchInitialMLBLiveData({ gameId: mlbGameId as number });
                console.log('INITIAL LIVE DATA:', liveData);
                setLiveGameData(liveData); // Slight type mismatch here
            } catch (error) {
                console.error('Error fetching initial live data:', error);
            }
        }

        fetchInitialLiveData();
    
        // Connect to WebSocket
        window.electronAPI.connectToWebSocketMLB({ gameId: mlbGameId });
    
        // Set up update listener
        const cleanup = window.electronAPI.onMLBGameUpdate((gameData: { data: MlbLiveDataApiResponse }) => {
          console.log('Received game update:', gameData);
          setLiveGameData(gameData.data);
        });
    
        // Cleanup function
        return () => {
          console.log('Disconnecting from WebSocket');
          cleanup(); // Remove the update listener
          window.electronAPI.disconnectFromWebSocketMLB({ gameId: mlbGameId });
        };
      }, [mlbGameId]);
};

