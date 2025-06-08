// ---------- Profiles table functions ----------

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
                console.log('[profiles.js] Profiles fetched from DB:', maskedRows);
                resolve(rows);
            }
        });
    });
}

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

async function deleteProfile(db, profileName) {
    const sql = `DELETE FROM profiles WHERE name = ?`;
    return db.runAsync(sql, [profileName]);
}

// ---------- Exports ----------

module.exports = {
    getProfiles,
    saveProfile,
    deleteProfile
};
