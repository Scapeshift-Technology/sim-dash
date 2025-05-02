import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
// Import matchup types
// Removed unused import: import type { MatchupLineups } from '../../../types/mlb';

// Define the shape of a league object based on the ACTUAL query result
interface League {
    League: string; // Changed from LeagueCd/LeagueDesc
    // LeagueDesc: string; // Removed
}

// Define a type for a tab - might expand later
interface LeagueTab {
    id: string; // Use League name as unique ID for simplicity
    type: 'league';
    league: string;
}

interface MatchupTab {
    id: string; // Unique identifier for the matchup, e.g., "MLB_2024-07-19_NYY@BOS_1"
    type: 'matchup';
    league: string;
    date: string; // YYYY-MM-DD
    participant1: string;
    participant2: string;
    daySequence?: number; // Optional, for MLB doubleheaders etc.
    label: string; // Short label for the tab, e.g., "NYY @ BOS"
}

// Union type for all possible tabs
export type Tab = LeagueTab | MatchupTab;

// Define the state structure for this slice
interface LeagueState {
    leagues: League[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
    // selectedLeague is less relevant now, tabs manage the view
    // selectedLeague: string | null;
    openTabs: Tab[]; // Array holds different tab types
    activeTabId: string | null; // ID of the currently active tab
}

const initialState: LeagueState = {
    leagues: [],
    loading: 'idle',
    error: null,
    // selectedLeague: null,
    openTabs: [], // Start with no tabs open
    activeTabId: null,
};

// Helper function to generate a unique ID for matchup tabs
const generateMatchupTabId = (details: Omit<MatchupTab, 'id' | 'type' | 'label'>): string => {
    return `${details.league}_${details.date}_${details.participant1}@${details.participant2}` + (details.daySequence ? `_${details.daySequence}` : '');
};

// Async thunk to fetch leagues using the exposed API
export const fetchLeagues = createAsyncThunk<
    League[], // Return type of the payload creator (matches the new interface)
    void, // First argument to the payload creator (not needed here)
    { rejectValue: string } // Types for thunkAPI
>('leagues/fetchLeagues', async (_, { rejectWithValue }) => {
    try {
        console.log('Dispatching fetchLeagues...');
        const leaguesData = await window.electronAPI.fetchLeagues();
         console.log('Leagues received in thunk:', leaguesData);
        // Ensure the main process returns the correct type (or cast)
        // The fetched data seems to be { League: string }[]
        return leaguesData as League[]; // Return type now matches the expected data
    } catch (error: any) {
        console.error('Error fetching leagues in thunk:', error);
        return rejectWithValue(error.message || 'Failed to fetch leagues');
    }
});

const leagueSlice = createSlice({
    name: 'tabs', // Renaming slice to 'tabs' for clarity
    initialState,
    reducers: {
        // Action to open a league tab (or focus if exists)
        openLeagueTab(state, action: PayloadAction<string>) { // Payload is league name
            const leagueName = action.payload.trim();
            const existingTab = state.openTabs.find(tab => tab.type === 'league' && tab.id === leagueName);

            if (!existingTab) {
                const newTab: LeagueTab = {
                    id: leagueName,
                    type: 'league',
                    league: leagueName,
                };
                state.openTabs.push(newTab);
            }
            state.activeTabId = leagueName; // Activate the league tab
        },

        // Action to open a matchup tab (or focus if exists)
        openMatchupTab(state, action: PayloadAction<Omit<MatchupTab, 'id' | 'type' | 'label'>>) {
            const details = action.payload;
            const tabId = generateMatchupTabId(details);
            const existingTab = state.openTabs.find(tab => tab.id === tabId);

            if (!existingTab) {
                const newTab: MatchupTab = {
                    ...details,
                    id: tabId,
                    type: 'matchup',
                    label: `${details.participant1} @ ${details.participant2}`, // Generate a concise label
                };
                state.openTabs.push(newTab);
            }
            state.activeTabId = tabId; // Activate the new or existing matchup tab
        },

        // Action to close any tab by its ID
        closeTab(state, action: PayloadAction<string>) {
            const tabIdToClose = action.payload;
            const tabIndex = state.openTabs.findIndex(tab => tab.id === tabIdToClose);

            if (tabIndex > -1) {
                const wasActive = state.activeTabId === tabIdToClose;

                // Remove the tab
                state.openTabs.splice(tabIndex, 1);

                // If the closed tab was active, determine the next active tab
                if (wasActive) {
                    if (state.openTabs.length === 0) {
                        state.activeTabId = null; // No tabs left
                    } else {
                        // Try activating the previous tab, fallback to the next, then the first
                         const newActiveIndex = Math.max(0, tabIndex - 1); // Prefer tab to the left
                         state.activeTabId = state.openTabs[newActiveIndex].id;

                         // Simple logic: activate the last tab if the closed one was active
                         // state.activeTabId = state.openTabs[state.openTabs.length - 1]?.id ?? null;
                    }
                }
                 // Optional: Add logic here if closing a matchup tab should potentially reactivate its parent league tab
            }
        },

        // Action to set the active tab by ID
        setActiveTab(state, action: PayloadAction<string | null>) {
            if (action.payload === null || state.openTabs.some(tab => tab.id === action.payload)) {
                state.activeTabId = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeagues.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchLeagues.fulfilled, (state, action: PayloadAction<League[]>) => {
                state.loading = 'succeeded';
                state.leagues = action.payload;
                // Keep existing tabs open when leagues are refetched
            })
            .addCase(fetchLeagues.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload ?? 'Unknown error fetching leagues';
            });
    },
});

// Export actions and selectors
export const { openLeagueTab, openMatchupTab, closeTab, setActiveTab } = leagueSlice.actions;

export const selectAllLeagues = (state: RootState) => state.tabs.leagues;
export const selectLeaguesLoading = (state: RootState) => state.tabs.loading;
export const selectLeaguesError = (state: RootState) => state.tabs.error;

// Selectors for tabs
export const selectOpenTabs = (state: RootState) => state.tabs.openTabs;
export const selectActiveTabId = (state: RootState) => state.tabs.activeTabId;
export const selectActiveTabData = (state: RootState): Tab | undefined => {
    return state.tabs.openTabs.find((tab: Tab) => tab.id === state.tabs.activeTabId);
};

// Export the reducer
export default leagueSlice.reducer; 