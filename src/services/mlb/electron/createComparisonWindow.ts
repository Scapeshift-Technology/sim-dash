import { BrowserWindow, app } from 'electron';
import path from 'path';
import { teamNameToAbbreviationMLB } from '../utils/teamName';

interface CreateMLBComparisonWindowOptions {
    matchupId: number;
    timestamp: string;
    awayTeamName: string;
    homeTeamName: string;
    daySequence: number | undefined;
    viteDevServerUrl?: string;
    isDevelopment?: boolean;
}

export function createMLBComparisonWindow({
    matchupId,
    timestamp,
    awayTeamName,
    homeTeamName,
    daySequence,
    viteDevServerUrl = 'http://localhost:5173',
    isDevelopment = process.env.NODE_ENV === 'development'
}: CreateMLBComparisonWindowOptions): BrowserWindow {
    // Create a new window instance
    const comparisonWindow = new BrowserWindow({
        width: 600,
        height: 550,
        title: 'MLB Simulation Comparison',
        webPreferences: {
            preload: path.join(__dirname, '..', '..', '..', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false, // Don't show until ready
        // Make it feel more like a floating window
        frame: true,
        resizable: true,
        maximizable: true
    });

    // Load the appropriate content with route and parameters
    const urlParams = new URLSearchParams({
        matchupId: matchupId.toString(),
        awayTeamName: awayTeamName,
        homeTeamName: homeTeamName,
        timestamp: timestamp,
        ...(daySequence && { daySequence: daySequence.toString() })
    });

    if (isDevelopment) {
        const url = new URL(viteDevServerUrl);
        url.hash = `#/sim-comparison?${urlParams.toString()}`;
        comparisonWindow.loadURL(url.toString());
    } else {
        comparisonWindow.loadFile(
            path.join(app.getAppPath(), 'dist', 'renderer', 'index.html'),
            { hash: `/sim-comparison?${urlParams.toString()}` }
        );
    }

    const awayTeamAbbrev = teamNameToAbbreviationMLB(awayTeamName);
    const homeTeamAbbrev = teamNameToAbbreviationMLB(homeTeamName);
    const daySeqStr = daySequence ? ` #${daySequence}` : '';
    const dateString = new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // When the window is ready to show
    comparisonWindow.once('ready-to-show', () => {
        comparisonWindow.show();
        comparisonWindow.setTitle(`${awayTeamAbbrev}@${homeTeamAbbrev}${daySeqStr} - ${dateString} - Comparison`);
    });

    // Add properties to BrowserWindow
    (comparisonWindow as any).simProperties = {
        simMatchupId: matchupId,
        simAwayTeamName: awayTeamName,
        simHomeTeamName: homeTeamName
    };

    return comparisonWindow;
}

