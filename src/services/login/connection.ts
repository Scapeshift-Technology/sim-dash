import { ConnectionPool } from "@/types/sql";

interface SQLConfig {
  user: string;
  password: string;
  host: string;
  database: string;
  port: string;
}

async function testConnection(sql: any, config: SQLConfig): Promise<boolean> {
  try {
    const sqlConfig = {
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

    // Create a temporary connection pool for testing
    const testPool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Run a simple test query
    await testPool.request().query('SELECT 1 as testConnection');
    
    // Close the test connection
    await testPool.close();
    
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export { testConnection, SQLConfig };
