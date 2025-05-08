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
        );`
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
        db.all("SELECT * FROM profiles ORDER BY name", [], (err, rows) => {
            if (err) {
                console.error('Error fetching profiles from SQLite:', err.message);
                reject(err);
            } else {
                console.log('[db.js] Profiles fetched from DB:', rows); // Log fetched rows
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
    db.all("SELECT * FROM sim_history WHERE match_id = ? ORDER BY timestamp", [matchId], (err, rows) => {
      if (err) {
        console.error('Error fetching sim history from SQLite:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
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
    getSimHistory
}; 