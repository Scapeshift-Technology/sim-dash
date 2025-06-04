import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { LeagueName } from '@@/types/league';
import { Period } from '@/simDash/components/MainMarketsConfiguration';

// ---------- Types ----------

// Mock settings structure - you can expand this as needed
export interface StatCaptureLeagueSettings {
    simulationSpeed: number;
    enableAdvancedStats: boolean;
    defaultGameLength: number;
    autoSaveInterval: number;
    // Add more settings fields as needed
}

export interface StatCaptureLeagueState {
    settings: StatCaptureLeagueSettings;
    activeTab: number;

    periodsLoading: boolean;
    periodsError: string | null;
    periods: Period[];
}

export interface StatCaptureSettingsState {
    [leagueName: string]: StatCaptureLeagueState;
}

// ---------- Initial state ----------

const initialLeagueSettings: StatCaptureLeagueSettings = {
    simulationSpeed: 1,
    enableAdvancedStats: true,
    defaultGameLength: 9,
    autoSaveInterval: 300, // 5 minutes in seconds
};

const initialState: StatCaptureSettingsState = {};

// ---------- Async thunks ----------

export const getLeaguePeriods = createAsyncThunk<
    any[], // Return type on success - TODO: Define proper Period type
    LeagueName,
    { rejectValue: string }
>(
    'statCaptureSettings/getLeaguePeriods',
    async (leagueName, { rejectWithValue }) => {
        try {
            console.log(`Fetching periods for league: ${leagueName}`);

            const result = await window.electronAPI.getLeaguePeriods(leagueName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

// ---------- Slice ----------

const statCaptureSettingsSlice = createSlice({
    name: 'statCaptureSettings',
    initialState,
    reducers: {
        initializeLeague: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            if (!state[leagueName]) {
                state[leagueName] = {
                    activeTab: 0,
                    settings: { ...initialLeagueSettings },
                    periodsLoading: false,
                    periodsError: null,
                    periods: []
                };
            }
        },

        setActiveTab: (state, action: PayloadAction<{ leagueName: string; tabIndex: number }>) => {
            const { leagueName, tabIndex } = action.payload;
            if (state[leagueName]) {
                state[leagueName].activeTab = tabIndex;
            }
        },

        updateLeagueSettings: (state, action: PayloadAction<{ 
            leagueName: string; 
            settings: Partial<StatCaptureLeagueSettings> 
        }>) => {
            const { leagueName, settings } = action.payload;
            if (state[leagueName]) {
                state[leagueName].settings = {
                    ...state[leagueName].settings,
                    ...settings
                };
            }
        },

        resetLeagueSettings: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            if (state[leagueName]) {
                state[leagueName].settings = { ...initialLeagueSettings };
            }
        },

        removeLeague: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            delete state[leagueName];
        },

        clearPeriodsError: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            if (state[leagueName]) {
                state[leagueName].periodsError = null;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Get league periods actions
            .addCase(getLeaguePeriods.pending, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].periodsLoading = true;
                    state[leagueName].periodsError = null;
                }
            })
            .addCase(getLeaguePeriods.fulfilled, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].periodsLoading = false;
                    state[leagueName].periods = action.payload;
                }
            })
            .addCase(getLeaguePeriods.rejected, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].periodsLoading = false;
                    state[leagueName].periodsError = action.payload ?? 'Failed to fetch league periods';
                }
            });
    }
});

// ---------- Actions ----------

export const {
    initializeLeague,
    setActiveTab,
    updateLeagueSettings,
    resetLeagueSettings,
    removeLeague,
    clearPeriodsError
} = statCaptureSettingsSlice.actions;

// ---------- Selectors ----------

export const selectStatCaptureLeagueState = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): StatCaptureLeagueState | undefined => 
    state.simDash?.settings?.[leagueName];
export const selectActiveTab = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): number => 
    state.simDash?.settings?.[leagueName]?.activeTab ?? 0;
export const selectLeagueSettings = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): StatCaptureLeagueSettings | undefined => 
    state.simDash?.settings?.[leagueName]?.settings;
export const selectAllLeagues = (state: { simDash: { settings: StatCaptureSettingsState } }): string[] => 
    Object.keys(state.simDash?.settings || {});

// League periods selectors
export const selectLeaguePeriods = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): any[] => 
    state.simDash?.settings?.[leagueName]?.periods ?? [];
export const selectLeaguePeriodsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.periodsLoading ?? false;
export const selectLeaguePeriodsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.periodsError ?? null;

// ---------- Reducer ----------

export default statCaptureSettingsSlice.reducer;
