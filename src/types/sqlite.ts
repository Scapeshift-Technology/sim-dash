// ---------- Login ----------

export interface LoginConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password?: string;
}
  
export interface LoginResult {
  success: boolean;
  username?: string;
  error?: string;
}
  
export interface LogoutResult {
  success: boolean;
  error?: string;
}
  
// ---------- fetchLeagues ----------
export interface FetchedLeague {
  League: string;
}
  
// ---------- fetchSchedule ----------
export interface ScheduleItem {
  Match: number;
  PostDtmUTC: string;
  Participant1: string;
  Participant2: string;
  DaySequence?: number; // Optional for MLB (legacy field)
  // New MLB-specific fields from MLBScheduleForDay_tvf
  GameNumber?: number; // Gm# column
  SeriesGameNumber?: string; // SerGm# column  
  Status?: string; // Status column
  MLBGameId?: number; // MLB# column - the gamePk used for MLB API calls
  // Add other potential fields returned by the query
}

// ---------- fetchMlbLineup ----------
export interface FetchMlbLineupArgs {
  league: string; // Should always be 'MLB' here
  date: string; // YYYY-MM-DD
  participant1: string; // Away Team
  participant2: string; // Home Team
  daySequence?: number;
}