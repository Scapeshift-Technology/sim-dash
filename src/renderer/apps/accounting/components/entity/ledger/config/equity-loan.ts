import { LedgerTypeConfig } from '../types';

export const equityLoanConfig: LedgerTypeConfig = {
  type: 'Equity',
  subtype: 'Loan',
  displayName: 'Equity Loan',
  pluralDisplayName: 'Equity Loans',
  description: 'Loan agreements and debt structures within equity arrangements',
  
  database: {
    fetchFunction: 'dbo.Party_GET_Ledger_Equity_Loans_tvf',
    fetchParams: ['Party'],
    fetchColumns: {
      select: ['Ledger'], // TODO: Update based on actual database schema
      trimCharColumns: ['Ledger'],
    },
    addFunction: 'dbo.PartyLedger_Equity_Loan_ADD_tr',
    addParams: ['Party', 'Ledger'], // TODO: Update based on actual stored procedure
  },
  
  // TODO: Add additional fields based on requirements (e.g., interest rate, term, amount)
  additionalFields: [],
  
  ui: {
    icon: 'AccountBalance',
    color: '#ff5722',
    cardDescription: 'Manage loan agreements and debt structures',
  },
}; 