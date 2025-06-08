const sqlite3 = require('sqlite3').verbose();
const { initializeSchema } = require('./schema');

// ---------- Helper functions ----------

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

// ---------- Exports ----------

module.exports = {
    openDb
};
