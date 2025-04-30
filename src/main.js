const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbHelper = require('./db'); // Local SQLite helper
const sql = require('mssql'); // SQL Server driver

// --- Development ---
// Conditionally enable hot-reloading in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: Enabling electron-reload');
  try {
    require('electron-reload')(__dirname, {
      // Note: __dirname is src/
      // electron binary path is ../node_modules/.bin/electron
      electron: require('path').join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit' // Recommended method for restarts
    });
  } catch (err) {
    console.error('Failed to start electron-reload:', err);
  }
}
// --- End Development ---

let mainWindow;
let db; // Local SQLite database connection
let currentPool = null; // Active SQL Server connection pool

async function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Important for security
            nodeIntegration: false // Important for security
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools (optional)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (currentPool) {
            currentPool.close(); // Close SQL Server connection pool on exit
            currentPool = null;
        }
        db.close(); // Close SQLite connection on exit
    });
}

// --- SQLite Profile Management ---

async function initializeDb() {
    try {
        db = await dbHelper.openDb(path.join(app.getPath('userData'), 'profiles.sqlite'));
        console.log('SQLite database initialized at:', path.join(app.getPath('userData'), 'profiles.sqlite'));
    } catch (err) {
        console.error('Failed to initialize SQLite database:', err);
        // Handle error appropriately - maybe show an error dialog
        app.quit();
    }
}

ipcMain.handle('get-profiles', async () => {
    if (!db) return [];
    try {
        return await dbHelper.getProfiles(db);
    } catch (err) {
        console.error('Error getting profiles:', err);
        return []; // Return empty on error
    }
});

ipcMain.handle('save-profile', async (event, profile) => {
    if (!db) return false;
    try {
        await dbHelper.saveProfile(db, profile);
        return true;
    } catch (err) {
        console.error('Error saving profile:', err);
        return false;
    }
});

ipcMain.handle('delete-profile', async (event, profileName) => {
    if (!db) return false;
    try {
        await dbHelper.deleteProfile(db, profileName);
        return true;
    } catch (err) {
        console.error('Error deleting profile:', err);
        return false;
    }
});


// --- SQL Server Connection Handling ---

ipcMain.handle('login', async (event, config) => {
    console.log('Attempting login with config:', config); // Be careful logging sensitive info

    // Close previous connection if exists
    if (currentPool) {
        try {
            await currentPool.close();
            console.log('Previous connection pool closed.');
        } catch (err) {
            console.error('Error closing previous connection pool:', err);
            // Continue regardless, try to establish new connection
        } finally {
             currentPool = null;
        }
    }

    const sqlConfig = {
        user: config.user,
        password: config.password,
        server: config.host,
        database: config.database,
        port: parseInt(config.port, 10), // Ensure port is an integer
        options: {
            encrypt: true, // Use encryption - adjust as needed for your server setup
            trustServerCertificate: true // Change to true for local dev / self-signed certs ONLY
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };

    try {
        // Connect using the SQL config
        currentPool = await new sql.ConnectionPool(sqlConfig).connect();
        console.log('Connected to SQL Server.');

        // Test connection with SELECT SUSER_SNAME()
        const result = await currentPool.request().query('SELECT SUSER_SNAME() AS username');

        if (result.recordset && result.recordset.length > 0) {
            const username = result.recordset[0].username;
            console.log('SQL Server User:', username);
            return { success: true, username: username };
        } else {
            throw new Error('Could not retrieve username.');
        }

    } catch (err) {
        console.error('SQL Server connection error:', err);
        currentPool = null; // Ensure pool is null on error
        return { success: false, error: err.message };
    }
});

ipcMain.handle('logout', async () => {
    if (currentPool) {
        try {
            await currentPool.close();
            console.log('Connection pool closed on logout.');
            currentPool = null;
            return { success: true };
        } catch (err) {
            console.error('Error closing connection pool on logout:', err);
            currentPool = null; // Still nullify even if close fails
            return { success: false, error: err.message };
        }
    }
    return { success: true }; // No pool to close
});


// --- App Lifecycle ---

app.whenReady().then(async () => {
    await initializeDb(); // Initialize SQLite before creating the window
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}); 