// Hierarchical entity types for Ledger system

export type LedgerType = 'Asset' | 'Equity';

export type AssetSubtype = 'Bankroll' | 'Counterparty' | 'MakerAccount';
export type EquitySubtype = 'Loan' | 'Partnership';

export type LedgerSubtype = AssetSubtype | EquitySubtype;

// Hierarchy path for navigation
export interface LedgerPath {
  type: LedgerType;
  subtype: LedgerSubtype;
}

// Base ledger item interface (common fields)
export interface BaseLedger {
  Party: string;    // From auth state
  Ledger: string;   // User-provided name
}

// Specific ledger types based on database return structures
export interface AssetBankrollLedger extends BaseLedger {
  // Only has Party and Ledger fields
}

export interface AssetMakerAccountLedger extends BaseLedger {
  Maker: string;
  Username: string;
}

export interface EquityPartnershipLedger extends BaseLedger {
  Description: string;
}

// Union type for all ledger items
export type LedgerItem = AssetBankrollLedger | AssetMakerAccountLedger | EquityPartnershipLedger;

// Database operation configuration for each leaf type
export interface LedgerTypeConfig {
  type: LedgerType;
  subtype: LedgerSubtype;
  displayName: string;
  pluralDisplayName: string;
  description: string;
  
  // Database operations
  database: {
    fetchFunction: string;
    fetchParams: string[];
    fetchColumns: {
      select: string[];
      trimCharColumns?: string[];
    };
    addFunction: string;
    addParams: string[];
    // DELETE is shared: dbo.PartyLedger_DELETE_tr
  };
  
  // Fields specific to this type (beyond Party and Ledger)
  additionalFields: FieldConfig[];
  
  // UI configuration
  ui: {
    icon?: string;
    color?: string;
    cardDescription: string;
  };
}

// Field configuration for dynamic forms
export interface FieldConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'money' | 'dropdown' | 'table';
  required?: boolean;
  validation?: ValidationRule[];
  editor?: EditorConfig;
  display?: DisplayConfig;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface EditorConfig {
  type: 'text' | 'number' | 'money' | 'dropdown' | 'table';
  placeholder?: string;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  // For table editor (like counterpartyPercentages)
  tableConfig?: {
    columns: TableColumnConfig[];
    allowAdd?: boolean;
    allowRemove?: boolean;
  };
}

export interface TableColumnConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'dropdown';
  required?: boolean;
  validation?: ValidationRule[];
}

export interface DisplayConfig {
  format?: 'currency' | 'date' | 'percentage' | 'number';
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
}

// Navigation and breadcrumb types
export interface BreadcrumbItem {
  label: string;
  path: string;
  current?: boolean;
}

// State management types
export interface LedgerState {
  // Current navigation
  currentType: LedgerType | null;
  currentSubtype: LedgerSubtype | null;
  
  // Data for each leaf type
  items: {
    [key: string]: LedgerItem[]; // key is "type_subtype" format
  };
  
  // Loading states
  loading: {
    [key: string]: boolean;
  };
  
  // Error states
  errors: {
    [key: string]: string | null;
  };
  
  // Form states
  formLoading: boolean;
  formError: string | null;
}

// Component prop types
export interface LedgerTypeCardProps {
  type: LedgerType;
  subtypes: LedgerSubtype[];
  onTypeClick: (type: LedgerType) => void;
}

export interface LedgerSubtypeCardProps {
  type: LedgerType;
  subtype: LedgerSubtype;
  config: LedgerTypeConfig;
  itemCount?: number;
  onSubtypeClick: (type: LedgerType, subtype: LedgerSubtype) => void;
}

export interface LedgerTableProps {
  type: LedgerType;
  subtype: LedgerSubtype;
  items: LedgerItem[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRowClick?: (item: LedgerItem) => void;
  onAddNew?: () => void;
}

export interface LedgerFormProps {
  type: LedgerType;
  subtype: LedgerSubtype;
  mode: 'create' | 'edit';
  initialData?: Partial<LedgerItem>;
  loading?: boolean;
  error?: string | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// Type guards
export function isAssetType(type: LedgerType): type is 'Asset' {
  return type === 'Asset';
}

export function isEquityType(type: LedgerType): type is 'Equity' {
  return type === 'Equity';
}

export function isAssetSubtype(subtype: LedgerSubtype): subtype is AssetSubtype {
  return ['Bankroll', 'Counterparty', 'MakerAccount'].includes(subtype);
}

export function isEquitySubtype(subtype: LedgerSubtype): subtype is EquitySubtype {
  return ['Loan', 'Partnership'].includes(subtype);
}

// Utility functions
export function getLedgerKey(type: LedgerType, subtype: LedgerSubtype): string {
  return `${type}_${subtype}`;
}

export function parseLedgerKey(key: string): { type: LedgerType; subtype: LedgerSubtype } | null {
  const [type, subtype] = key.split('_');
  if (!type || !subtype) return null;
  
  if (!['Asset', 'Equity'].includes(type)) return null;
  if (!['Bankroll', 'Counterparty', 'MakerAccount', 'Loan', 'Partnership'].includes(subtype)) return null;
  
  return { type: type as LedgerType, subtype: subtype as LedgerSubtype };
} 