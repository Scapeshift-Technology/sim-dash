// Import the types for your exposed API functions if they are complex
// For example, if login takes specific args and returns a specific shape:
import type { Profile } from './store/slices/profilesSlice'; // Assuming Profile type is exported
import type { SimResultsMLB } from '@/types/bettingResults';
import type { SimResults } from '@/types/mlb';
import type { SimHistoryEntry } from '@/types/simHistory';
import type { MLBGameSimInputs } from '@/types/simInputs';
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
      testConnection: (config: LoginConfig) => Promise<boolean>;
      login: (config: LoginConfig) => Promise<LoginResult>;
      logout: () => Promise<LogoutResult>;

      // SQL execution
      executeSqlQuery: (query: string) => Promise<{ recordset: any[] }>;

      // League data
      fetchLeagues: () => Promise<FetchedLeague[]>;
      fetchSchedule: (args: { league: string; date: string }) => Promise<ScheduleItem[]>;
      getLeaguePeriods: (leagueName: string) => Promise<any[]>;

      // Stat capture config
      fetchLeagueStatCaptureConfigurations: (leagueName: string) => Promise<LeagueSavedConfiguration[]>;
      fetchStatCaptureConfiguration: (configName: string) => Promise<SavedConfiguration>;
      saveStatCaptureConfiguration: (config: SavedConfiguration) => Promise<any>;
      setActiveStatCaptureConfiguration: (configName: string, leagueName: string) => Promise<SavedConfiguration>;
      getActiveStatCaptureConfiguration: (leagueName: string) => Promise<SavedConfiguration>;

      // ---------- MLB-specific functions ----------
      // Fetching data
      fetchMlbGameData: (args: FetchMlbGameDataArgs) => Promise<MLBGameDataResponse>;
      fetchMlbGamePlayerStats: (args: { matchupLineups: MatchupLineups, date: string }) => Promise<MatchupLineups>;

      // Simulations
      simulateMatchupMLB: (args: { matchupLineups: MatchupLineups, numGames: number, gameId: number | undefined, statCaptureConfig: SavedConfiguration, liveGameData?: MlbLiveDataApiResponse }) => Promise<SimResults>;

      // Live data (MLB)
      connectToWebSocketMLB: (args: { gameId: number }) => Promise<void>;
      disconnectFromWebSocketMLB: (args: { gameId: number }) => Promise<void>;
      onMLBGameUpdate: (callback: (gameData: { data: MlbLiveDataApiResponse, gameId: number }) => void) => () => void; // Returns cleanup function
      fetchInitialMLBLiveData: (args: { gameId: number }) => Promise<MlbGameApiResponse>; // Used before websockets for quick data infusion
      
      // ---------- Simulation Windows ----------
      createSimWindow: (args: { 
        league: string;
        matchupId: number;
        timestamp: string;
        awayTeamName: string;
        homeTeamName: string;
        daySequence: number | undefined;
      }) => Promise<{ success: boolean }>;

      createComparisonWindow: (args: { 
        league: string;
        matchupId: number;
        timestamp: string;
        awayTeamName: string;
        homeTeamName: string;
        daySequence: number | undefined;
      }) => Promise<{ success: boolean }>;
      
      // Simulation Results Window Communication
      getMLBSimData: () => Promise<{
        matchId: number;
        simData: SimResultsMLB;
        inputData: MLBGameSimInputData;
        timestamp: string;
        awayTeamName: string;
        homeTeamName: string;
        daySequence: number | undefined;
      }>;

      // Sim history
      saveSimHistory: (args: SimHistoryEntry) => Promise<boolean>;
      getSimHistory: (matchId: number) => Promise<SimHistoryEntry[]>;

      // ---------- About Window Communication ----------
      // About Window Communication (Keep if needed, or remove if about window is refactored/removed)
      onVersion: (callback: (event: any, version: string) => void) => void;
      onBuildTime: (callback: (event: any, buildTime: string) => void) => void;
      // Add other exposed functions here...

      // Logger functions (optional, if directly exposing electron-log functions)
      log?: (...args: any[]) => void;
      info?: (...args: any[]) => void;
      warn?: (...args: any[]) => void;
      error?: (...args: any[]) => void;
      debug?: (...args: any[]) => void;
      verbose?: (...args: any[]) => void;
      silly?: (...args: any[]) => void;

      // URL Validation specific logger
      urlValidationLog?: {
        info: (message: string, meta?: any) => void;
      };
    };
  }
}

// Export {}; // Add this line if you get an error about global scope modification 