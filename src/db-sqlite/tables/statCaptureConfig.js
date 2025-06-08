// ---------- Strike Configuration tables ----------

// ---------- Helper functions ----------

// Generic database operation wrapper
function dbOperation(db, method, query, params = []) {
  return new Promise((resolve, reject) => {
    db[method](query, params, function(err, result) {
      if (err) reject(err);
      else resolve(method === 'run' ? this : result);
    });
  });
}

// Transaction wrapper
async function withTransaction(db, operations) {
  await dbOperation(db, 'run', "BEGIN TRANSACTION");
  try {
    const result = await operations();
    await dbOperation(db, 'run', "COMMIT");
    return result;
  } catch (err) {
    await dbOperation(db, 'run', "ROLLBACK").catch(() => {}); // Always resolve rollback
    throw err;
  }
}

// Delete from specific table with condition
async function deleteFromTable(db, tableName, condition, params) {
  const query = `DELETE FROM ${tableName} WHERE ${condition}`;
  const result = await dbOperation(db, 'run', query, params);
  return result;
}

// Insert multiple records into a table
async function insertMultipleRecords(db, tableName, columns, records, valueMapper) {
  if (!records || records.length === 0) return;
  
  const configNameToDelete = records[0].configName;
  
  await deleteFromTable(db, tableName, 'name = ?', [configNameToDelete]);
  
  const placeholders = '(' + columns.map(() => '?').join(', ') + ')';
  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
  
  for (const record of records) {
    const values = valueMapper(record);
    await dbOperation(db, 'run', query, values);
  }
}

// Get related configuration data
async function getConfigurationData(db, configName, tableName, columnMappings) {
  const columns = Object.keys(columnMappings).map(col => 
    columnMappings[col] ? `${col} AS ${columnMappings[col]}` : col
  ).join(', ');
  
  const query = `SELECT ${columns} FROM ${tableName} WHERE name = ?`;
  return dbOperation(db, 'all', query, [configName]);
}

// ---------- Main functions ----------

// Get all strike configurations for a league
async function getLeagueStrikeConfigurations(db, leagueName) {
  try {
    const query = `
      SELECT 
        name
        , league
      FROM strike_configuration
      WHERE league = ? 
      ORDER BY name`;
    const rows = await dbOperation(db, 'all', query, [leagueName]);
    return rows;
  } catch (err) {
    console.error('[statCaptureConfig.js] Error fetching strike configurations from SQLite:', err.message);
    throw err;
  }
}

// Get complete specific strike configuration with all related data
async function getStrikeConfiguration(db, configName) {
  try {
    // Get main configuration
    const query = `
      SELECT 
        sc.name
        , sc.league
        , CASE WHEN scla.active_config_name = sc.name THEN 1 ELSE 0 END AS isActive
      FROM strike_configuration sc
      LEFT JOIN strike_configuration_league_active scla ON sc.league = scla.league
      WHERE sc.name = ?`;
    
    const mainConfig = await dbOperation(db, 'get', query, [configName]);
    
    if (!mainConfig) {
      throw new Error(`Configuration '${configName}' not found`);
    }

    // Get related data using helper
    const [mainMarkets, propsOU, propsYN] = await Promise.all([
      getConfigurationData(db, configName, 'strike_configuration_main_markets', {
        'name': null,
        'market_type': 'marketType',
        'period_type_code': 'periodTypeCode', 
        'period_number': 'periodNumber',
        'strike': null
      }),
      getConfigurationData(db, configName, 'strike_configuration_props_ou', {
        'name': null,
        'prop': null,
        'contestant_type': 'contestantType',
        'strike': null
      }),
      getConfigurationData(db, configName, 'strike_configuration_props_yn', {
        'name': null,
        'prop': null,
        'contestant_type': 'contestantType'
      })
    ]);

    const completeConfig = {
      ...mainConfig,
      mainMarkets,
      propsOU,
      propsYN
    };

    console.log(`[statCaptureConfig.js] Complete configuration fetched for ${configName}: ${mainMarkets.length} main markets, ${propsOU.length} OU props, ${propsYN.length} YN props`);
    return completeConfig;
  } catch (err) {
    console.error('[statCaptureConfig.js] Error fetching complete strike configuration:', err.message);
    throw err;
  }
}

// Save strike configuration
async function saveStrikeConfiguration(db, config) {
  try {
    const result = await withTransaction(db, async () => {
      // 1. Insert/update main configuration
      const mainSql = `
        INSERT INTO strike_configuration (name, league)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET
          league = excluded.league
      `;
      await dbOperation(db, 'run', mainSql, [config.name, config.league]);

      // 2. Handle main markets
      if (config.mainMarkets && config.mainMarkets.length > 0) {
        await insertMultipleRecords(
          db,
          'strike_configuration_main_markets',
          ['name', 'market_type', 'period_type_code', 'period_number', 'strike'],
          config.mainMarkets.map(m => ({ ...m, configName: config.name })),
          (market) => [config.name, market.marketType, market.periodTypeCode, market.periodNumber, market.strike]
        );
      }

      // 3. Handle props OU
      if (config.propsOU && config.propsOU.length > 0) {
        await insertMultipleRecords(
          db,
          'strike_configuration_props_ou',
          ['name', 'prop', 'contestant_type', 'strike'],
          config.propsOU.map(p => ({ ...p, configName: config.name })),
          (prop) => [config.name, prop.prop, prop.contestantType, prop.strike]
        );
      }

      // 4. Handle props YN
      if (config.propsYN && config.propsYN.length > 0) {
        await insertMultipleRecords(
          db,
          'strike_configuration_props_yn',
          ['name', 'prop', 'contestant_type'],
          config.propsYN.map(p => ({ ...p, configName: config.name })),
          (prop) => [config.name, prop.prop, prop.contestantType]
        );
      }

      return { success: true, configName: config.name };
    });

    console.log(`[statCaptureConfig.js] Strike configuration '${config.name}' saved successfully`);
    return result;
  } catch (err) {
    console.error('[statCaptureConfig.js] Error saving strike configuration:', err.message);
    throw err;
  }
}

async function setActiveStatCaptureConfiguration(db, configName, leagueName) {
  try {
    const result = await withTransaction(db, async () => {
      // Check if the configuration exists
      const configExists = await dbOperation(db, 'get',
        `SELECT name FROM strike_configuration 
         WHERE name = ? AND league = ?`,
        [configName, leagueName]
      );

      if (!configExists) {
        throw new Error(`Configuration '${configName}' not found in league '${leagueName}'`);
      }

      // Insert or update the active configuration for this league
      await dbOperation(db, 'run',
        `INSERT INTO strike_configuration_league_active (league, active_config_name) 
         VALUES (?, ?)
         ON CONFLICT(league) DO UPDATE SET
           active_config_name = excluded.active_config_name`,
        [leagueName, configName]
      );

      return await getStrikeConfiguration(db, configName);
    });

    console.log(`[statCaptureConfig.js] Set '${configName}' as active configuration for league '${leagueName}'`);
    return result;
  } catch (err) {
    console.error(`[statCaptureConfig.js] Error setting active stat capture configuration:`, err.message);
    throw err;
  }
}

async function getActiveStatCaptureConfiguration(db, leagueName) {
  // Find which config is active
  const config = await dbOperation(db, 'get',
    `SELECT 
        sc.name
        , sc.league
        , 1 AS isActive
      FROM strike_configuration sc
      JOIN strike_configuration_league_active scla ON sc.name = scla.active_config_name
      WHERE sc.league = ? 
        AND scla.league = ?`,
    [leagueName, leagueName]
  );

  if (!config) {
    return null;
  }

  // Get all related data in parallel
  const [mainMarkets, propsOU, propsYN] = await Promise.all([
    dbOperation(db, 'all', 
      `SELECT 
        name
        , market_type AS marketType
        , period_type_code AS periodTypeCode
        , period_number AS periodNumber
        , strike 
      FROM strike_configuration_main_markets 
      WHERE name = ?`,
      [config.name]
    ),
    dbOperation(db, 'all',
      `SELECT 
        name
        , prop
        , contestant_type AS contestantType
        , strike 
      FROM strike_configuration_props_ou 
      WHERE name = ?`, 
      [config.name]
    ),
    dbOperation(db, 'all',
      `SELECT 
        name
        , prop
        , contestant_type AS contestantType
      FROM strike_configuration_props_yn 
      WHERE name = ?`,
      [config.name]
    )
  ]);

  return {
    ...config,
    mainMarkets,
    propsOU,
    propsYN
  };
}

// ---------- Exports ----------

module.exports = {
    getLeagueStrikeConfigurations,
    getStrikeConfiguration,
    saveStrikeConfiguration,
    setActiveStatCaptureConfiguration,
    getActiveStatCaptureConfiguration
};
