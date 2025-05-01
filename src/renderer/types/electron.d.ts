interface Profile {
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
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

interface IElectronAPI {
  getProfiles: () => Promise<Profile[]>;
  saveProfile: (profile: Profile) => Promise<boolean>;
  deleteProfile: (profileName: string) => Promise<boolean>;
  login: (config: Omit<Profile, 'name'>) => Promise<LoginResult>;
  logout: () => Promise<LogoutResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 