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

// Initialize the database schema (create table if it doesn't exist)
async function initializeSchema(db) {
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS profiles (
            name TEXT PRIMARY KEY,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            database TEXT NOT NULL,
            user TEXT NOT NULL,
            password TEXT NOT NULL -- Store securely in a real app!
        );
    `;
    try {
        await db.runAsync(createTableSql);
        console.log("'Profiles' table ensured.");
    } catch (err) {
        console.error('Error creating profiles table:', err.message);
        throw err; // Re-throw error to be caught by caller
    }
}

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

module.exports = {
    openDb,
    getProfiles,
    saveProfile,
    deleteProfile
}; 