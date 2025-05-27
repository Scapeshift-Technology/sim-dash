// Define the shape of the login configuration expected by the API
export interface LoginConfig {
  host: string;
  port: string; // Keep as string, main process will parse
  database: string;
  user: string;
  password?: string;
}

// Define the shape of the successful login response from the API
export interface LoginSuccessResponse {
  success: true;
  username: string;
}

// Define the shape of the failed login response from the API
export interface LoginErrorResponse {
  success: false;
  error: string;
}

// Define the shape of the logout response
export interface LogoutResponse {
  success: boolean;
  error?: string;
}

// Party and Agent Management Types
export interface GranteeResult {
  Grantor: string;
  PartyAgentRoleType: string;
}

export interface GrantorResult {
  Grantee: string;
  PartyAgentRoleType: string;
}

export interface AddUserPermissionRequest {
  granteeUsername: string;
  partyAgentRoleType: string;
}

export interface RemoveUserPermissionRequest {
  granteeUsername: string;
  partyAgentRoleType: string;
}

// Define the state structure for authentication
export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isRegistrationLoading: boolean;
  error: string | null;
  hasPartyRole: boolean | null; // null = unknown, true/false = known status
  telegramToken: string | null;
  telegramTokenExpiration: string | null;
  isTelegramTokenLoading: boolean;
  
  // Party Management
  userDefaultParty: string | null;
  currentParty: string | null;
  
  // Permissions
  granteePermissions: GranteeResult[];
  grantorPermissions: GrantorResult[];
  
  // Role Types
  roleTypes: string[];
  roleTypesError: string | null;
  roleTypesLoading: boolean;
  
  // Add User Permission
  addUserPermissionError: string | null;
  addUserPermissionLoading: boolean;
  
  // Remove User Permission
  removeUserPermissionError: string | null;
  removeUserPermissionLoading: boolean;
  
  // Fetch Permissions
  fetchPermissionsError: string | null;
  fetchPermissionsLoading: boolean;
}
