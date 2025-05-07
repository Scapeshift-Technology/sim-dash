import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { League } from '@/types/league';

interface LeagueState {
    leagues: League[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: LeagueState = {
    leagues: [],
    loading: 'idle',
    error: null,
};

// Async thunk to fetch leagues using the exposed API
export const fetchLeagues = createAsyncThunk<
    League[],
    void,
    { rejectValue: string }
>('leagues/fetchLeagues', async (_, { rejectWithValue }) => {
    try {
        console.log('Dispatching fetchLeagues...');
        const leaguesData = await window.electronAPI.fetchLeagues();
        console.log('Leagues received in thunk:', leaguesData);
        return leaguesData as League[];
    } catch (error: any) {
        console.error('Error fetching leagues in thunk:', error);
        return rejectWithValue(error.message || 'Failed to fetch leagues');
    }
});

const leagueSlice = createSlice({
    name: 'leagues',
    initialState,
    reducers: {},
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

// Export selectors
export const selectAllLeagues = (state: RootState) => state.leagues.leagues;
export const selectLeaguesLoading = (state: RootState) => state.leagues.loading;
export const selectLeaguesError = (state: RootState) => state.leagues.error;

// Export the reducer
export default leagueSlice.reducer; 