import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // Assuming RootState is exported from store.ts

// Define the shape of a league object based on the ACTUAL query result
interface League {
    League: string; // Changed from LeagueCd/LeagueDesc
    // LeagueDesc: string; // Removed
}

// Define the state structure for this slice
interface LeagueState {
    leagues: League[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
    selectedLeague: string | null; // Track the currently selected league for display/tab management
}

const initialState: LeagueState = {
    leagues: [],
    loading: 'idle',
    error: null,
    selectedLeague: null,
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
        // Add other reducers as needed (e.g., for tab management later)
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
            })
            .addCase(fetchLeagues.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload ?? 'Unknown error fetching leagues';
            });
    },
});

// Export actions and selectors
export const { setSelectedLeague } = leagueSlice.actions;

export const selectAllLeagues = (state: RootState) => state.leagues.leagues;
export const selectLeaguesLoading = (state: RootState) => state.leagues.loading;
export const selectLeaguesError = (state: RootState) => state.leagues.error;
export const selectCurrentLeague = (state: RootState) => state.leagues.selectedLeague;

// Export the reducer
export default leagueSlice.reducer; 