const sql = require('mssql');
const log = require('electron-log/main');

// ---------- Functions ----------

/**
 * Build SQL Server connection configuration
 * @param {Object} config - Connection parameters
 * @param {string} config.user - Database user
 * @param {string} config.password - Database password  
 * @param {string} config.host - Server host
 * @param {string} config.database - Database name
 * @param {string|number} config.port - Server port
 * @returns {Object} SQL Server connection configuration
 */
function buildSqlConfig(config) {
    return {
        user: config.user,
        password: config.password,
        server: config.host,
        database: config.database,
        port: parseInt(config.port, 10),
        options: {
            encrypt: true,
            trustServerCertificate: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };
}

/**
 * Close existing connection pool safely
 * @param {Object} currentPool - Current SQL Server connection pool
 * @param {string} context - Context for logging (e.g., 'Login', 'Reconnection')
 * @returns {Promise<void>}
 */
async function closeExistingPool(currentPool, context = 'Connection') {
    if (currentPool) {
        try {
            log.info(`[${context}] Closing previous connection pool.`);
            await currentPool.close();
            log.info(`[${context}] Previous connection pool closed.`);
        } catch (err) {
            log.error(`[${context}] Error closing previous connection pool:`, err);
        }
    }
}

/**
 * Establish SQL Server connection and verify with username query
 * @param {Object} sqlConfig - SQL Server configuration from buildSqlConfig
 * @param {string} context - Context for logging (e.g., 'Login', 'Reconnection')
 * @returns {Promise<{success: boolean, pool?: Object, username?: string, error?: string}>}
 */
async function establishConnection(sqlConfig, context = 'Connection') {
    try {
        // Connect using the SQL config
        const newPool = await new sql.ConnectionPool(sqlConfig).connect();
        log.info(`[${context}] Connected to SQL Server.`);

        // Test connection with SELECT SUSER_SNAME()
        const result = await newPool.request().query('SELECT SUSER_SNAME() AS username');

        if (result.recordset && result.recordset.length > 0) {
            const username = result.recordset[0].username;
            log.info(`[${context}] SQL Server User: ${username}`);
            return { success: true, pool: newPool, username };
        } else {
            log.error(`[${context}] Could not retrieve username after connection.`);
            await newPool.close();
            return { success: false, error: 'Could not verify connection.' };
        }

    } catch (err) {
        log.error(`[${context}] Connection error:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Complete connection workflow: close existing, establish new, verify
 * @param {Object} config - Connection parameters  
 * @param {Object} currentPool - Current connection pool to close
 * @param {string} context - Context for logging
 * @returns {Promise<{success: boolean, pool?: Object, username?: string, error?: string}>}
 */
async function connectToSqlServer(config, currentPool, context = 'Connection') {
    // Close existing connection
    await closeExistingPool(currentPool, context);
    
    // Build configuration
    const sqlConfig = buildSqlConfig(config);
    
    // Establish new connection
    return await establishConnection(sqlConfig, context);
}

// ---------- Exports ----------

module.exports = {
    buildSqlConfig,
    closeExistingPool,
    establishConnection,
    connectToSqlServer
}; 