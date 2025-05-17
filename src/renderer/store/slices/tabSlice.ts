import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { LeagueTab, MatchupTab, Tab } from '@/types/league';
import { teamNameToAbbreviationMLB } from '@/utils/displayMLB';

interface TabState {
    openTabs: Tab[];
    activeTabId: string | null;
}

const initialState: TabState = {
    openTabs: [],
    activeTabId: null,
};

// Helper function to generate a unique ID for matchup tabs
const generateMatchupTabId = (details: Omit<MatchupTab, 'id' | 'type' | 'label'>): string => {
    return `${details.league}_${details.date}_${details.participant1}@${details.participant2}` + (details.daySequence ? `_${details.daySequence}` : '');
};

// Helper function to format date from YYYY-MM-DD to M/D/YY
const formatDateToShort = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`;
};

const tabSlice = createSlice({
    name: 'tabs',
    initialState,
    reducers: {
        // Action to open a league tab (or focus if exists)
        openLeagueTab(state, action: PayloadAction<string>) {
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
            state.activeTabId = leagueName;
        },

        // Action to open a matchup tab (or focus if exists)
        openMatchupTab(state, action: PayloadAction<Omit<MatchupTab, 'id' | 'type' | 'label'>>) {
            const details = action.payload;
            const tabId = generateMatchupTabId(details);
            const formattedDate = formatDateToShort(details.date);
            const existingTab = state.openTabs.find(tab => tab.id === tabId);

            if (!existingTab) {
                let label;
                if (details.league === 'MLB') {
                    label = `${teamNameToAbbreviationMLB(details.participant1)}@${teamNameToAbbreviationMLB(details.participant2)} ${formattedDate}${details.daySequence ? ` #${details.daySequence}` : ''}`;
                } else {
                    label = `${details.participant1}@${details.participant2} ${formattedDate}${details.daySequence ? ` #${details.daySequence}` : ''}`;
                }

                if (!details.daySequence) {
                  details.daySequence = 1;
                }

                const newTab: MatchupTab = {
                    ...details,
                    id: tabId,
                    type: 'matchup',
                    label: label,
                };
                state.openTabs.push(newTab);
            }
            state.activeTabId = tabId;
        },

        // Action to close any tab by its ID
        closeTab(state, action: PayloadAction<string>) {
            const tabIdToClose = action.payload;
            const tabIndex = state.openTabs.findIndex(tab => tab.id === tabIdToClose);

            if (tabIndex > -1) {
                const wasActive = state.activeTabId === tabIdToClose;

                state.openTabs.splice(tabIndex, 1);

                if (wasActive) {
                    if (state.openTabs.length === 0) {
                        state.activeTabId = null;
                    } else {
                        const newActiveIndex = Math.max(0, tabIndex - 1);
                        state.activeTabId = state.openTabs[newActiveIndex].id;
                    }
                }
            }
        },

        // Action to set the active tab by ID
        setActiveTab(state, action: PayloadAction<string | null>) {
            if (action.payload === null || state.openTabs.some(tab => tab.id === action.payload)) {
                state.activeTabId = action.payload;
            }
        },
    },
});

// Export actions and selectors
export const { openLeagueTab, openMatchupTab, closeTab, setActiveTab } = tabSlice.actions;

// Selectors for tabs
export const selectOpenTabs = (state: RootState) => state.tabs.openTabs;
export const selectActiveTabId = (state: RootState) => state.tabs.activeTabId;
export const selectActiveTabData = (state: RootState): Tab | undefined => {
    return state.tabs.openTabs.find((tab: Tab) => tab.id === state.tabs.activeTabId);
};

// Export the reducer
export default tabSlice.reducer; 