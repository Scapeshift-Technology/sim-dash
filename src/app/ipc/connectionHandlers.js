const { ipcMain } = require('electron');
const log = require('electron-log/main');
const { getProfiles } = require('../../db-sqlite/tables/profiles');
const { connectToSqlServer } = require('../profiles/connectionUtils');

// ---------- Handlers ----------

/**
 * Handle reconnection to database using stored credentials
 * @param {*} event 
 * @param {*} args - Should contain { username: string }
 * @param {*} getDbHelper 
 * @param {*} getDb 
 * @param {*} getCurrentPool 
 * @param {*} setCurrentPool - Function to update the current pool
 */
async function handleReconnectToDb(event, args, getDbHelper, getDb, getCurrentPool, setCurrentPool) {
    const { username } = args;
    log.info(`[Reconnection] Attempting to reconnect user: ${username}`);

    try {
        // Get SQLite database instance
        const db = getDb();
        
        // Fetch stored profiles from SQLite
        const profiles = await getProfiles(db);
        const userProfile = profiles.find(profile => profile.user === username);

        if (!userProfile) {
            log.error(`[Reconnection] No stored profile found for user: ${username}`);
            return { success: false, error: 'No stored credentials found for user' };
        }

        // Use shared connection utility
        const result = await connectToSqlServer(userProfile, getCurrentPool(), 'Reconnection');

        if (result.success) {
            // Update the current pool
            setCurrentPool(result.pool);
            return { success: true, username: result.username };
        } else {
            return { success: false, error: result.error };
        }

    } catch (err) {
        log.error('[Reconnection] Unexpected error:', err);
        return { success: false, error: err.message };
    }
}

// ---------- Main registration function ----------

/**
 * Register all connection-related IPC handlers
 * @param {Object} params - Parameters needed for handler registration
 * @param {Function} params.getDbHelper - Function to get database helper instance
 * @param {Function} params.getDb - Function to get database instance
 * @param {Function} params.getCurrentPool - Function to get current SQL Server connection pool
 * @param {Function} params.setCurrentPool - Function to set current SQL Server connection pool
 */
const registerConnectionHandlers = ({ getDbHelper, getDb, getCurrentPool, setCurrentPool }) => {
    // Handler to reconnect to the database
    ipcMain.handle('reconnect-to-db', (event, args) => handleReconnectToDb(event, args, getDbHelper, getDb, getCurrentPool, setCurrentPool));

    log.info('DB Connection IPC handlers registered');
};

module.exports = {
    registerConnectionHandlers
};

