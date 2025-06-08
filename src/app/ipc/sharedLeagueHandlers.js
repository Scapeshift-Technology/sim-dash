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

// Legacy getLeaguePeriods handler removed - replaced by getLeaguePeriodTree

// NEW: Handler for fetching complete period tree using recursive CTE
const getLeaguePeriodTree = async (event, { league }, getCurrentPool) => {
    log.info(`IPC received: get-league-period-tree for ${league}`);
    const currentPool = getCurrentPool();
    if (!currentPool) {
        log.error('get-league-period-tree: No active SQL Server connection.');
        throw new Error('Not connected to database.');
    }

    try {
        const query = `
            WITH HierarchyCTE AS (
                -- Base case: root nodes (where Sport_Parent is CHAR(0))
                SELECT
                    LP.Sport, LP.League, LP.SuperPeriodType, LP.SuperPeriodNumber, LP.SubPeriodType, LP.SubPeriodNumber,
                    LP.Sport_Parent, LP.League_Parent, LP.SuperPeriodType_Parent, LP.SuperPeriodNumber_Parent, LP.SubPeriodType_Parent, LP.SubPeriodNumber_Parent,
                    0 AS HierarchyLevel
                FROM dbo.LeaguePeriod LP
                WHERE LP.Sport_Parent = CHAR(0)
                  AND LP.League = @league
            
                UNION ALL
            
                -- Recursive case: children of previous level
                SELECT
                    LP.Sport, LP.League, LP.SuperPeriodType, LP.SuperPeriodNumber, LP.SubPeriodType, LP.SubPeriodNumber,
                    LP.Sport_Parent, LP.League_Parent, LP.SuperPeriodType_Parent, LP.SuperPeriodNumber_Parent, LP.SubPeriodType_Parent, LP.SubPeriodNumber_Parent,
                    H.HierarchyLevel + 1
                FROM dbo.LeaguePeriod LP
                INNER JOIN HierarchyCTE H
                    ON LP.Sport_Parent = H.Sport
                    AND LP.League_Parent = H.League
                    AND LP.SuperPeriodType_Parent = H.SuperPeriodType
                    AND LP.SuperPeriodNumber_Parent = H.SuperPeriodNumber
                    AND LP.SubPeriodType_Parent = H.SubPeriodType
                    AND LP.SubPeriodNumber_Parent = H.SubPeriodNumber
                WHERE LP.League = @league
            )
            SELECT
                H.HierarchyLevel,
                IIF(H.SubPeriodType = CHAR(0), 'Branch', 'Node') AS TreeType,
                H.Sport,
                H.League, 
                H.SuperPeriodType, 
                H.SuperPeriodNumber, 
                H.SubPeriodType, 
                H.SubPeriodNumber,
                H.Sport_Parent,
                H.League_Parent, 
                H.SuperPeriodType_Parent, 
                H.SuperPeriodNumber_Parent, 
                H.SubPeriodType_Parent, 
                H.SubPeriodNumber_Parent,
                LPSC.PeriodTypeCode, 
                LPSC.PeriodNumber
            FROM HierarchyCTE H
            LEFT JOIN dbo.LeaguePeriodShortcode LPSC
                ON H.Sport = LPSC.Sport
                AND H.League = LPSC.League
                AND H.SuperPeriodType = LPSC.SuperPeriodType
                AND H.SuperPeriodNumber = LPSC.SuperPeriodNumber
                AND H.SubPeriodType = LPSC.SubPeriodType
                AND H.SubPeriodNumber = LPSC.SubPeriodNumber
            ORDER BY H.HierarchyLevel, IIF(H.SubPeriodType = CHAR(0), 0, 1), H.SuperPeriodType, H.SuperPeriodNumber, H.SubPeriodType, H.SubPeriodNumber
        `;

        const request = currentPool.request();
        request.input('league', sql.VarChar, league);

        const result = await request.query(query);
        log.info(`Complete period tree fetched for ${league}:`, result.recordset.length, 'nodes');
        return result.recordset;
    } catch (err) {
        log.error(`Error fetching period tree for ${league}:`, err);
        throw err;
    }
};

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

    // NEW: Tree-based period handler
    ipcMain.handle('get-league-period-tree', (event, { league }) => getLeaguePeriodTree(event, { league }, getCurrentPool));

    // League props handler
    ipcMain.handle('get-league-props', (event, leagueName, propType) => getLeagueProps(event, leagueName, propType, getCurrentPool));

    log.info('Shared league IPC handlers registered');
};

module.exports = {
    registerSharedLeagueHandlers
};
