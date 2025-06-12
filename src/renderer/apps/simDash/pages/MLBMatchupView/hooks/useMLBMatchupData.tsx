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

        // Fetch initial live data (We don't want to rely on the websocket to start quickly)
        async function fetchInitialLiveData() {
            try {
                const liveData = await window.electronAPI.fetchInitialMLBLiveData({ gameId: mlbGameId as number });
                setLiveGameData(liveData); // Slight type mismatch here
            } catch (error) {
                console.error('Error fetching initial live data:', error);
            }
        }

        fetchInitialLiveData();
    
        // Connect to WebSocket
        window.electronAPI.connectToWebSocketMLB({ gameId: mlbGameId });
    
        // Set up update listener
        const cleanup = window.electronAPI.onMLBGameUpdate((gameData: { data: MlbLiveDataApiResponse, gameId: number }) => {
          if (mlbGameId === gameData.gameId) {
            setLiveGameData(gameData.data);
          }
        });
    
        // Cleanup function
        return () => {
          console.log('Disconnecting from WebSocket');
          cleanup(); // Remove the update listener
          window.electronAPI.disconnectFromWebSocketMLB({ gameId: mlbGameId });
        };
      }, [mlbGameId]);
};

