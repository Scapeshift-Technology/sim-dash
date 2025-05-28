import { EntityConfig } from '../generic/types';
import { Counterparty } from '@/store/slices/counterpartiesSlice';

export const counterpartyConfig: EntityConfig<Counterparty> = {
  name: 'counterparty',
  displayName: 'Counterparty',
  pluralDisplayName: 'Counterparties',
  
  // Primary key field
  primaryKey: 'Counterparty',
  
  // Database operations
  database: {
    fetchFunction: 'dbo.Party_GET_Counterparties_tvf',
    fetchParams: ['Party'],
    // Explicit column specifications
    fetchColumns: {
      select: ['Counterparty', 'CreditLimit'],
      trimCharColumns: ['Counterparty'], // CHAR(16) fields that need trimming
      // Party field will be added by the CRUD hook using currentParty
    },
    addFunction: 'dbo.PartyCounterparty_ADD_tr',
    addParams: ['Party', 'Counterparty', 'CreditLimit'],
    // No update function as counterparties cannot be edited
    // No delete function as counterparties cannot be deleted
  },
  
  // Field definitions
  fields: [
    {
      key: 'Party',
      label: 'Party',
      type: 'string',
      required: true,
      dbColumn: 'Party',
      dbType: 'CHAR',
      showInTable: false, // Don't show in table as it's always the current party
      showInDetail: false, // Don't show in detail as it's always the current party
      showInForm: false, // Will be set automatically from current party
      display: {
        align: 'left',
        searchable: false,
        sortable: false,
      },
    },
    {
      key: 'Counterparty',
      label: 'Counterparty Name',
      type: 'string',
      required: true,
      dbColumn: 'Counterparty',
      dbType: 'CHAR',
      validation: [
        {
          type: 'required',
          message: 'Counterparty name is required',
        },
        {
          type: 'minLength',
          value: 1,
          message: 'Counterparty name must not be empty',
        },
        {
          type: 'maxLength',
          value: 16,
          message: 'Counterparty name must be 16 characters or less',
        },
      ],
      editor: {
        type: 'text',
        placeholder: 'Enter counterparty name',
      },
      display: {
        align: 'left',
        searchable: true,
        sortable: true,
        width: '40%',
      },
    },
    {
      key: 'CreditLimit',
      label: 'Credit Limit',
      type: 'money',
      required: false,
      dbColumn: 'CreditLimit',
      dbType: 'MONEY',
      validation: [
        {
          type: 'custom',
          message: 'Credit limit must be zero or positive',
          validator: (value: number) => value >= 0,
        },
      ],
      editor: {
        type: 'money',
        placeholder: 'Enter credit limit',
        min: 0,
        step: 0.01,
      },
      display: {
        format: 'currency',
        align: 'right',
        searchable: false,
        sortable: true,
        width: '30%',
      },
    },
  ],
  
  // View-specific settings
  views: {
    table: {
      pageSize: 25,
      allowSelection: false, // Disable selection since no bulk actions are defined
      allowBulkActions: false, // No bulk actions for counterparties initially
      searchable: true,
      filterable: true,
      sortable: true,
      showPagination: true,
      densityOptions: true,
    },
    detail: {
      showEditButton: false, // Counterparties cannot be edited
      layout: 'single-column',
      showRelatedData: false,
    },
    form: {
      layout: 'single-column',
      showCancelButton: true,
      showSaveButton: true,
      autoSave: false,
      sections: [
        {
          title: 'Counterparty Information',
          fields: ['Counterparty', 'CreditLimit'],
          collapsible: false,
          defaultExpanded: true,
        },
      ],
    },
  },
  
  // Navigation
  routing: {
    basePath: '/counterparties',
    listPath: '/counterparties',
    newPath: '/counterparties/new',
    detailPath: '/counterparties/:id',
    // No edit path as counterparties cannot be edited
  },
  
  // Permissions
  permissions: {
    canCreate: true,
    canRead: true,
    canUpdate: false, // Counterparties cannot be updated
    canDelete: false, // Counterparties cannot be deleted
  },
}; 