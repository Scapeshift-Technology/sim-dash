import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { GameMetadataMLB, MarketLinesMLB, MatchupLineups, MLBGameData, MLBGameDataResponse, Player, Position, SeriesInfoMLB } from '@/types/mlb';
import type { 
  MLBGameSimInputs, 
  MLBGameSimInputsTeam, 
  SimInputsState, 
  MLBGameInputs2, 
  MLBGameContainer 
} from '@/types/simInputs';
import { LeagueName } from '@@/types/league';
import { RootState } from '@/store/store';

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
  statsError: null
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
        team: 'home' | 'away'; 
        newLineup: Player[] 
      } 
    }) => {
      const { matchId, team, newLineup } = action.payload;
      if (state['MLB']?.[matchId]?.currentGame) {
        state['MLB'][matchId].currentGame.lineups[team].lineup = newLineup;
        syncCurrentGameEdit(state, matchId);
        state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
      }
    },
    editMLBBench: (state, action: {
      payload: {
        matchId: number;
        team: 'home' | 'away';
        newBench: Player[];
      }
    }) => {
      const { matchId, team, newBench } = action.payload;
      if (state['MLB']?.[matchId]?.currentGame) {
        state['MLB'][matchId].currentGame.lineups[team].bench = newBench;
        syncCurrentGameEdit(state, matchId);
        state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
      }
    },
    editMLBStartingPitcher: (state, action: {
      payload: {
        matchId: number;
        team: 'home' | 'away';
        newStartingPitcher: Player;
      }
    }) => {
      const { matchId, team, newStartingPitcher } = action.payload;
      if (state['MLB']?.[matchId]?.currentGame) {
        state['MLB'][matchId].currentGame.lineups[team].startingPitcher = newStartingPitcher;
        syncCurrentGameEdit(state, matchId);
        state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
      }
    },
    editMLBBullpen: (state, action: {
      payload: {
        matchId: number;
        team: 'home' | 'away';
        newBullpen: Player[];
      }
    }) => {
      const { matchId, team, newBullpen } = action.payload;
      if (state['MLB']?.[matchId]?.currentGame) {
        state['MLB'][matchId].currentGame.lineups[team].bullpen = newBullpen;
        syncCurrentGameEdit(state, matchId);
        state['MLB'][matchId].currentGame.gameInfo.lineupsSource = 'Manual';
      }
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
  switchCurrentSeriesGame,
  updateMLBMarketLines,
  updateMLBAutomatedLeans
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
export const selectGameLineups = (state: RootState, league: LeagueName, matchId: number): MatchupLineups | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.currentGame?.lineups;
export const selectGameSeriesGames = (state: RootState, league: LeagueName, matchId: number): SeriesInfoMLB | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.seriesGames;

export const selectGameDataStatus = (state: RootState, league: LeagueName, matchId: number): 'idle' | 'loading' | 'succeeded' | 'failed' => 
  state.simDash.simInputs[league]?.[matchId]?.gameDataStatus ?? 'idle';
export const selectGameDataError = (state: RootState, league: LeagueName, matchId: number): string | null | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.gameDataError;
export const selectGamePlayerStatsStatus = (state: RootState, league: LeagueName, matchId: number): 'idle' | 'loading' | 'succeeded' | 'failed' => 
  state.simDash.simInputs[league]?.[matchId]?.statsStatus ?? 'idle';
export const selectGamePlayerStatsError = (state: RootState, league: LeagueName, matchId: number): string | null | undefined => 
  state.simDash.simInputs[league]?.[matchId]?.statsError;

export default simInputsSlice.reducer;

