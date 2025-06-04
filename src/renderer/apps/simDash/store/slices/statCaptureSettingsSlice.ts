import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { LeagueName } from '@@/types/league';
import { Period } from '@@/types/statCaptureConfig';
import { SavedConfiguration } from '@@/types/statCaptureConfig';


// ---------- Types ----------

export interface StatCaptureLeagueState {
    // Configurations
    leagueSavedConfigurations: SavedConfiguration[];
    
    // Current draft
    currentDraft: SavedConfiguration;

    // Active tab
    activeTab: number;

    // Period loading
    periodsLoading: boolean;
    periodsError: string | null;
    periods: Period[];

    // League configurations thunk
    leagueConfigurationsLoading: boolean;
    leagueConfigurationsError: string | null;

    // Stat capture configuration thunk
    statCaptureConfigurationLoading: boolean;
    statCaptureConfigurationError: string | null;

    // Save config thunk
    saveConfigLoading: boolean;
    saveConfigError: string | null;
}

export interface StatCaptureSettingsState {
    [leagueName: string]: StatCaptureLeagueState;
}

// ---------- Initial state ----------

const initialState: StatCaptureSettingsState = {};

// ---------- Async thunks ----------

export const getLeaguePeriods = createAsyncThunk<
    Period[],
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

export const getLeagueStatCaptureConfigurations = createAsyncThunk<
    SavedConfiguration[],
    LeagueName,
    { rejectValue: string }
>(
    'statCaptureSettings/getLeagueStatCaptureConfigurations',
    async (leagueName, { rejectWithValue }) => {
        try {
            console.log(`Fetching stat capture configurations for league: ${leagueName}`);

            const result = await window.electronAPI.fetchLeagueStatCaptureConfigurations(leagueName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const getStatCaptureConfiguration = createAsyncThunk<
    SavedConfiguration,
    { configName: string, leagueName: string },
    { rejectValue: string }
>(
    'statCaptureSettings/getStatCaptureConfigurations',
    async ({ configName, leagueName }, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.fetchStatCaptureConfiguration(configName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const saveStatCaptureConfiguration = createAsyncThunk<
    { success: boolean, configName: string },
    SavedConfiguration,
    { rejectValue: string }
>(
    'statCaptureSettings/saveStatCaptureConfiguration',
    async (config, { rejectWithValue }) => {
        try {
            console.log(`Saving stat capture configuration: ${config.name}`);

            const result = await window.electronAPI.saveStatCaptureConfiguration(config);
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
        initializeLeague: (state, action: PayloadAction<LeagueName>) => {
            const leagueName: LeagueName = action.payload;
            if (!state[leagueName]) {
                state[leagueName] = {
                    activeTab: 0,
                    periodsLoading: false,
                    periodsError: null,
                    periods: [],
                    leagueSavedConfigurations: [],
                    leagueConfigurationsLoading: false,
                    leagueConfigurationsError: null,
                    statCaptureConfigurationLoading: false,
                    statCaptureConfigurationError: null,
                    currentDraft: {
                        name: '',
                        league: leagueName,
                        mainMarkets: [],
                        propsOU: [],
                        propsYN: []
                    },
                    saveConfigLoading: false,
                    saveConfigError: null
                };
            }
        },

        setActiveTab: (state, action: PayloadAction<{ leagueName: string; tabIndex: number }>) => {
            const { leagueName, tabIndex } = action.payload;
            if (state[leagueName]) {
                state[leagueName].activeTab = tabIndex;
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
            })

            // Get league stat capture configurations actions
            .addCase(getLeagueStatCaptureConfigurations.pending, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = true;
                    state[leagueName].leagueConfigurationsError = null;
                }
            })
            .addCase(getLeagueStatCaptureConfigurations.fulfilled, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = false;
                    state[leagueName].leagueSavedConfigurations = action.payload;
                }
            })
            .addCase(getLeagueStatCaptureConfigurations.rejected, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = false;
                    state[leagueName].leagueConfigurationsError = action.payload ?? 'Failed to fetch league stat capture configurations';
                }
            })

            // Save stat capture configuration actions
            .addCase(saveStatCaptureConfiguration.pending, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = true;
                    state[config.league].saveConfigError = null;
                }
            })
            .addCase(saveStatCaptureConfiguration.fulfilled, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = false;
                }
            })
            .addCase(saveStatCaptureConfiguration.rejected, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = false;
                    state[config.league].saveConfigError = action.payload ?? 'Failed to save stat capture configuration';
                }
            })

            // Load individual stat capture configuration actions
            .addCase(getStatCaptureConfiguration.pending, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = true;
                    state[leagueName].statCaptureConfigurationError = null;
                }
            })
            .addCase(getStatCaptureConfiguration.fulfilled, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = false;
                    state[leagueName].currentDraft = action.payload;
                }
            })
            .addCase(getStatCaptureConfiguration.rejected, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = false;
                    state[leagueName].statCaptureConfigurationError = action.payload ?? 'Failed to load stat capture configuration';
                }
            })
    }
});

// ---------- Actions ----------

export const {
    initializeLeague,
    setActiveTab,
    removeLeague,
    clearPeriodsError
} = statCaptureSettingsSlice.actions;

// ---------- Selectors ----------

export const selectStatCaptureLeagueState = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): StatCaptureLeagueState | undefined => 
    state.simDash?.settings?.[leagueName];
export const selectActiveTab = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): number => 
    state.simDash?.settings?.[leagueName]?.activeTab ?? 0;
export const selectAllLeagues = (state: { simDash: { settings: StatCaptureSettingsState } }): string[] => 
    Object.keys(state.simDash?.settings || {});

// League periods selectors
export const selectLeaguePeriods = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): any[] => 
    state.simDash?.settings?.[leagueName]?.periods ?? [];
export const selectLeaguePeriodsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.periodsLoading ?? false;
export const selectLeaguePeriodsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.periodsError ?? null;

// League stat capture configurations selectors
export const selectLeagueStatCaptureConfigurations = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): SavedConfiguration[] => 
    state.simDash?.settings?.[leagueName]?.leagueSavedConfigurations ?? [];
export const selectLeagueStatCaptureConfigurationsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.leagueConfigurationsLoading ?? false;
export const selectLeagueStatCaptureConfigurationsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.leagueConfigurationsError ?? null;

// Individual stat capture configuration selectors
export const selectCurrentDraft = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): SavedConfiguration | undefined => 
    state.simDash?.settings?.[leagueName]?.currentDraft;
export const selectStatCaptureConfigurationLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.statCaptureConfigurationLoading ?? false;
export const selectStatCaptureConfigurationError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.statCaptureConfigurationError ?? null;

// Save configuration selectors
export const selectSaveConfigLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.saveConfigLoading ?? false;
export const selectSaveConfigError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.saveConfigError ?? null;

// ---------- Reducer ----------

export default statCaptureSettingsSlice.reducer;
