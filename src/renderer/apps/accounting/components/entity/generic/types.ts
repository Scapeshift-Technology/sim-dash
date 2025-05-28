// Core entity configuration types for generic reusable components

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface EditorConfig {
  type: 'text' | 'number' | 'money' | 'dropdown' | 'date' | 'checkbox';
  placeholder?: string;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  multiline?: boolean;
  rows?: number;
}

export interface DisplayConfig {
  format?: 'currency' | 'date' | 'percentage' | 'number';
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'money' | 'dropdown' | 'date' | 'boolean';
  required?: boolean;
  validation?: ValidationRule[];
  editor?: EditorConfig;
  display?: DisplayConfig;
  showInTable?: boolean;
  showInDetail?: boolean;
  showInForm?: boolean;
  // Database column mapping
  dbColumn?: string; // Optional: if database column name differs from key
  dbType?: 'CHAR' | 'VARCHAR' | 'NVARCHAR' | 'INT' | 'MONEY' | 'DATETIME' | 'BIT'; // SQL Server data types
}

export interface TableViewConfig {
  pageSize?: number;
  allowSelection?: boolean;
  allowBulkActions?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  showPagination?: boolean;
  densityOptions?: boolean;
}

export interface DetailViewConfig {
  showEditButton?: boolean;
  layout?: 'single-column' | 'two-column';
  showRelatedData?: boolean;
}

export interface FormViewConfig {
  layout?: 'single-column' | 'two-column';
  sections?: FormSection[];
  showCancelButton?: boolean;
  showSaveButton?: boolean;
  autoSave?: boolean;
}

export interface FormSection {
  title: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface DatabaseOperations {
  fetchFunction: string;
  fetchParams?: string[];
  // Explicit column specifications for fetch operations
  fetchColumns?: {
    select: string[]; // Array of column names to select
    trimCharColumns?: string[]; // CHAR columns that need trimming
    transformColumns?: { [key: string]: string | ((value: any) => any) }; // Column transformations
  };
  addFunction?: string;
  addParams?: string[];
  updateFunction?: string;
  updateParams?: string[];
  deleteFunction?: string;
  deleteParams?: string[];
}

export interface RoutingConfig {
  basePath: string;
  listPath: string;
  newPath: string;
  editPath?: string;
  detailPath?: string;
}

export interface EntityConfig<T = any> {
  name: string;
  displayName: string;
  pluralDisplayName: string;
  
  // Database operations
  database: DatabaseOperations;
  
  // Field definitions
  fields: FieldConfig[];
  
  // Primary key field
  primaryKey: string;
  
  // View-specific settings
  views: {
    table: TableViewConfig;
    detail: DetailViewConfig;
    form: FormViewConfig;
  };
  
  // Navigation
  routing: RoutingConfig;
  
  // Permissions
  permissions?: {
    canCreate?: boolean;
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

// Generic entity data interface
export interface EntityData {
  [key: string]: any;
}

// Generic action types for entity operations
export interface EntityAction {
  type: 'create' | 'read' | 'update' | 'delete';
  label: string;
  icon?: string;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (item?: EntityData) => void;
  disabled?: (item?: EntityData) => boolean;
  show?: (item?: EntityData) => boolean;
}

// Loading and error states
export interface EntityState<T = EntityData> {
  items: T[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  formLoading: boolean;
  formError: string | null;
}

// Props for generic components
export interface EntityTableProps<T = EntityData> {
  config: EntityConfig<T>;
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  actions?: EntityAction[];
}

export interface EntityDetailProps<T = EntityData> {
  config: EntityConfig<T>;
  data: T;
  loading?: boolean;
  error?: string | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onBack?: () => void;
  actions?: EntityAction[];
}

export interface EntityFormProps<T = EntityData> {
  config: EntityConfig<T>;
  initialData?: Partial<T>;
  loading?: boolean;
  error?: string | null;
  onSave: (data: T) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
} 