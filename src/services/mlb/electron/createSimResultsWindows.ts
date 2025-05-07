import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import type { SimResultsMLB } from '@/types/bettingResults';

interface CreateMLBSimResultsWindowOptions {
    simData: SimResultsMLB;
    viteDevServerUrl?: string;
    isDevelopment?: boolean;
}

export function createMLBSimResultsWindow2({
    simData,
    viteDevServerUrl = 'http://localhost:5173',
    isDevelopment = process.env.NODE_ENV === 'development'
}: CreateMLBSimResultsWindowOptions): BrowserWindow {
    // Create unique ID for this window instance
    const windowId = Date.now().toString();

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

    // Construct the URL with windowId parameter and hash route
    const getWindowUrl = (baseUrl: string) => {
        const url = new URL(baseUrl);
        // Move windowId to be part of the hash route
        url.hash = `#/sim-results?windowId=${windowId}`;
        return url.toString();
    };

    // Load the appropriate content
    if (isDevelopment) {
        simWindow.loadURL(getWindowUrl(viteDevServerUrl));
    } else {
        // In production, load the built index.html and let React Router handle the route
        simWindow.loadFile(
            path.join(__dirname, '@@', 'dist', 'renderer', 'index.html'),
            { 
                // Remove search from here
                hash: `/sim-results?windowId=${windowId}` // Put windowId in hash
            }
        );
    }

    // When the window is ready to show
    simWindow.once('ready-to-show', () => {
        simWindow.show();
    });

    // Add windowId to the window object so it can be accessed later
    (simWindow as any).windowId = windowId;

    return simWindow;
}

