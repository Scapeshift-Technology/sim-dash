const { ipcMain } = require('electron');
const log = require('electron-log/main');

// ---------- Handlers ----------

// Handler for fetching league stat capture configurations (list)
const handleFetchLeagueStatCaptureConfigurations = async (event, leagueName, getDbHelper, getDb) => {
    log.info(`IPC received: fetch-league-stat-capture-configurations for ${leagueName}`);

    try {
        const dbHelper = getDbHelper();
        const db = getDb();

        const configs = await dbHelper.getLeagueStrikeConfigurations(db, leagueName);
        
        log.info(`Found ${configs.length} stat capture configurations for league ${leagueName}`);
        return configs;
    } catch (err) {
        log.error(`Error fetching league stat capture configurations for ${leagueName}:`, err);
        throw err;
    }
};

// Handler for fetching complete stat capture configuration with all related data
const handleFetchStatCaptureConfiguration = async (event, configName, getDbHelper, getDb) => {
    log.info(`IPC received: fetch-stat-capture-configuration for ${configName}`);

    try {
        const dbHelper = getDbHelper();
        const db = getDb();

        const completeConfig = await dbHelper.getStrikeConfiguration(db, configName);
        
        log.info(`Fetched complete configuration for ${configName}: ${completeConfig.mainMarkets.length} main markets, ${completeConfig.propsOU.length} OU props, ${completeConfig.propsYN.length} YN props`);
        return completeConfig;
    } catch (err) {
        log.error(`Error fetching stat capture configuration for ${configName}:`, err);
        throw err;
    }
};

const handleSaveStatCaptureConfiguration = async (event, config, getDbHelper, getDb) => {
    log.info(`IPC received: save-stat-capture-configuration for ${config.name}`);
    
    try {
        const dbHelper = getDbHelper();
        const db = getDb();

        const result = await dbHelper.saveStrikeConfiguration(db, config);

        log.info(`Saved stat capture configuration for ${config.name}`);
        return result;
    } catch (err) {
        log.error(`Error saving stat capture configuration for ${config.name}:`, err);
        throw err;
    }
};

const handleSetActiveStatCaptureConfiguration = async (event, configName, leagueName, getDbHelper, getDb) => {
    log.info(`IPC received: set-active-stat-capture-configuration for ${configName} in league ${leagueName}`);

    try {
        const dbHelper = getDbHelper();
        const db = getDb();

        const result = await dbHelper.setActiveStatCaptureConfiguration(db, configName, leagueName);

        log.info(`Set active stat capture configuration for ${configName} in league ${leagueName}`);
        return result;
    } catch (err) {
        log.error(`Error setting active stat capture configuration for ${configName} in league ${leagueName}:`, err);
        throw err;
    }
};

const handleGetActiveStatCaptureConfiguration = async (event, leagueName, getDbHelper, getDb) => {
    log.info(`IPC received: get-active-stat-capture-configuration for ${leagueName}`);

    try {
        const dbHelper = getDbHelper();
        const db = getDb();

        const result = await dbHelper.getActiveStatCaptureConfiguration(db, leagueName);

        log.info(`Fetched active stat capture configuration for ${leagueName}`);
        return result;
    } catch (err) {
        log.error(`Error getting active stat capture configuration for ${leagueName}:`, err);
        throw err;
    }
};

// ---------- Register functions ----------

/**
 * Register all stat capture config IPC handlers
 * @param {Object} params - Parameters needed for handler registration
 * @param {Function} params.getDbHelper - Function to get db helper
 * @param {Function} params.getDb - Function to get db
 */
const registerStatCaptureConfigHandlers = ({ getDbHelper, getDb }) => {
    // League stat capture configurations handlers
    ipcMain.handle('fetch-league-stat-capture-configurations', (event, leagueName) => 
        handleFetchLeagueStatCaptureConfigurations(event, leagueName, getDbHelper, getDb));
    
    // Complete stat capture configuration handler
    ipcMain.handle('fetch-stat-capture-configuration', (event, configName) => 
        handleFetchStatCaptureConfiguration(event, configName, getDbHelper, getDb));

    // Save stat capture configuration handler
    ipcMain.handle('save-stat-capture-configuration', (event, config) => 
        handleSaveStatCaptureConfiguration(event, config, getDbHelper, getDb));

    // Set active stat capture configuration handler
    ipcMain.handle('set-active-stat-capture-configuration', (event, configName, leagueName) => 
        handleSetActiveStatCaptureConfiguration(event, configName, leagueName, getDbHelper, getDb));

    // Get active stat capture configuration handler
    ipcMain.handle('get-active-stat-capture-configuration', (event, leagueName) => 
        handleGetActiveStatCaptureConfiguration(event, leagueName, getDbHelper, getDb));

    log.info('Stat capture config IPC handlers registered');
};

module.exports = {
    registerStatCaptureConfigHandlers
};