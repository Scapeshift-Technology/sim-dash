// Define the structure of a connection profile
export interface Profile {
    name: string;
    host: string;
    port: number; // Store port as number internally
    database: string;
    user: string;
    password?: string; // Password is saved (insecurely for now)
}

// Define the state structure for profiles
export interface ProfilesState {
  profiles: Profile[];
  selectedProfileName: string | null;
  isLoading: boolean;
  error: string | null;
  statusMessage: string | null; // For save/delete feedback
}

