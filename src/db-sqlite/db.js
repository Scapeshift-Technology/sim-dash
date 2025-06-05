// ---------- Database Index / Aggregator ----------

const { openDb } = require('./connection');
const { getProfiles, saveProfile, deleteProfile } = require('./tables/profiles');
const { saveSimHistory, getSimHistory, getSimData } = require('./tables/simHistory');
const { 
    getLeagueStrikeConfigurations,
    getStrikeConfiguration, 
    saveStrikeConfiguration,
    setActiveStatCaptureConfiguration,
    getActiveStatCaptureConfiguration 
} = require('./tables/statCaptureConfig');

// ---------- Exports ----------
module.exports = {
    // Connection
    openDb,
    // Profiles table
    getProfiles,
    saveProfile,
    deleteProfile,
    // Sim history table
    saveSimHistory,
    getSimHistory,
    getSimData,
    // Strike configuration tables
    getLeagueStrikeConfigurations,
    getStrikeConfiguration,
    saveStrikeConfiguration,
    setActiveStatCaptureConfiguration,
    getActiveStatCaptureConfiguration
};
