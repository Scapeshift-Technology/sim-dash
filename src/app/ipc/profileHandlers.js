const { ipcMain } = require('electron');
const log = require('electron-log/main');

/**
 * Profile Management Handlers
 * Handlers for managing user profiles in SQLite database
 */

// Handler for saving a profile
const handleSaveProfile = async (event, profile, getDbHelper, getDb) => {
    log.info('IPC received: save-profile');
    const db = getDb();
    if (!db) {
        log.error('save-profile: No active SQLite database connection.');
        return false;
    }
    try {
        const dbHelper = getDbHelper();
        await dbHelper.saveProfile(db, profile);
        log.info('Profile saved successfully');
        return true;
    } catch (err) {
        log.error('Error saving profile:', err);
        return false;
    }
};

// Handler for getting all profiles
const handleGetProfiles = async (event, getDbHelper, getDb) => {
    log.info('IPC received: get-profiles');
    const db = getDb();
    if (!db) {
        log.error('get-profiles: No active SQLite database connection.');
        return [];
    }
    try {
        const dbHelper = getDbHelper();
        const profiles = await dbHelper.getProfiles(db);
        log.info(`Retrieved ${profiles.length} profiles`);
        return profiles;
    } catch (err) {
        log.error('Error getting profiles:', err);
        return []; // Return empty on error
    }
};

// Handler for deleting a profile
const handleDeleteProfile = async (event, profileName, getDbHelper, getDb) => {
    log.info(`IPC received: delete-profile for ${profileName}`);
    const db = getDb();
    if (!db) {
        log.error('delete-profile: No active SQLite database connection.');
        return false;
    }
    try {
        const dbHelper = getDbHelper();
        await dbHelper.deleteProfile(db, profileName);
        log.info(`Profile ${profileName} deleted successfully`);
        return true;
    } catch (err) {
        log.error('Error deleting profile:', err);
        return false;
    }
};

/**
 * Register all profile IPC handlers
 * @param {Object} params - Parameters needed for handler registration
 * @param {Function} params.getDbHelper - Function to get database helper
 * @param {Function} params.getDb - Function to get SQLite database connection
 */
const registerProfileHandlers = ({ getDbHelper, getDb }) => {
    // Profile handlers
    ipcMain.handle('get-profiles', (event) => handleGetProfiles(event, getDbHelper, getDb));
    ipcMain.handle('save-profile', (event, profile) => handleSaveProfile(event, profile, getDbHelper, getDb));
    ipcMain.handle('delete-profile', (event, profileName) => handleDeleteProfile(event, profileName, getDbHelper, getDb));

    log.info('Profile IPC handlers registered');
};

module.exports = {
    registerProfileHandlers
};
