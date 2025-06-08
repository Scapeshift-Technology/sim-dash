// ---------- Sim history table functions ----------

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
        console.error('[simHistory.js] Error fetching sim history from SQLite:', err.message);
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

// ---------- Exports ----------

module.exports = {
    saveSimHistory,
    getSimHistory,
    getSimData
};
