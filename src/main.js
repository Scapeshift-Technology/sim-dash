const { app, BrowserWindow, ipcMain, Menu } = require('electron');
// const path = require('path');
import path from 'path';
const fs = require('fs'); // Import fs module
const url = require('url'); // Import url module
const log = require('electron-log/main'); // <-- Import electron-log
const dbHelper = require('./db'); // Local SQLite helper
const sql = require('mssql'); // SQL Server driver
const { createMLBSimResultsWindow2 } = require('./services/mlb/electron/createSimResultsWindows');
const { testConnection } = require('./services/login/connection');
const { initializeMLBWebSockets } = require('./services/mlb/external/webSocket');
const { registerMLBHandlers } = require('./app/ipc/mlbHandlers');
const { registerSharedLeagueHandlers } = require('./app/ipc/sharedLeagueHandlers');
const { registerProfileHandlers } = require('./app/ipc/profileHandlers');

// Force the app name at the system level for macOS menu
app.name = 'SimDash'; // Directly set app.name property
app.setName('SimDash'); // Also use the API method

// Attempt to override Electron name in global scope for macOS menu
if (process.platform === 'darwin') {
  try {
    global.Electron = { name: 'SimDash' };
  } catch (err) {
    console.warn('Failed to override Electron global:', err);
  }
}

// --- Electron-log Configuration ---
log.initialize(); // Optional: Initialize for renderer processes (if needed later)

// Set log level (optional, default is 'silly')
// log.transports.file.level = 'info';

// Set file format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {processType} - {text}';

// Set file size limit (optional)
// log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB

// Set the log file path explicitly
// Uses standard paths by default: ~/.config/{appName}/logs/main.log (Linux), ~/Library/Logs/{appName}/main.log (macOS), %USERPROFILE%\\AppData\\Roaming\\{appName}\\logs\\main.log (Win)
// const logPath = path.join(app.getPath('userData'), 'logs', 'main.log');
// log.transports.file.resolvePathFn = () => logPath;
// console.log(`Configured electron-log file path: ${logPath}`);

// Catch and log unhandled errors and rejections
log.errorHandler.startCatching({
    showDialog: true // Optional: Prevent dialog box on uncaught exception
});
log.info('electron-log errorHandler configured.');

console.log = log.log; // Optional: Redirect console.log to electron-log
Object.assign(console, log.functions); // Optional: Redirect console.error, .warn, etc.

log.info('Main process script started.'); // Add an initial log message

// --- Build Info Handling ---
let buildInfo = { buildTimeISO: 'N/A' };
// Construct path relative to the app's content root to ensure robustness
const buildInfoPath = path.join(app.getAppPath(), 'src', 'build-info.json');
try {
    if (fs.existsSync(buildInfoPath)) {
        const rawData = fs.readFileSync(buildInfoPath);
        buildInfo = JSON.parse(rawData);
        console.log('Loaded build info:', buildInfo);
        log.info('Loaded build info:', buildInfo);
    } else {
        console.warn('Build info file not found:', buildInfoPath);
        log.warn('Build info file not found:', buildInfoPath);
        // Keep default 'N/A'
    }
} catch (err) {
    console.error('Error reading or parsing build info file:', err);
    log.error('Error reading or parsing build info file:', err);
    // Keep default 'N/A' on error
}

// --- Development ---
// Conditionally enable hot-reloading in development mode
log.info(`Current NODE_ENV for electron-reload check: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: Enabling electron-reload');
  log.info('Development mode: Enabling electron-reload');
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
let aboutWindow; // Added reference for the about window
let db; // Local SQLite database connection
let currentPool = null; // Active SQL Server connection pool
let mlbWebSocketManager = null; // MLB WebSocket manager instance

// Define the Vite development server URL
const viteDevServerUrl = 'http://localhost:5173'; // Default Vite port

async function createMainWindow() {
    log.info('createMainWindow: Function called');
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: app.name, // Explicitly set window title
        icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Added icon path
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Important for security
            nodeIntegration: false // Important for security
        }
    });

    // Initialize MLB WebSocket manager after window creation
    mlbWebSocketManager = initializeMLBWebSockets(mainWindow);
    log.info('MLB WebSocket manager initialized');

    // Load the index.html of the app.
    log.info(`createMainWindow: Checking NODE_ENV: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV === 'development') {
        console.log(`Loading Vite dev server: ${viteDevServerUrl}`);
        log.info(`createMainWindow: Development mode - attempting to load URL: ${viteDevServerUrl}`);
        mainWindow.loadURL(viteDevServerUrl)
        .then(() => {
            log.info(`createMainWindow: Development mode - successfully loaded URL: ${viteDevServerUrl}`);
        })
        .catch(err => {
            console.error('Failed to load Vite dev server URL:', err);
            log.error(`createMainWindow: Development mode - Failed to load URL ${viteDevServerUrl}:`, err);
            console.error('Did you start the dev server with `npm run dev`?');
            // Optionally, fall back to file loading or quit
            // app.quit();
        });
    } else {
        // Production: Load the built HTML file
        // Adjust the path to point to the built output in dist/renderer
        const indexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
        console.log(`Loading production build from: ${indexPath}`);
        log.info(`createMainWindow: Production mode - attempting to load file: ${indexPath}`);
        mainWindow.loadURL(url.format({
            pathname: indexPath,
            protocol: 'file:',
            slashes: true
        })).then(() => {
            log.info(`createMainWindow: Production mode - Successfully loaded production file: ${indexPath}`);
        }).catch(err => {
            log.error(`createMainWindow: Production mode - Failed to load production build from ${indexPath}:`, err);
        });
    }

    // Open DevTools (optional)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (currentPool) {
            currentPool.close(); // Close SQL Server connection pool on exit
            currentPool = null;
        }
        // Don't close DB here if multiple windows might use it. Close on app quit.
        // db.close();
    });
}

// --- Function to create the About Window ---
function createAboutWindow() {
    log.info('Creating About window...'); // <-- Log window creation
    // If window already exists, focus it
    if (aboutWindow) {
        aboutWindow.focus();
        return;
    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: true, // Ensure the window has a frame
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: `About ${app.name}`, // Use app.name in about window title
        icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Use the same icon
        parent: mainWindow, // Make it a child of the main window (optional)
        // modal: true, // Making it non-modal
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Changed to use preload.js
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false // Don't show until ready
    });

    aboutWindow.loadFile(path.join(__dirname, 'renderer', 'about.html'))
        .then(() => log.info('About window loaded successfully.')) // <-- Log success
        .catch(err => log.error('Failed to load about.html:', err)); // <-- Log error
    // aboutWindow.setMenu(null); // Optional: remove menu bar from about window

    aboutWindow.once('ready-to-show', () => {
        aboutWindow.show();

        // Send version info
        const versionToSend = process.env.NODE_ENV === 'development' ? 'dev' : app.getVersion();
        aboutWindow.webContents.send('set-version', versionToSend);

        // Send build time info
        const buildTimeToSend = process.env.NODE_ENV === 'development' ? 'Development Build' : buildInfo.buildTimeISO;
        aboutWindow.webContents.send('set-build-time', buildTimeToSend);
    });

    aboutWindow.on('closed', () => {
        aboutWindow = null; // Dereference the window object
    });
}

// --- SQLite Profile Management ---

async function initializeDb() {
    log.info('initializeDb: Function called.');
    try {
        db = await dbHelper.openDb(path.join(app.getPath('userData'), 'profiles.sqlite'));
        console.log('SQLite database initialized at:', path.join(app.getPath('userData'), 'profiles.sqlite'));
        log.info(`initializeDb: SQLite database initialized successfully at: ${path.join(app.getPath('userData'), 'profiles.sqlite')}`);
    } catch (err) {
        console.error('Failed to initialize SQLite database:', err);
        log.error('initializeDb: Failed to initialize SQLite database:', err);
        // Handle error appropriately - maybe show an error dialog
        app.quit();
    }
}

// --- SQLite sim history ---
// Save a sim history entry
ipcMain.handle('save-sim-history', async (event, simHistory) => {
    if (!db) return false;
    try {
        await dbHelper.saveSimHistory(db, simHistory);
        return true;
    } catch (err) {
        console.error('Error saving sim history:', err);
        return false;
    }
});

// Get a match's sim history
ipcMain.handle('get-sim-history', async (event, matchId) => {
    if (!db) return [];
    try {
        const simHistory = await dbHelper.getSimHistory(db, matchId);
        return simHistory;
    } catch (err) {
        console.error('Error getting sim history:', err);
        return [];
    }
});

// --- SQL Server Connection Handling ---

ipcMain.handle('test-connection', async (event, config) => {
    // Create a copy with masked password for logging
    const maskedConfig = { 
        ...config,
        password: '********'
    };
    console.log('Attempting test connection with config:', maskedConfig);

    const result = await testConnection(sql, config);
    return result;
})

ipcMain.handle('login', async (event, config) => {
    // Create a copy with masked password for logging
    const maskedConfig = { 
        ...config,
        password: '********'
    };
    console.log('Attempting login with config:', maskedConfig);

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
            console.error('SQL Server connection error: Could not retrieve username.'); // Log the specific reason
            // If the connection succeeded but username retrieval failed, we might not want to nullify the pool here.
            // Let's keep the pool open but return failure. Nullifying happens in the outer catch for actual connection errors.
            // currentPool = null; // Removed this line
            return { success: false, error: 'Could not retrieve username.' };
        }

    } catch (err) { // This catch block now only handles errors from connect() or query()
        console.error('SQL Server connection error:', err);
        currentPool = null; // Ensure pool is null on error
        return { success: false, error: err.message };
    }
});

ipcMain.handle('logout', async () => {
    console.log('IPC received: logout');
    if (currentPool) {
        try {
            await currentPool.close();
            currentPool = null;
            console.log('SQL Server connection pool closed.');
            return { success: true };
        } catch (err) {
            console.error('Error closing SQL Server connection pool:', err);
            currentPool = null; // Ensure pool is null even if close fails
            return { success: false, message: 'Error during logout.' };
        }
    } else {
        console.log('Logout called but no active connection pool.');
        return { success: true }; // No pool to close, logout is effectively done
    }
});


// --- Create Simulation Window ---
ipcMain.handle('create-sim-window', async (event, { league, matchupId, timestamp, awayTeamName, homeTeamName }) => {
  console.log('IPC received: create-sim-window');
  try {
    if (league === 'MLB') {
      const window = createMLBSimResultsWindow2({
        matchupId,
        timestamp,
        awayTeamName,
        homeTeamName,
        viteDevServerUrl,
        isDevelopment: process.env.NODE_ENV === 'development'
      });

      return { success: true };
    } else {
      console.error('create-sim-window: Invalid league:', league);
      throw new Error('Invalid league for simulation window creation.');
    }
  } catch (err) {
    console.error('Error creating simulation window:', err);
    throw err;
  }
});

// --- Execute SQL Query Handler ---
ipcMain.handle('execute-sql-query', async (event, query) => {
    console.log('IPC received: execute-sql-query: ', query);
    
    if (!currentPool) {
        console.error('execute-sql-query: No active SQL Server connection.');
        throw new Error('Not connected to database.');
    }
    try {
        console.log('Executing SQL query...');
        const result = await currentPool.request().query(query);
        console.log('SQL query completed successfully');
        console.log('Result recordset length:', result.recordset ? result.recordset.length : 'No recordset');
        if (result.recordset && result.recordset.length > 0) {
            console.log('First record:', result.recordset[0]);
        }
        return result;
    } catch (err) {
        console.error('Error executing SQL query:', err);
        console.error('Failed query was:', query);
        throw err;
    }
});

// --- App Lifecycle & Menu ---

// Define the application menu template
const menuTemplate = [
    // { role: 'appMenu' } // Standard macOS app menu placeholder
    ...(process.platform === 'darwin' ? [{
        label: app.name, // Will be 'SimDash'
        submenu: [
            { label: `About ${app.name}`, click: createAboutWindow }, // Custom About item
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' } // Standard File menu placeholder (optional)
    // { role: 'editMenu' } // Standard Edit menu
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(process.platform === 'darwin' ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startSpeaking' },
                        { role: 'stopSpeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
            ])
        ]
    },
    // { role: 'viewMenu' } // Standard View menu
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' } // Standard Window menu
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(process.platform === 'darwin' ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                { role: 'close' }
            ])
        ]
    },
    {
        role: 'help',
        submenu: [
            // Add custom help items here if needed
            ...(process.platform !== 'darwin' ? [ // Add About item to Help menu on non-macOS
                 { type: 'separator' },
                 { label: `About ${app.name}`, click: createAboutWindow }
            ] : [])
        ]
    }
];


app.whenReady().then(async () => {
    log.info("app 'ready' event triggered.");

    // Initialize the database before creating the main window
    try {
        log.info("app 'ready': Calling initializeDb...");
        await initializeDb();
        log.info("app 'ready': initializeDb completed.");
    } catch (err) {
        log.error("app 'ready': Error during initializeDb:", err);
        // Consider app.quit() or other error handling if DB is critical for startup
        // For now, we log and continue to see if window creation proceeds/fails
    }

    // Register shared handlers
    registerSharedLeagueHandlers({
        getCurrentPool: () => currentPool
    });
    log.info("Shared league IPC handlers registered.");

    // Register profile handlers
    registerProfileHandlers({
        getDbHelper: () => dbHelper,
        getDb: () => db
    });
    log.info("Profile IPC handlers registered.");

    // Register MLB handlers with required dependencies
    registerMLBHandlers({
        getMlbWebSocketManager: () => mlbWebSocketManager,
        getDbHelper: () => dbHelper,
        getDb: () => db,
        getCurrentPool: () => currentPool
    });
    log.info("MLB IPC handlers registered.");

    // Create custom application menu
    const menu = Menu.buildFromTemplate(menuTemplate); // Pass app and mainWindow
    Menu.setApplicationMenu(menu);
    log.info("Application menu created and set.");
    
    try {
        log.info("app 'ready': Calling createMainWindow...");
        await createMainWindow(); // Ensure this is awaited if it does async work that needs to complete
        log.info("app 'ready': createMainWindow completed.");
    } catch (err) {
        log.error("app 'ready': Error during createMainWindow:", err);
        // app.quit(); // Quit if main window fails to create
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Clean up MLB WebSocket connections
    if (mlbWebSocketManager) {
        mlbWebSocketManager.cleanup();
        mlbWebSocketManager = null;
        log.info('MLB WebSocket manager cleaned up');
    }

    if (currentPool) { // Ensure SQL pool is closed on quit
        currentPool.close();
        currentPool = null;
    }
    if (db) { // Ensure SQLite DB is closed on quit
       db.close((err) => {
           if (err) {
               log.error('Error closing SQLite DB:', err.message); // <-- Log error
               console.error('Error closing SQLite DB:', err.message);
           } else {
               log.info('SQLite DB closed.'); // <-- Log success
               console.log('SQLite DB closed.');
           }
           // Quit after closing DB, regardless of platform
            log.info('Quitting application after closing DB.'); // <-- Log quit
           app.quit();
       });
    } else {
       // If DB wasn't even initialized, just quit
        log.warn('DB not initialized, quitting application directly.'); // <-- Log quit
       app.quit();
    }
    // Original logic moved into db.close callback to ensure quit happens after close
    // if (process.platform !== 'darwin') {
    //     app.quit();
    // }
});

// Note: Added a preload_about.js reference. We'll need to create this or reuse preload.js
// Note: Modified window-all-closed to ensure DB/Pool cleanup happens before quitting. 