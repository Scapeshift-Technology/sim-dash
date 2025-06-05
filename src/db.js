const sqlite3 = require('sqlite3').verbose();

// Helper function to promisify db.run, db.get, db.all
function promisify(db, method) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            db[method](...args, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    // For .run, 'this' contains lastID and changes
                    resolve(method === 'run' ? this : result);
                }
            });
        });
    };
}

// Open the SQLite database
async function openDb(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the SQLite database.');
                // Enable foreign key support if needed (optional)
                // db.run("PRAGMA foreign_keys = ON;");

                // Promisify methods
                db.runAsync = promisify(db, 'run');
                db.getAsync = promisify(db, 'get');
                db.allAsync = promisify(db, 'all');

                // Initialize schema
                initializeSchema(db).then(() => resolve(db)).catch(reject);
            }
        });
    });
}

// Initialize the database schema
async function initializeSchema(db) {
    // Create an array of table creation statements
    const createTableStatements = [
        // Existing profiles table
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
        CREATE INDEX IF NOT EXISTS idx_main_markets_market_type ON strike_configuration_main_markets(market_type);
        CREATE INDEX IF NOT EXISTS idx_main_markets_period ON strike_configuration_main_markets(period_type_code, period_number);
        CREATE INDEX IF NOT EXISTS idx_props_ou_prop ON strike_configuration_props_ou(prop);
        CREATE INDEX IF NOT EXISTS idx_props_ou_contestant_type ON strike_configuration_props_ou(contestant_type);
        CREATE INDEX IF NOT EXISTS idx_props_yn_prop ON strike_configuration_props_yn(prop);
        CREATE INDEX IF NOT EXISTS idx_props_yn_contestant_type ON strike_configuration_props_yn(contestant_type);`
    ];
    try {
        // Execute each table creation statement
        for (const sql of createTableStatements) {
            await db.runAsync(sql);
        }
        console.log("All database tables ensured.");
    } catch (err) {
        console.error('Error creating database tables:', err.message);
        throw err; // Re-throw error to be caught by caller
    }
}

// ---------- Profiles table ----------
// Get all saved profiles
async function getProfiles(db) {
    return new Promise((resolve, reject) => {
        db.all("SELECT name, host, port, database, user, password FROM profiles ORDER BY name", [], (err, rows) => {
            if (err) {
                console.error('Error fetching profiles from SQLite:', err.message);
                reject(err);
            } else {
                // Create a copy with masked passwords for logging
                const maskedRows = rows.map(row => ({
                    ...row,
                    password: '********'
                }));
                console.log('[db.js] Profiles fetched from DB:', maskedRows);
                resolve(rows);
            }
        });
    });
}

// Save or update a profile
async function saveProfile(db, profile) {
    const sql = `
        INSERT INTO profiles (name, host, port, database, user, password)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            host = excluded.host,
            port = excluded.port,
            database = excluded.database,
            user = excluded.user,
            password = excluded.password;
    `;
    // WARNING: Storing passwords in plain text is insecure!
    // In a real application, use OS keyring or other secure storage.
    return db.runAsync(sql, [
        profile.name,
        profile.host,
        profile.port,
        profile.database,
        profile.user,
        profile.password
    ]);
}

// Delete a profile
async function deleteProfile(db, profileName) {
    const sql = `DELETE FROM profiles WHERE name = ?`;
    return db.runAsync(sql, [profileName]);
}

// ---------- Sim history table ----------
// Save a sim history entry
async function saveSimHistory(db, simHistory) {
  const sql = `
    INSERT INTO sim_history (match_id, timestamp, sim_results, input_data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(match_id, timestamp) DO UPDATE SET
      sim_results = excluded.sim_results,
      input_data = excluded.input_data;
  `;
  return db.runAsync(sql, [
    simHistory.matchId,
    simHistory.timestamp,
    JSON.stringify(simHistory.simResults),
    JSON.stringify(simHistory.inputData)
  ]);
} 

// Get a match's sim history
async function getSimHistory(db, matchId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT match_id AS matchId, timestamp, sim_results, input_data
      FROM sim_history 
      WHERE match_id = ? 
      ORDER BY timestamp DESC
    `;
    
    db.all(query, [matchId], (err, rows) => {
      if (err) {
        console.error('[db.js] Error fetching sim history from SQLite:', err.message);
        reject(err);
      } else {
        // Parse the JSON data from the database
        const parsedRows = rows.map(row => ({
          ...row,
          simResults: JSON.parse(row.sim_results),
          inputData: JSON.parse(row.input_data)
        }));
        resolve(parsedRows);
      }
    });
  });
}

// Get sim data
async function getSimData(db, matchupId, timestamp) {
  return new Promise((resolve, reject) => {
    const query = "SELECT match_id, timestamp, sim_results, input_data FROM sim_history WHERE match_id = ? AND timestamp = ?";
    db.get(query, [matchupId, timestamp], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        resolve({
          simData: JSON.parse(row.sim_results),
          inputData: JSON.parse(row.input_data)
        });
      }
    });
  });
}

// ---------- Strike Configuration tables ----------

// Get all strike configurations for a league
async function getLeagueStrikeConfigurations(db, leagueName) {
  return new Promise((resolve, reject) => {
    const query = "SELECT name, league FROM strike_configuration WHERE league = ? ORDER BY name";
    db.all(query, [leagueName], (err, rows) => {
      if (err) {
        console.error('[db.js] Error fetching strike configurations from SQLite:', err.message);
        reject(err);
      } else {
        console.log(`[db.js] Strike configurations fetched for league ${leagueName}:`, rows.length, 'configurations');
        resolve(rows);
      }
    });
  });
}

// Get complete strike configuration with all related data
async function getStrikeConfiguration(db, configName) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get main configuration
      const mainConfig = await new Promise((resolve, reject) => {
        const query = "SELECT name, league FROM strike_configuration WHERE name = ?";
        db.get(query, [configName], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!mainConfig) {
        reject(new Error(`Configuration '${configName}' not found`));
        return;
      }

      // Get main markets
      const mainMarkets = await new Promise((resolve, reject) => {
        const query = `SELECT name
                        , market_type AS marketType
                        , period_type_code AS periodTypeCode
                        , period_number AS periodNumber
                        , strike 
                       FROM strike_configuration_main_markets 
                       WHERE name = ?`;
        db.all(query, [configName], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Get props over/under
      const propsOU = await new Promise((resolve, reject) => {
        const query = `SELECT name
                        , prop
                        , contestant_type AS contestantType
                        , strike 
                       FROM strike_configuration_props_ou 
                       WHERE name = ?`;
        db.all(query, [configName], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Get props yes/no
      const propsYN = await new Promise((resolve, reject) => {
        const query = `SELECT name
                        , prop
                        , contestant_type AS contestantType
                       FROM strike_configuration_props_yn 
                       WHERE name = ?`;
        db.all(query, [configName], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const completeConfig = {
        ...mainConfig,
        mainMarkets,
        propsOU,
        propsYN
      };

      console.log(`[db.js] Complete configuration fetched for ${configName}: ${mainMarkets.length} main markets, ${propsOU.length} OU props, ${propsYN.length} YN props`);
      resolve(completeConfig);
    } catch (err) {
      console.error('[db.js] Error fetching complete strike configuration:', err.message);
      reject(err);
    }
  });
}

// Save strike configuration
async function saveStrikeConfiguration(db, config) {
  return new Promise(async (resolve, reject) => {
    try {
      // Begin transaction
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // 1. Insert/update main configuration
        await new Promise((resolve, reject) => {
          const sql = `
            INSERT INTO strike_configuration (name, league)
            VALUES (?, ?)
            ON CONFLICT(name) DO UPDATE SET
              league = excluded.league
          `;
          db.run(sql, [config.name, config.league], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });

        // 2. Main markets: delete existing, then insert new
        if (config.mainMarkets && config.mainMarkets.length > 0) {
          await new Promise((resolve, reject) => {
            db.run("DELETE FROM strike_configuration_main_markets WHERE name = ?", [config.name], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          for (const market of config.mainMarkets) {
            await new Promise((resolve, reject) => {
              const sql = `
                INSERT INTO strike_configuration_main_markets 
                (name, market_type, period_type_code, period_number, strike)
                VALUES (?, ?, ?, ?, ?)
              `;
              db.run(sql, [config.name, market.marketType, market.periodTypeCode, market.periodNumber, market.strike], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }

        // 3. Props OU: delete existing, then insert new
        if (config.propsOU && config.propsOU.length > 0) {
          await new Promise((resolve, reject) => {
            db.run("DELETE FROM strike_configuration_props_ou WHERE name = ?", [config.name], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          // Insert new
          for (const prop of config.propsOU) {
            await new Promise((resolve, reject) => {
              const sql = `
                INSERT INTO strike_configuration_props_ou 
                (name, prop, contestant_type, strike)
                VALUES (?, ?, ?, ?)
              `;
              db.run(sql, [config.name, prop.prop, prop.contestantType, prop.strike], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }

        // 4. Props YN: delete existing, then insert new
        if (config.propsYN && config.propsYN.length > 0) {
          await new Promise((resolve, reject) => {
            db.run("DELETE FROM strike_configuration_props_yn WHERE name = ?", [config.name], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          for (const prop of config.propsYN) {
            await new Promise((resolve, reject) => {
              const sql = `
                INSERT INTO strike_configuration_props_yn 
                (name, prop, contestant_type)
                VALUES (?, ?, ?)
              `;
              db.run(sql, [config.name, prop.prop, prop.contestantType], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        console.log(`[db.js] Strike configuration '${config.name}' saved successfully`);
        resolve({ success: true, configName: config.name });
      } catch (err) {
        // Rollback transaction on error
        await new Promise((rollbackResolve) => {
          db.run("ROLLBACK", () => rollbackResolve()); // Always resolve rollback
        });
        throw err;
      }
    } catch (err) {
      console.error('[db.js] Error saving strike configuration:', err.message);
      reject(err);
    }
  });
}

// Delete strike configuration (complete implementation)
async function deleteStrikeConfiguration(db, configName) {
  return new Promise(async (resolve, reject) => {
    try {
      // Begin transaction
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Delete main markets
        await new Promise((resolve, reject) => {
          db.run("DELETE FROM strike_configuration_main_markets WHERE name = ?", [configName], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Delete props OU
        await new Promise((resolve, reject) => {
          db.run("DELETE FROM strike_configuration_props_ou WHERE name = ?", [configName], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Delete props YN  
        await new Promise((resolve, reject) => {
          db.run("DELETE FROM strike_configuration_props_yn WHERE name = ?", [configName], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Delete main configuration last
        const result = await new Promise((resolve, reject) => {
          db.run("DELETE FROM strike_configuration WHERE name = ?", [configName], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        console.log(`[db.js] Strike configuration '${configName}' deleted successfully`);
        resolve({ success: true, configName, deletedRows: result.changes });
      } catch (err) {
        // Rollback transaction on error
        await new Promise((rollbackResolve) => {
          db.run("ROLLBACK", () => rollbackResolve()); // Always resolve rollback
        });
        throw err;
      }
    } catch (err) {
      console.error('[db.js] Error deleting strike configuration:', err.message);
      reject(err);
    }
  });
}

// ---------- Export ----------

module.exports = {
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
    deleteStrikeConfiguration
}; 