import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { 
  GameMetadataMLB, 
  MarketLinesMLB, 
  MatchupLineups, 
  MLBGameData, 
  MLBGameDataResponse, 
  Player, 
  Position, 
  SeriesInfoMLB, 
  MlbLiveDataApiResponse, 
  GameStateMLB 
} from '@/types/mlb';
import type { 
  MLBGameSimInputs, 
  MLBGameSimInputsTeam, 
  SimInputsState, 
  MLBGameInputs2, 
  MLBGameContainer,
  MLBGameCustomModeData
} from '@/types/simInputs';
import { LeagueName } from '@@/types/league';
import { RootState } from '@/store/store';
import { SimType, ParkEffectsResponse } from '@@/types/mlb/mlb-sim';
import { initializeGameState } from '@@/services/mlb/sim/gameState';

// ---------- Initial States ----------
// ----- MLB -----

const initialMLBTeamInputs: MLBGameSimInputsTeam = {
    teamHitterLean: 0,
    teamPitcherLean: 0,
    individualHitterLeans: {},
    individualPitcherLeans: {}
  }

const initialMLBSimInputs: MLBGameSimInputs = {
  away: initialMLBTeamInputs,
  home: initialMLBTeamInputs
}

const initialMLBGameContainer: MLBGameContainer = {
  currentGame: null,

  gameDataStatus: 'idle',
  gameDataError: null,
  statsStatus: 'idle',
  statsError: null,
  parkEffectsStatus: 'idle',
  parkEffectsError: null,

  simMode: 'game',
  parkEffectsEnabled: false
}

// ---------- Helpers ----------

const formatResponseAsGameInputs = (gameData: MLBGameData) => {
  const newGame: MLBGameInputs2 = {
    lineups: gameData.lineups,
    gameInfo: gameData.gameInfo,
    simInputs: initialMLBSimInputs
  }

  return newGame;
}

function syncCurrentGameEdit(state: SimInputsState, matchId: number) {
  const container = state['MLB']?.[matchId];
  if (container?.currentGame && container?.seriesGames) {
    // Find which series game number matches current game
    const gameNumber = container.currentGame.gameInfo.seriesGameNumber;
    if (gameNumber) {
      // Sync the changes
      container.seriesGames[gameNumber] = container.currentGame;
    }
  }
}

function createCustomModeData(lineups: MatchupLineups, liveGameData?: MlbLiveDataApiResponse): MLBGameCustomModeData {
  const gameState = initializeGameState(lineups, liveGameData);
  return {
    gameState: gameState,
    lineups: lineups
  };
}

function handleMLBLineupEdit<T extends { matchId: number; simType: SimType; team: 'home' | 'away' }>(
  state: SimInputsState,
  payload: T,
  updateCurrentGame: (lineups: MatchupLineups, team: 'home' | 'away', payload: T) => void,
  updateCustomMode: (lineups: MatchupLineups, team: 'home' | 'away', payload: T) => void
) {
  const { matchId, simType, team } = payload;
  
  // No edits allowed for live mode
  if (simType === 'live') return;
  
  if (!state['MLB']?.[matchId]?.currentGame) return;
  
  // Handle custom mode
  if (simType === 'custom' && state['MLB']?.[matchId]?.customModeData) {
    updateCustomMode(state['MLB'][matchId].customModeData.lineups, team, payload);
    return;
  }
  
  // Handle normal mode
  updateCurrentGame(state['MLB'][matchId].currentGame.lineups, team, payload);
  syncCurrentGameEdit(state, matchId);
  state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
}

// ---------- Thunks ----------

export const fetchMlbGameData = createAsyncThunk<
  { matchId: number; gameData: MLBGameDataResponse },
  { 
    league: string; 
    date: string; 
    participant1: string; 
    participant2: string; 
    daySequence?: number; 
    matchId: number }
>(
  'simInputs/fetchMlbGameData',
  async ({ league, date, participant1, participant2, daySequence, matchId }) => {
    const gameData = await window.electronAPI.fetchMlbGameData({
      league,
      date,
      participant1,
      participant2,
      daySequence
    });
    return { matchId, gameData };
  }
);

export const fetchMlbGamePlayerStats = createAsyncThunk<
  { matchId: number; playerStats: MatchupLineups; seriesGamesStats?: { [key: number]: MatchupLineups } },
  { matchId: number; matchupLineups: MatchupLineups, date: string, seriesGames?: SeriesInfoMLB }
>(
  'simInputs/fetchMlbGamePlayerStats',
  async ({ matchId, matchupLineups, date, seriesGames }) => {
    const seriesGamesStats: { [key: number]: MatchupLineups } = {};

    if (seriesGames) {
      for (const game of Object.values(seriesGames)) {
        const gameMatchupLineups = game.lineups;
        const seriesGameNumber = game.gameInfo.seriesGameNumber;

        const gameStats = await window.electronAPI.fetchMlbGamePlayerStats({ matchupLineups: gameMatchupLineups, date });
        seriesGamesStats[seriesGameNumber] = gameStats;
      }

      const playerStats = seriesGamesStats[1];

      return { matchId, playerStats, seriesGamesStats };
    }

    const playerStats = await window.electronAPI.fetchMlbGamePlayerStats({ matchupLineups, date });
    return { matchId, playerStats };
  }
)

export const fetchMlbGameParkEffects = createAsyncThunk<
  { matchId: number; parkEffects: ParkEffectsResponse },
  { matchId: number; venueId: number; players: Player[] }
>(
  'simInputs/fetchMlbGameParkEffects',
  async ({ matchId, venueId, players }) => {
    const parkEffects = await window.electronAPI.parkEffectsApi({ venueId, players });
    console.log('Park effects:', parkEffects);
    return { matchId, parkEffects };
  }
)

// ---------- Slice ----------

const initialState: SimInputsState = {};

const simInputsSlice = createSlice({
  name: 'simInputs',
  initialState,
  reducers: {
    initializeLeagueSimInputs: (state, action: { payload: LeagueName }) => {
      const league = action.payload;
      if (!state[league]) {
        state[league] = {};
      }
    },
    clearGameData: (state, action: { payload: { league: LeagueName; matchId: number } }) => {
      const { league, matchId } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]) {
        state[league][matchId] = initialMLBGameContainer;
      }
    },

    editMLBLineup: (state, action: { 
      payload: { 
        matchId: number;
        simType: SimType;
        team: 'home' | 'away';
        newLineup: Player[]
      } 
    }) => {
      handleMLBLineupEdit(state, action.payload, (lineups, team, payload) => {
        lineups[team].lineup = payload.newLineup;
      }, (lineups, team, payload) => {
        lineups[team].lineup = payload.newLineup;
      });
    },
    editMLBBench: (state, action: {
      payload: {
        matchId: number;
        simType: SimType;
        team: 'home' | 'away';
        newBench: Player[];
      }
    }) => {
      handleMLBLineupEdit(state, action.payload, (lineups, team, payload) => {
        lineups[team].bench = payload.newBench;
      }, (lineups, team, payload) => {
        lineups[team].bench = payload.newBench;
      });
    },
    editMLBStartingPitcher: (state, action: {
      payload: {
        matchId: number;
        simType: SimType;
        team: 'home' | 'away';
        newStartingPitcher: Player;
      }
    }) => {
      handleMLBLineupEdit(state, action.payload, (lineups, team, payload) => {
        lineups[team].startingPitcher = payload.newStartingPitcher;
      }, (lineups, team, payload) => {
        lineups[team].startingPitcher = payload.newStartingPitcher;
      });
    },
    editMLBBullpen: (state, action: {
      payload: {
        matchId: number;
        simType: SimType;
        team: 'home' | 'away';
        newBullpen: Player[];
      }
    }
    ) => {
      handleMLBLineupEdit(state, action.payload, (lineups, team, payload) => {
        lineups[team].bullpen = payload.newBullpen;
      }, (lineups, team, payload) => {
        lineups[team].bullpen = payload.newBullpen;
      });
    },
    editMLBUnavailablePitchers: (state, action: {
      payload: {
        matchId: number;
        simType: SimType;
        team: 'home' | 'away';
        newUnavailablePitchers: Player[];
      }
    }) => {
      handleMLBLineupEdit(state, action.payload, (lineups, team, payload) => {
        lineups[team].unavailablePitchers = payload.newUnavailablePitchers;
      }, (lineups, team, payload) => {
        lineups[team].unavailablePitchers = payload.newUnavailablePitchers;
      });
    },

    updateMLBPlayerPosition: (state, action: {
      payload: {
        matchId: number;
        team: 'home' | 'away';
        playerId: number;
        position: Position;
      }
    }) => {
      const { matchId, team, playerId, position } = action.payload;
      if (state['MLB']?.[matchId]?.currentGame) {
        const player = state['MLB'][matchId].currentGame.lineups[team].lineup.find(p => p.id === playerId);
        if (player) {
          player.position = position;
        }
        syncCurrentGameEdit(state, matchId);
        state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
      }
    },
    updateTeamLean: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        teamType: 'home' | 'away';
        leanType: 'offense' | 'defense';
        value: number;
      }
    }) => {
      const { league, matchId, teamType, leanType, value } = action.payload;
      
      // Only handle MLB for now
      if (league === 'MLB' && state[league]?.[matchId]?.currentGame) {
        if (leanType === 'offense') {
          state[league][matchId].currentGame.simInputs[teamType].teamHitterLean = value;
        } else {
          state[league][matchId].currentGame.simInputs[teamType].teamPitcherLean = value;
        }
        syncCurrentGameEdit(state, matchId);
      }
    },
    updatePlayerLean: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        teamType: 'home' | 'away';
        playerType: 'hitter' | 'pitcher';
        playerId: number;
        value: number;
      }
    }) => {
      const { league, matchId, teamType, playerType, playerId, value } = action.payload;
      
      // Only handle MLB for now
      if (league === 'MLB' && state[league]?.[matchId]?.currentGame) {
        if (playerType === 'hitter') {
          state[league][matchId].currentGame.simInputs[teamType].individualHitterLeans[playerId] = value;
        } else {
          state[league][matchId].currentGame.simInputs[teamType].individualPitcherLeans[playerId] = value;
        }
        syncCurrentGameEdit(state, matchId);
      }
    },
    switchCurrentSeriesGame: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        gameNumber: number;
      }
    }) => {
      const { league, matchId, gameNumber } = action.payload;
      
      if (league === 'MLB' && state[league]?.[matchId]) {
        const container = state[league][matchId];
        
        // If we're switching to game 1 and there's no series data, keep current game
        if (gameNumber === 1 && !container.seriesGames) {
          return;
        }

        // If we have series data and the requested game exists, switch to it
        if (container.seriesGames?.[gameNumber]) {
          container.currentGame = container.seriesGames[gameNumber];
        }
      }
    },
    updateMLBMarketLines: (state, action: {
      payload: {
          league: LeagueName;
          matchId: number;
          marketLines: MarketLinesMLB;
      }
    }) => {
        const { league, matchId, marketLines } = action.payload;
        if (league === 'MLB' && state[league]?.[matchId]?.currentGame) {
            state[league][matchId].currentGame.gameInfo.bettingBounds = marketLines;
            syncCurrentGameEdit(state, matchId);
        }
    },
    updateMLBAutomatedLeans: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        automatedLeans: MLBGameSimInputs;
      }
    }) => {
      const { league, matchId, automatedLeans } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]?.currentGame) {
        state[league][matchId].currentGame.gameInfo.automatedLeans = automatedLeans;
        syncCurrentGameEdit(state, matchId);
      }
    },
    updateSimMode: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        simType: SimType;
        liveGameData?: MlbLiveDataApiResponse;
      }
    }) => {
      const { league, matchId, simType, liveGameData } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]) {
        state[league][matchId].simMode = simType;
        if (simType === 'custom' && state[league][matchId].currentGame) {
          if (!state[league][matchId].customModeData) {
            console.log('Initializing custom mode data');
            if (liveGameData) {
              console.log('Creating custom mode data with live game data');
              const newGameState = createCustomModeData(state[league][matchId].currentGame.lineups, liveGameData);
              state[league][matchId].customModeData = newGameState;
              console.log('Custom mode data created', newGameState);
            } else {
              console.log('Creating custom mode data without live game data');
              state[league][matchId].customModeData = createCustomModeData(state[league][matchId].currentGame.lineups);
            }
          }
        }
      }
    },
    updateCustomModeGameState: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
        gameState: GameStateMLB;
      }
    }) => {
      const { league, matchId, gameState } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]?.customModeData) {
        state[league][matchId].customModeData.gameState = gameState;
      }
    },
    toggleParkEffects: (state, action: {
      payload: {
        league: LeagueName;
        matchId: number;
      }
    }) => {
      const { league, matchId } = action.payload;
      if (league === 'MLB' && state[league]?.[matchId]) {
        state[league][matchId].parkEffectsEnabled = !state[league][matchId].parkEffectsEnabled;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ---------- Fetch MLB Game Data ----------
      .addCase(fetchMlbGameData.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (!state['MLB']) {
          state['MLB'] = {};
        }
        if (!state['MLB']?.[matchId]) {
          state['MLB'][matchId] = initialMLBGameContainer;
        }
        
        // Create a copy of the current state to allow for direct assignment
        const newState = { 
          ...state['MLB'][matchId],
          gameDataError: null,
          gameDataStatus: 'loading' as 'loading'
        };
        
        state['MLB'][matchId] = newState;
      })
      .addCase(fetchMlbGameData.fulfilled, (state, action) => {
        const { matchId, gameData } = action.payload;

        if (state['MLB']?.[matchId]) {
          const newGame = formatResponseAsGameInputs(gameData.currentGame);
          state['MLB'][matchId].currentGame = newGame;

          if (gameData.seriesGames) {
            if (!state['MLB'][matchId].seriesGames) {
              state['MLB'][matchId].seriesGames = {};
            }

            for (const [seriesGameNumber, gameStats] of Object.entries(gameData.seriesGames)) {
              const newGame = formatResponseAsGameInputs(gameStats);
              state['MLB'][matchId].seriesGames[Number(seriesGameNumber)] = newGame;
            }
          }

          state['MLB'][matchId].gameDataStatus = 'succeeded';
          state['MLB'][matchId].gameDataError = null;
        }
      })
      .addCase(fetchMlbGameData.rejected, (state, action) => {
        const { matchId } = action.meta.arg;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].gameDataStatus = 'failed';
          state['MLB'][matchId].gameDataError = action.error.message ?? 'Failed to fetch game data';
        }
      })
      // ---------- Fetch MLB Game Player Stats ----------
      .addCase(fetchMlbGamePlayerStats.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        // It should have already loaded by now
        // Just set state to loading and error to null
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].statsError = null;
          state['MLB'][matchId].statsStatus = 'loading';
        }
        
      })
      .addCase(fetchMlbGamePlayerStats.fulfilled, (state, action) => {
        const { matchId, playerStats, seriesGamesStats } = action.payload;
        if (state['MLB']?.[matchId]?.currentGame) {
          state['MLB'][matchId].statsStatus = 'succeeded';
          state['MLB'][matchId].statsError = null;
          state['MLB'][matchId].currentGame.lineups = playerStats;

          if (seriesGamesStats && state['MLB'][matchId].seriesGames) {
            for (const [seriesGameNumber, gameStats] of Object.entries(seriesGamesStats)) {
              state['MLB'][matchId].seriesGames[Number(seriesGameNumber)].lineups = gameStats;
            }
          }
        }
      })
      .addCase(fetchMlbGamePlayerStats.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].statsStatus = 'failed';
          state['MLB'][matchId].statsError = action.error.message ?? 'Failed to fetch player stats';
        }
      })
      // ---------- Fetch MLB Game Park Effects ----------
      .addCase(fetchMlbGameParkEffects.pending, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].parkEffectsError = null;
          state['MLB'][matchId].parkEffectsStatus = 'loading';
        }
      })
      .addCase(fetchMlbGameParkEffects.fulfilled, (state, action) => {
        const { matchId, parkEffects } = action.payload;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].parkEffectsStatus = 'succeeded';
          state['MLB'][matchId].parkEffectsError = null;
          state['MLB'][matchId].parkEffects = parkEffects;
          state['MLB'][matchId].parkEffectsEnabled = true;
        }
      })
      .addCase(fetchMlbGameParkEffects.rejected, (state, action) => {
        const matchId = action.meta.arg.matchId;
        if (state['MLB']?.[matchId]) {
          state['MLB'][matchId].parkEffectsStatus = 'failed';
          state['MLB'][matchId].parkEffectsError = action.error.message ?? 'Failed to fetch park effects';
          state['MLB'][matchId].parkEffectsEnabled = false;
        }
      });
  }
});

// ---------- Actions ----------

export const { 
  clearGameData, 
  editMLBLineup,
  editMLBBench,
  updateMLBPlayerPosition, 
  initializeLeagueSimInputs,
  updateTeamLean,
  updatePlayerLean,
  editMLBStartingPitcher,
  editMLBBullpen,
  editMLBUnavailablePitchers,
  switchCurrentSeriesGame,
  updateMLBMarketLines,
  updateMLBAutomatedLeans,
  updateSimMode,
  updateCustomModeGameState,
  toggleParkEffects
} = simInputsSlice.actions;

// ---------- Selectors ----------

export const selectMLBGameContainer = (state: RootState, league: LeagueName, matchId: number): MLBGameContainer | undefined => 
  state.simDash.simInputs[league]?.[matchId];
export const selectTeamInputs = (state: RootState, league: LeagueName, matchId: number): MLBGameSimInputs | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.simInputs;
export const selectGameMetadata = (state: RootState, league: LeagueName, matchId: number): GameMetadataMLB | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.gameInfo;
export const selectGameBettingBounds = (state: RootState, league: LeagueName, matchId: number): MarketLinesMLB | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.gameInfo?.bettingBounds;
export const selectGameAutomatedLeans = (state: RootState, league: LeagueName, matchId: number): MLBGameSimInputs | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.gameInfo?.automatedLeans;
export const selectGameMlbGameId = (state: RootState, league: LeagueName, matchId: number): number | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.gameInfo?.mlbGameId;
export const selectGameLineups = (state: RootState, league: LeagueName, matchId: number): MatchupLineups | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.lineups;
export const selectGameSeriesGames = (state: RootState, league: LeagueName, matchId: number): SeriesInfoMLB | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.seriesGames;
export const selectGameSimMode = (state: RootState, league: LeagueName, matchId: number): SimType | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.simMode;

export const selectGameDataStatus = (state: RootState, league: LeagueName, matchId: number): 'idle' | 'loading' | 'succeeded' | 'failed' => 
  state.simDash.simInputs[league]?.[matchId]?.gameDataStatus ?? 'idle';
export const selectGameDataError = (state: RootState, league: LeagueName, matchId: number): string | null | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.gameDataError;
export const selectGamePlayerStatsStatus = (state: RootState, league: LeagueName, matchId: number): 'idle' | 'loading' | 'succeeded' | 'failed' => 
  state.simDash.simInputs[league]?.[matchId]?.statsStatus ?? 'idle';
export const selectGamePlayerStatsError = (state: RootState, league: LeagueName, matchId: number): string | null | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.statsError;
export const selectGameParkEffectsStatus = (state: RootState, league: LeagueName, matchId: number): 'idle' | 'loading' | 'succeeded' | 'failed' => 
  state.simDash.simInputs[league]?.[matchId]?.parkEffectsStatus ?? 'idle';
export const selectGameParkEffectsError = (state: RootState, league: LeagueName, matchId: number): string | null | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.parkEffectsError;

export const selectGameCustomModeDataLineups = (state: RootState, league: LeagueName, matchId: number): MatchupLineups | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.customModeData?.lineups;
export const selectGameCustomModeDataGameState = (state: RootState, league: LeagueName, matchId: number): GameStateMLB | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.customModeData?.gameState;

export const selectGameParkEffects = (state: RootState, league: LeagueName, matchId: number): ParkEffectsResponse | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.parkEffects;
export const selectParkEffectsEnabled = (state: RootState, league: LeagueName, matchId: number): boolean => 
  state.simDash.simInputs[league]?.[matchId]?.parkEffectsEnabled ?? true;

export default simInputsSlice.reducer;

