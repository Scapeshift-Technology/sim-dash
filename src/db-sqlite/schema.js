// ---------- Tables statements ----------

async function initializeSchema(db) {
    const createTableStatements = [
        // Profiles table
        `CREATE TABLE IF NOT EXISTS profiles (
            name TEXT PRIMARY KEY,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            database TEXT NOT NULL,
            user TEXT NOT NULL,
            password TEXT NOT NULL -- Store securely in a real app!
        );`,
        // Create a table for the sim history
        `CREATE TABLE IF NOT EXISTS sim_history (
          match_id INTEGER NOT NULL,
          timestamp DATETIME NOT NULL,
          sim_results TEXT NOT NULL,  -- JSON column 
          input_data TEXT NOT NULL,   -- JSON column for league-specific input data
          PRIMARY KEY (match_id, timestamp),
          FOREIGN KEY (match_id) REFERENCES Match_V(Match)
        );`,

        // Create a saved stat capture config table
        `CREATE TABLE IF NOT EXISTS strike_configuration (
          name TEXT PRIMARY KEY,
          league TEXT NOT NULL
         );`,

        // Create a table to track which config is active per league
        `CREATE TABLE IF NOT EXISTS strike_configuration_league_active (
          league TEXT PRIMARY KEY,
          active_config_name TEXT NOT NULL,
          FOREIGN KEY (active_config_name) REFERENCES strike_configuration(name) ON DELETE CASCADE
         );`,

        `CREATE TABLE IF NOT EXISTS strike_configuration_main_markets (
            name TEXT NOT NULL,
            market_type TEXT CHECK (market_type IN ('Spread', 'Total', 'TeamTotal')) NOT NULL,
            period_type_code TEXT NOT NULL,
            period_number INTEGER NOT NULL,
            strike REAL NOT NULL,
            PRIMARY KEY (name, market_type, period_type_code, period_number, strike),
            FOREIGN KEY (name) REFERENCES strike_configuration(name) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS strike_configuration_props_ou (
          name TEXT NOT NULL,
          prop TEXT NOT NULL,
          contestant_type TEXT CHECK (contestant_type IN ('Individual', 'TeamLeague')) NOT NULL,
          strike REAL NOT NULL,
          PRIMARY KEY (name, prop, contestant_type, strike),
          FOREIGN KEY (name) REFERENCES strike_configuration(name) ON DELETE CASCADE
        );`,

        `CREATE TABLE IF NOT EXISTS strike_configuration_props_yn (
          name TEXT NOT NULL,
          prop TEXT NOT NULL,
          contestant_type TEXT CHECK (contestant_type IN ('Individual', 'TeamLeague')) NOT NULL,
          PRIMARY KEY (name, prop, contestant_type),
          FOREIGN KEY (name) REFERENCES strike_configuration(name) ON DELETE CASCADE
        );`,

        `CREATE INDEX IF NOT EXISTS idx_strike_config_league ON strike_configuration(league);
        CREATE INDEX IF NOT EXISTS idx_strike_config_league_active ON strike_configuration_league_active(league);
        CREATE INDEX IF NOT EXISTS idx_main_markets_market_type ON strike_configuration_main_markets(market_type);
        CREATE INDEX IF NOT EXISTS idx_main_markets_period ON strike_configuration_main_markets(period_type_code, period_number);
        CREATE INDEX IF NOT EXISTS idx_props_ou_prop ON strike_configuration_props_ou(prop);
        CREATE INDEX IF NOT EXISTS idx_props_ou_contestant_type ON strike_configuration_props_ou(contestant_type);
        CREATE INDEX IF NOT EXISTS idx_props_yn_prop ON strike_configuration_props_yn(prop);
        CREATE INDEX IF NOT EXISTS idx_props_yn_contestant_type ON strike_configuration_props_yn(contestant_type);`
    ];
    try {
        for (const sql of createTableStatements) {
            await db.runAsync(sql);
        }
        console.log("All database tables ensured.");
        
        // Add default stat capture configuration if it doesn't exist
        await addDefaultConfiguration(db);
    } catch (err) {
        console.error('Error creating database tables:', err.message);
        throw err; // Re-throw error to be caught by caller
    }
}

// ---------- Helper functions ----------

async function addDefaultConfiguration(db) {
    try {
        // Check if default configuration already exists
        const existingConfig = await new Promise((resolve, reject) => {
            db.get(`
                SELECT name 
                FROM strike_configuration 
                WHERE name = 'default'`, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingConfig) {
            return;
        }

        // Insert default configuration
        await db.runAsync(
            "INSERT INTO strike_configuration (name, league) VALUES ('default', 'MLB')"
        );

        await db.runAsync(
            "INSERT INTO strike_configuration_league_active (league, active_config_name) VALUES ('MLB', 'default')"
        );

        // Define the default main markets data
        const defaultMainMarkets = [
            // Spread - Full game (M, 0): 0, 1.5
            { marketType: 'Spread', periodTypeCode: 'M', periodNumber: 0, strike: 0 },
            { marketType: 'Spread', periodTypeCode: 'M', periodNumber: 0, strike: 1.5 },
            // Spread - Half 1 (H, 1): 0, 1.5
            { marketType: 'Spread', periodTypeCode: 'H', periodNumber: 1, strike: 0 },
            { marketType: 'Spread', periodTypeCode: 'H', periodNumber: 1, strike: 1.5 },
            
            // Totals - Full game (M, 0): 6.5 - 11.5
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 6.5 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 7.0 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 7.5 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 8.0 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 8.5 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 9.0 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 9.5 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 10.0 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 10.5 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 11.0 },
            { marketType: 'Total', periodTypeCode: 'M', periodNumber: 0, strike: 11.5 },
            
            // Totals - H1 (H, 1): 2.5 - 8.5
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 2.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 3.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 3.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 4.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 4.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 5.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 5.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 6.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 6.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 7.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 7.5 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 8.0 },
            { marketType: 'Total', periodTypeCode: 'H', periodNumber: 1, strike: 8.5 },
            
            // TeamTotals - Full game (M, 0): 2 - 8.5
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 2.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 2.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 3.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 3.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 4.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 4.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 5.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 5.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 6.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 6.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 7.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 7.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 8.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'M', periodNumber: 0, strike: 8.5 },
            
            // TeamTotals - H1 (H, 1): 0.5 - 4
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 0.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 1.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 1.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 2.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 2.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 3.0 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 3.5 },
            { marketType: 'TeamTotal', periodTypeCode: 'H', periodNumber: 1, strike: 4.0 }
        ];

        // Insert all default main markets
        for (const market of defaultMainMarkets) {
            await db.runAsync(
                `INSERT INTO strike_configuration_main_markets 
                 (name, market_type, period_type_code, period_number, strike)
                 VALUES ('default', ?, ?, ?, ?)`,
                [market.marketType, market.periodTypeCode, market.periodNumber, market.strike]
            );
        }

        console.log(`Default configuration created with ${defaultMainMarkets.length} main market entries.`);
    } catch (err) {
        console.error('Error creating default configuration:', err.message);
        throw err;
    }
}

// ---------- Exports ----------

module.exports = {
    initializeSchema,
    addDefaultConfiguration
};
