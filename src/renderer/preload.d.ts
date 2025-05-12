// Import the types for your exposed API functions if they are complex
// For example, if login takes specific args and returns a specific shape:
import type { Profile } from './store/slices/profilesSlice'; // Assuming Profile type is exported
import type { SimResults, SimResultsMLB } from '@/types/mlb';
import type { SimHistoryEntry } from '@/types/simHistory';
import type { 
  LoginConfig, 
  LoginResult, 
  LogoutResult, 
  ScheduleItem, 
  FetchedLeague,
  FetchMlbLineupArgs
} from '@/types/sqlite';

// --- Add types for MLB Lineups (Imported where needed) ---
// Re-exporting from here for simplicity in preload, adjust if needed
export type { MatchupLineups, TeamLineup, Player, PlayerStats, Stats } from '@/types/mlb';

// Declare the electronAPI methods on the Window interface
declare global {
  interface Window {
    electronAPI: {
      // Profile management
      getProfiles: () => Promise<Profile[]>;
      saveProfile: (profile: Profile) => Promise<boolean>;
      deleteProfile: (profileName: string) => Promise<boolean>;

      // Connection management
      login: (config: LoginConfig) => Promise<LoginResult>;
      logout: () => Promise<LogoutResult>;

      // League data
      fetchLeagues: () => Promise<FetchedLeague[]>;
      fetchSchedule: (args: { league: string; date: string }) => Promise<ScheduleItem[]>;

      // ---------- MLB-specific functions ----------
      // Fetching data
      fetchMlbLineup: (args: FetchMlbLineupArgs) => Promise<MatchupLineups>;
      fetchMlbGamePlayerStats: (args: MatchupLineups) => Promise<MatchupLineups>;

      // Simulations
      simulateMatchupMLB: (args: { numGames: number }) => Promise<SimResults>;
      
      // ---------- Simulation Windows ----------
      createSimWindow: (args: { 
        league: string; 
        simData: SimResultsMLB;
        awayTeamName: string;
        homeTeamName: string;
      }) => Promise<{ success: boolean }>;
      
      // Simulation Results Window Communication
      getSimData: (args: { windowId: string }) => Promise<{
        simData: SimResultsMLB;
        awayTeamName: string;
        homeTeamName: string;
      }>;

      // Sim history
      saveSimHistory: (args: SimHistoryEntry) => Promise<boolean>;
      getSimHistory: (matchId: number) => Promise<SimHistoryEntry[]>;

      // ---------- About Window Communication ----------
      // About Window Communication (Keep if needed, or remove if about window is refactored/removed)
      onVersion: (callback: (event: any, version: string) => void) => void;
      // Add other exposed functions here...

      // Logger functions (optional, if directly exposing electron-log functions)
      log?: (...args: any[]) => void;
      info?: (...args: any[]) => void;
      warn?: (...args: any[]) => void;
      error?: (...args: any[]) => void;
      debug?: (...args: any[]) => void;
      verbose?: (...args: any[]) => void;
      silly?: (...args: any[]) => void;
    };
  }
}

// Export {}; // Add this line if you get an error about global scope modification 