const { ipcMain, BrowserWindow } = require('electron');
const { getGameDataMLB } = require('../../services/mlb/external/gameData');
const { getPlayerStatsMLB } = require('../../services/mlb/db/playerStats');
const { runParallelSimulation } = require('../../services/mlb/workers/workerPool');
const { getMlbGameApiGame } = require('../../services/mlb/external/mlbApi');
const log = require('electron-log/main');

/**
 * MLB Game Data Handlers
 * Handlers for fetching and managing MLB game data
 */

// ---------- Fetching data ----------

// Handler for fetching MLB game data
const handleFetchMLBGameData = async (event, { league, date, participant1, participant2, daySequence }) => {
    log.info(`fetch-mlb-data: Request for ${league} ${participant1}@${participant2} on ${date}`);
    
    if (league !== 'MLB') {
        log.error('fetch-mlb-data: Called for non-MLB league:', league);
        throw new Error('Game data is only available for MLB at this time.');
    }

    if (!date || !participant1 || !participant2) {
        log.error('fetch-mlb-data: Missing required parameters.');
        throw new Error('Date, participant1, and participant2 are required for MLB game data.');
    }

    try {
        const gameData = await getGameDataMLB(date, participant1, participant2, daySequence);
        log.info(`Game data generated for ${participant1}@${participant2} ${daySequence ? `#${daySequence}` : ''} on ${date}`);
        return gameData;
    } catch (err) {
        log.error(`Error fetching/generating MLB game data for ${participant1}@${participant2} on ${date}:`, err);
        throw err;
    }
};

// Handler for fetching MLB player stats
const handleFetchMLBPlayerStats = async (event, { matchupLineups, date }, getCurrentPool) => {
    log.info('Fetching MLB player stats');
    try {
        const currentPool = getCurrentPool();
        if (!currentPool) {
            throw new Error('No active SQL Server connection.');
        }
        const refinedMatchupLineups = await getPlayerStatsMLB(matchupLineups, date, currentPool);
        return refinedMatchupLineups;
    } catch (err) {
        log.error('Error fetching MLB player stats:', err);
        throw err;
    }
};

// ---------- Live data (MLB) ----------

// Handler for connecting to MLB WebSocket
const handleConnectToWebSocket = async (event, { gameId }, getMlbWebSocketManager) => {
    log.info(`Connecting to MLB WebSocket for game ${gameId}`);
    const mlbWebSocketManager = getMlbWebSocketManager();
    if (!mlbWebSocketManager) {
        const error = new Error('WebSocket manager not initialized');
        log.error(error);
        throw error;
    }
    try {
        await mlbWebSocketManager.connectToGame(gameId);
        return { success: true };
    } catch (err) {
        log.error('Error connecting to MLB WebSocket:', err);
        throw err;
    }
};

// Handler for disconnecting from MLB WebSocket
const handleDisconnectFromWebSocket = async (event, { gameId }, getMlbWebSocketManager) => {
    log.info(`Disconnecting from MLB WebSocket for game ${gameId}`);
    const mlbWebSocketManager = getMlbWebSocketManager();
    if (!mlbWebSocketManager) {
        const error = new Error('WebSocket manager not initialized');
        log.error(error);
        throw error;
    }
    try {
        await mlbWebSocketManager.disconnectFromGame(gameId);
        return { success: true };
    } catch (err) {
        log.error('Error disconnecting from MLB WebSocket:', err);
        throw err;
    }
};

// Handler for fetching initial MLB live data
const handleFetchInitialMLBLiveData = async (event, { gameId }) => {
    log.info(`Fetching initial MLB live data for game ${gameId}`);
    try {
        return await getMlbGameApiGame(gameId);
    } catch (err) {
        log.error('Error fetching initial MLB live data:', err);
        throw err;
    }
};

// Handler for hitting park effects api
const handleParkEffectsApi = async (event, args) => {    
    try {
        const response = await fetch('http://127.0.0.1:8000/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                venueId: args.venueId,
                players: args.players,
                weather: args.weather
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

// ---------- Simulations ----------

// Handler for simulating MLB matchups
const handleSimulateMatchup = async (event, { numGames, matchupLineups, gameId, statCaptureConfig, liveGameData, parkEffects }) => {
    if (gameId) {
        log.info(`Simulating ${numGames} MLB games - Game ${gameId}`);
    } else {
        log.info(`Simulating ${numGames} MLB games`);
    }

    try {
        return await runParallelSimulation(matchupLineups, numGames, statCaptureConfig, liveGameData, parkEffects);
    } catch (err) {
        log.error('Error simulating MLB matchup:', err);
        throw err;
    }
};

// Handler for getting MLB simulation data
const handleGetMLBSimData = async (event, getDbHelper, getDb) => {
    log.info('Fetching MLB simulation data');
    try {
        // Get the BrowserWindow instance that sent the request
        const window = BrowserWindow.fromWebContents(event.sender);
        
        if (!window) {
            const error = new Error('Could not find window that sent the request');
            log.error(error);
            throw error;
        }

        const properties = window.simProperties;
        const matchupId = properties.simMatchupId;
        const timestamp = properties.simTimestamp;
        const awayTeamName = properties.simAwayTeamName;
        const homeTeamName = properties.simHomeTeamName;
        const daySequence = properties.simDaySequence; // number | undefined

        const dbHelper = getDbHelper();
        const db = getDb();

        const simData = await dbHelper.getSimData(db, matchupId, timestamp);
        return {
            simData: simData.simData,
            inputData: simData.inputData,
            matchId: matchupId,
            timestamp,
            awayTeamName,
            homeTeamName,
            daySequence
        };
    } catch (err) {
        log.error('Error getting MLB simulation data:', err);
        throw err;
    }
};

// ---------- Main registration function ----------

/**
 * Register all MLB-related IPC handlers
 * @param {Object} params - Parameters needed for handler registration
 * @param {Function} params.getMlbWebSocketManager - Function to get MLB WebSocket manager instance
 * @param {Function} params.getDbHelper - Function to get database helper instance
 * @param {Function} params.getDb - Function to get database instance
 * @param {Function} params.getCurrentPool - Function to get current SQL Server connection pool
 */
const registerMLBHandlers = ({ getMlbWebSocketManager, getDbHelper, getDb, getCurrentPool }) => {
    // Game Data Handlers
    ipcMain.handle('fetch-mlb-game-data', handleFetchMLBGameData);
    ipcMain.handle('fetch-mlb-game-player-stats', (event, args) => handleFetchMLBPlayerStats(event, args, getCurrentPool));

    // WebSocket Handlers
    ipcMain.handle('connect-to-web-socket-mlb', (event, args) => 
        handleConnectToWebSocket(event, args, getMlbWebSocketManager));
    ipcMain.handle('disconnect-from-web-socket-mlb', (event, args) => 
        handleDisconnectFromWebSocket(event, args, getMlbWebSocketManager));
    ipcMain.handle('fetch-initial-mlb-live-data', (event, args) => 
        handleFetchInitialMLBLiveData(event, args));

    // Simulation Handlers
    ipcMain.handle('simulate-matchup-mlb', handleSimulateMatchup);
    ipcMain.handle('get-mlb-sim-data', (event) => handleGetMLBSimData(event, getDbHelper, getDb));

    // Park Effects API
    ipcMain.handle('park-effects-api', (event, args) => handleParkEffectsApi(event, args));

    log.info('MLB IPC handlers registered');
};

module.exports = {
    registerMLBHandlers
};
