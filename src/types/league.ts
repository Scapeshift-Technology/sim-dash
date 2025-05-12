export type LeagueName = 'MLB' | 'NBA' | 'NFL' | 'NHL'; // Add other leagues here as needed

// Define the shape of a league object based on the ACTUAL query result
export interface League {
    League: string;
}

// Define a type for a tab - might expand later
export interface LeagueTab {
    id: string;     // Use League name as unique ID for simplicity
    type: 'league';
    league: string;
}

export interface MatchupTab {
    id: string; // Unique identifier for the matchup, e.g., "MLB_2024-07-19_NYY@BOS_1". Here for backwards compatibility.
    matchId: number; // Unique identifier for the matchup from dev_satya
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
export interface LeagueState {
    leagues: League[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
    // selectedLeague is less relevant now, tabs manage the view
    // selectedLeague: string | null;
    openTabs: Tab[]; // Array holds different tab types
    activeTabId: string | null; // ID of the currently active tab
}
