import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ---------- Types ----------

// Mock settings structure - you can expand this as needed
export interface LeagueSettings {
    simulationSpeed: number;
    enableAdvancedStats: boolean;
    defaultGameLength: number;
    autoSaveInterval: number;
    // Add more settings fields as needed
}

export interface LeagueState {
    activeTab: number;
    settings: LeagueSettings;
}

export interface SettingsState {
    [leagueName: string]: LeagueState;
}

// ---------- Initial state ----------

const initialLeagueSettings: LeagueSettings = {
    simulationSpeed: 1,
    enableAdvancedStats: true,
    defaultGameLength: 9,
    autoSaveInterval: 300, // 5 minutes in seconds
};

const initialState: SettingsState = {};

// ---------- Slice ----------

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        initializeLeague: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            if (!state[leagueName]) {
                state[leagueName] = {
                    activeTab: 0,
                    settings: { ...initialLeagueSettings }
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
            settings: Partial<LeagueSettings> 
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
        }
    }
});

// ---------- Actions ----------

export const {
    initializeLeague,
    setActiveTab,
    updateLeagueSettings,
    resetLeagueSettings,
    removeLeague
} = settingsSlice.actions;

// ---------- Selectors ----------

export const selectLeagueState = (state: { simDash: { settings: SettingsState } }, leagueName: string): LeagueState | undefined => 
    state.simDash?.settings?.[leagueName];
export const selectActiveTab = (state: { simDash: { settings: SettingsState } }, leagueName: string): number => 
    state.simDash?.settings?.[leagueName]?.activeTab ?? 0;
export const selectLeagueSettings = (state: { simDash: { settings: SettingsState } }, leagueName: string): LeagueSettings | undefined => 
    state.simDash?.settings?.[leagueName]?.settings;
export const selectAllLeagues = (state: { simDash: { settings: SettingsState } }): string[] => 
    Object.keys(state.simDash?.settings || {});

// ---------- Reducer ----------

export default settingsSlice.reducer;
