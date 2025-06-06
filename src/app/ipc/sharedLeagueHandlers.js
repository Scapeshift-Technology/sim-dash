const { ipcMain } = require('electron');
const log = require('electron-log/main');
const sql = require('mssql'); // Add SQL Server driver import

/**
 * Shared League Data Handlers
 * Handlers for fetching and managing data common across all leagues
 */

// Handler for fetching available leagues
const handleFetchLeagues = async (event, getCurrentPool) => {
    log.info('IPC received: fetch-leagues');
    const currentPool = getCurrentPool();
    if (!currentPool) {
        log.error('fetch-leagues: No active SQL Server connection.');
        return []; // Return empty array if not connected
    }
    try {
        // Ensure the query matches the actual view/table and columns
        const result = await currentPool.request().query(`SELECT League FROM dbo.League_V WHERE League IN ('MLB', 'NBA') ORDER BY League`);

        log.info('Leagues fetched:', result.recordset);
        return result.recordset;
    } catch (err) {
        log.error('Error fetching leagues from SQL Server:', err);
        return []; // Return empty array on error
    }
};

// Handler for fetching schedule data
const handleFetchSchedule = async (event, { league, date }, getCurrentPool) => {
    log.info(`IPC received: fetch-schedule for ${league} on ${date}`);
    const currentPool = getCurrentPool();
    if (!currentPool) {
        log.error('fetch-schedule: No active SQL Server connection.');
        throw new Error('Not connected to database.'); // Throw error to be caught by renderer
    }
    if (!league || !date) {
        log.error('fetch-schedule: Missing league or date parameter.');
        throw new Error('League and date are required.');
    }

    try {
        // Basic columns common to all leagues
        let columns = 'Match,PostDtmUTC, Participant1, Participant2';
        // Add MLB-specific columns
        if (league === 'MLB') {
            columns += ', DaySequence';
        }

        const query = `
            SELECT ${columns}
            FROM dbo.Match_V
            WHERE League = @league
            AND ScheduledDate = @date -- Assuming PostDtmUTC should be compared date-wise
            ORDER BY PostDtmUTC ASC -- Or DaySequence for MLB if needed? TBD
        `; // Note: Using CAST(... AS DATE) might impact performance. Consider dedicated ScheduledDate column if available.

        const request = currentPool.request();
        request.input('league', sql.VarChar, league);
        request.input('date', sql.Date, date); // Send date as Date type

        const result = await request.query(query);

        log.info(`Schedule fetched for ${league} on ${date}:`, result.recordset.length, 'matches');
        return result.recordset; // Return the array of matches
    } catch (err) {
        log.error(`Error fetching schedule for ${league} on ${date}:`, err);
        throw err; // Rethrow the error to be handled by the renderer
    }
};

// Handler for fetching league periods
const getLeaguePeriods = async (event, leagueName, getCurrentPool) => {
    log.info(`IPC received: get-league-periods for ${leagueName}`);
    const currentPool = getCurrentPool();
    if (!currentPool) {
        log.error('get-league-periods: No active SQL Server connection.');
        throw new Error('Not connected to database.'); // Throw error to be caught by renderer
    }

    try {
        // fetch the actual periods
        const result = await currentPool.request().query(`
            SELECT TRIM(SuperPeriodType) AS SuperPeriodType
                , SuperPeriodNumber
                , TRIM(PeriodTypeCode) AS PeriodTypeCode
                , PeriodNumber
                , TRIM(IIF(SubPeriodType = CHAR(0), SuperPeriodType, SubPeriodType)) AS PeriodName
            FROM LeaguePeriodShortcode
            WHERE league = '${leagueName}'
        `);

        // Potentially add special periods
        let results = result.recordset;
        if (leagueName === 'MLB') {
            results = [...results, ...specialMLBPeriods];
        }

        // Return the results
        return results;
    } catch (err) {
        log.error(`Error fetching league periods for ${leagueName}:`, err);
        throw err; // Rethrow the error to be caught by the renderer
    }
};

const specialMLBPeriods = [
    {
        SuperPeriodType: 'Half',
        SuperPeriodNumber: 1,
        PeriodTypeCode: 'I',
        PeriodNumber: 99, // Used because no inning 99 is used elsewhere. This will need to be transformed across the app.
        PeriodName: 'Innings 1-3'
    }
];

const getLeagueProps = async (event, leagueName, propType, getCurrentPool) => {
    log.info(`IPC received: get-league-props for ${leagueName} with prop type ${propType}`);
    const currentPool = getCurrentPool();
    if (!currentPool) {
        log.error('get-league-props: No active SQL Server connection.');
        throw new Error('Not connected to database.');
    }

    try {
        // Fetch the actual props
        const result = await currentPool.request().query(`
            SELECT TRIM(ContestantType) AS ContestantType
                , TRIM(Prop) AS Prop
            FROM dbo.PropSportContestantType PSCT
            WHERE EXISTS(
                SELECT 1
                FROM dbo.League L
                WHERE L.Sport = PSCT.Sport
                    AND L.League = '${leagueName}'
                )
            AND EXISTS(
                SELECT 1
                FROM dbo.Prop P
                WHERE P.Prop = PSCT.Prop
                    AND P.PropType = '${propType}'
                )
        `);

        return result.recordset;
    } catch (err) {
        log.error(`Error fetching league ${propType} props for ${leagueName}:`, err);
        throw err; // Rethrow the error to be caught by the renderer
    }
};

// ---------- Register the handlers ----------

/**
 * Register all shared league IPC handlers
 * @param {Object} params - Parameters needed for handler registration
 * @param {Function} params.getCurrentPool - Function to get current SQL Server connection pool
 */
const registerSharedLeagueHandlers = ({ getCurrentPool }) => {
    // League Data Handler
    ipcMain.handle('fetch-leagues', (event) => handleFetchLeagues(event, getCurrentPool));

    // Schedule handler
    ipcMain.handle('fetch-schedule', (event, { league, date }) => handleFetchSchedule(event, { league, date }, getCurrentPool));

    // League periods handler
    ipcMain.handle('get-league-periods', (event, leagueName) => getLeaguePeriods(event, leagueName, getCurrentPool));

    // League props handler
    ipcMain.handle('get-league-props', (event, leagueName, propType) => getLeagueProps(event, leagueName, propType, getCurrentPool));

    log.info('Shared league IPC handlers registered');
};

module.exports = {
    registerSharedLeagueHandlers
};
