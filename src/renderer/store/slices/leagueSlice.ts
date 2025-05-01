import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // Assuming RootState is exported from store.ts

// Define the shape of a league object based on the ACTUAL query result
interface League {
    League: string; // Changed from LeagueCd/LeagueDesc
    // LeagueDesc: string; // Removed
}

// Define a type for a tab - might expand later
interface LeagueTab extends League {
    id: string; // Use League name as unique ID for simplicity
}

// Define the state structure for this slice
interface LeagueState {
    leagues: League[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
    selectedLeague: string | null; // Track the currently selected league for display/tab management
    openTabs: LeagueTab[]; // List of currently open league tabs
    activeTabId: string | null; // ID of the currently active tab
}

const initialState: LeagueState = {
    leagues: [],
    loading: 'idle',
    error: null,
    selectedLeague: null,
    openTabs: [], // Start with no tabs open
    activeTabId: null,
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
    name: 'leagues',
    initialState,
    reducers: {
        // Action to set the selected league (e.g., when a league is clicked)
        setSelectedLeague(state, action: PayloadAction<string | null>) {
            state.selectedLeague = action.payload;
        },
        openTab(state, action: PayloadAction<League>) {
            const league = action.payload;
            const trimmedLeagueName = league.League.trim(); // Ensure consistent ID
            const existingTab = state.openTabs.find(tab => tab.id === trimmedLeagueName);
            if (!existingTab) {
                state.openTabs.push({ ...league, id: trimmedLeagueName }); // Use trimmed name for ID
            }
            // Automatically activate the opened/clicked tab
            state.activeTabId = trimmedLeagueName; // Use trimmed name
        },
        closeTab(state, action: PayloadAction<string>) { // Payload is the tab ID (league name)
            const tabIdToClose = action.payload;
            const tabIndex = state.openTabs.findIndex(tab => tab.id === tabIdToClose);

            if (tabIndex > -1) {
                // If closing the active tab, activate the previous one (or null if none left)
                if (state.activeTabId === tabIdToClose) {
                     const nextActiveTab = state.openTabs[tabIndex - 1] ?? state.openTabs[tabIndex + 1] ?? null;
                     state.activeTabId = nextActiveTab?.id ?? null;
                     // A more robust solution might activate the *most recently used* other tab.
                }
                state.openTabs.splice(tabIndex, 1); // Remove the tab
            }
        },
        setActiveTab(state, action: PayloadAction<string | null>) { // Payload is tab ID or null
            state.activeTabId = action.payload;
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
                 // Optional: Clear tabs if leagues are re-fetched? Or keep them?
                 // state.openTabs = [];
                 // state.activeTabId = null;
            })
            .addCase(fetchLeagues.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload ?? 'Unknown error fetching leagues';
            });
    },
});

// Export actions and selectors
export const { setSelectedLeague, openTab, closeTab, setActiveTab } = leagueSlice.actions;

export const selectAllLeagues = (state: RootState) => state.leagues.leagues;
export const selectLeaguesLoading = (state: RootState) => state.leagues.loading;
export const selectLeaguesError = (state: RootState) => state.leagues.error;
export const selectCurrentLeague = (state: RootState) => state.leagues.selectedLeague;

// New selectors for tabs
export const selectOpenTabs = (state: RootState) => state.leagues.openTabs;
export const selectActiveTabId = (state: RootState) => state.leagues.activeTabId;

// Export the reducer
export default leagueSlice.reducer; 