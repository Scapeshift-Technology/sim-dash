// Import the types for your exposed API functions if they are complex
// For example, if login takes specific args and returns a specific shape:
import type { Profile } from './store/slices/profilesSlice'; // Assuming Profile type is exported

interface LoginConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password?: string;
}

interface LoginResult {
  success: boolean;
  username?: string;
  error?: string;
}

interface LogoutResult {
    success: boolean;
    error?: string;
}

// Define the League type based on slice (or import if defined centrally)
// This should match the structure returned by main process
interface FetchedLeague {
    League: string;
}

// Define the structure of the data returned by fetchSchedule
interface ScheduleItem {
    PostDtmUTC: string;
    Participant1: string;
    Participant2: string;
    DaySequence?: number; // Optional for MLB
    // Add other potential fields returned by the query
}

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

      // About Window Communication (Keep if needed, or remove if about window is refactored/removed)
      onVersion: (callback: (event: any, version: string) => void) => void;
      // Add other exposed functions here...
    };
  }
}

// Export {}; // Add this line if you get an error about global scope modification 