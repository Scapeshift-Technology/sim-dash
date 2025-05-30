import { LedgerTypeConfig } from '../types';

export const assetBankrollConfig: LedgerTypeConfig = {
  type: 'Asset',
  subtype: 'Bankroll',
  displayName: 'Asset Bankroll',
  pluralDisplayName: 'Asset Bankrolls',
  description: 'Cash and digital asset bankrolls for party operations',
  
  database: {
    fetchFunction: 'dbo.Party_GET_Ledger_Asset_Bankrolls_tvf',
    fetchParams: ['Party'],
    fetchColumns: {
      select: ['Ledger'],
      trimCharColumns: ['Ledger'],
    },
    addFunction: 'dbo.PartyLedger_Asset_Bankroll_ADD_tr',
    addParams: ['Party', 'Ledger'],
  },
  
  // No additional fields beyond Party and Ledger
  additionalFields: [],
  
  ui: {
    icon: 'AccountBalance',
    color: '#4caf50',
    cardDescription: 'Manage cash and digital asset bankrolls',
  },
}; 