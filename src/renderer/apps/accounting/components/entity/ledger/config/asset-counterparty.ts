import { LedgerTypeConfig } from '../types';

export const assetCounterpartyConfig: LedgerTypeConfig = {
  type: 'Asset',
  subtype: 'Counterparty',
  displayName: 'Asset Counterparty',
  pluralDisplayName: 'Asset Counterparties',
  description: 'Counterparty accounts for asset management and trading',
  
  database: {
    fetchFunction: 'dbo.Party_GET_Ledger_Asset_Counterparties_tvf',
    fetchParams: ['Party'],
    fetchColumns: {
      select: ['Ledger'], // TODO: Update based on actual database schema
      trimCharColumns: ['Ledger'],
    },
    addFunction: 'dbo.PartyLedger_Asset_Counterparty_ADD_tr',
    addParams: ['Party', 'Ledger'], // TODO: Update based on actual stored procedure
  },
  
  // TODO: Add additional fields based on requirements
  additionalFields: [],
  
  ui: {
    icon: 'AccountBox',
    color: '#2196f3',
    cardDescription: 'Counterparty asset accounts and relationships',
  },
}; 