import { BrowserWindow, app } from 'electron';
import path from 'path';

interface CreateMLBSimResultsWindowOptions {
    matchupId: number;
    timestamp: string;
    awayTeamName: string;
    homeTeamName: string;
    viteDevServerUrl?: string;
    isDevelopment?: boolean;
}

export function createMLBSimResultsWindow2({
    matchupId,
    timestamp,
    awayTeamName,
    homeTeamName,
    viteDevServerUrl = 'http://localhost:5173',
    isDevelopment = process.env.NODE_ENV === 'development'
}: CreateMLBSimResultsWindowOptions): BrowserWindow {
    // Create a new window instance
    const simWindow = new BrowserWindow({
        width: 600,
        height: 550,
        title: 'MLB Simulation Results',
        webPreferences: {
            preload: path.join(__dirname, '..', '..', '..', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false, // Don't show until ready
        // Make it feel more like a floating window
        frame: true,
        alwaysOnTop: true,
        resizable: true,
        maximizable: true,
        minimizable: true
    });

    // Load the appropriate content with simple route
    if (isDevelopment) {
        const url = new URL(viteDevServerUrl);
        url.hash = '#/sim-results';
        simWindow.loadURL(url.toString());
    } else {
        simWindow.loadFile(
            path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'),
            { hash: '/sim-results' }
        );
    }

    // When the window is ready to show
    simWindow.once('ready-to-show', () => {
        simWindow.show();
    });

    // Add properties to BrowserWindow
    (simWindow as any).simProperties = {
        simMatchupId: matchupId,
        simTimestamp: timestamp,
        simAwayTeamName: awayTeamName,
        simHomeTeamName: homeTeamName
    };

    return simWindow;
}

