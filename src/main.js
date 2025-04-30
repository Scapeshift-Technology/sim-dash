const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs'); // Import fs module
const dbHelper = require('./db'); // Local SQLite helper
const sql = require('mssql'); // SQL Server driver

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

// --- Build Info Handling ---
let buildInfo = { buildTimeISO: 'N/A' };
// Only try to read build info if not in explicit development mode
if (process.env.NODE_ENV !== 'development') {
    const buildInfoPath = path.join(__dirname, 'build-info.json');
    try {
        if (fs.existsSync(buildInfoPath)) {
            const rawData = fs.readFileSync(buildInfoPath);
            buildInfo = JSON.parse(rawData);
            console.log('Loaded build info:', buildInfo);
        } else {
            console.warn('Build info file not found:', buildInfoPath);
            // Keep default 'N/A'
        }
    } catch (err) {
        console.error('Error reading or parsing build info file:', err);
        // Keep default 'N/A' on error
    }
}

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
let aboutWindow; // Added reference for the about window
let db; // Local SQLite database connection
let currentPool = null; // Active SQL Server connection pool

async function createMainWindow() {
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

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

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
    // If window already exists, focus it
    if (aboutWindow) {
        aboutWindow.focus();
        return;
    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: `About ${app.name}`, // Use app.name in about window title
        icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Use the same icon
        parent: mainWindow, // Make it a child of the main window (optional)
        modal: true, // Make it modal (optional)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Changed to use preload.js
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false // Don't show until ready
    });

    aboutWindow.loadFile(path.join(__dirname, 'about.html'));
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
    await initializeDb(); // Initialize SQLite before creating the window

    // Build and set the application menu
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (currentPool) { // Ensure SQL pool is closed on quit
        currentPool.close();
        currentPool = null;
    }
    if (db) { // Ensure SQLite DB is closed on quit
       db.close((err) => {
           if (err) {
               console.error('Error closing SQLite DB:', err.message);
           } else {
               console.log('SQLite DB closed.');
           }
           // Quit after closing DB, regardless of platform
           app.quit();
       });
    } else {
       // If DB wasn't even initialized, just quit
       app.quit();
    }
    // Original logic moved into db.close callback to ensure quit happens after close
    // if (process.platform !== 'darwin') {
    //     app.quit();
    // }
});

// Note: Added a preload_about.js reference. We'll need to create this or reuse preload.js
// Note: Modified window-all-closed to ensure DB/Pool cleanup happens before quitting. 