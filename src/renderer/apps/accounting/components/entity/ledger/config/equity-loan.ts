import { LedgerTypeConfig } from '../types';

// NOTE: Creditor and Borrower dropdown options are populated dynamically at runtime
// by combining results from:
// - dbo.Party_GET_Ledger_Asset_Counterparties_tvf (Asset Counterparties)
// - dbo.Party_GET_Ledger_EquityPartnership_tvf (Equity Partnerships)
// The form component should fetch these options using the current party from authSlice.selectCurrentParty

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
      select: ['Ledger', 'Creditor', 'Borrower', 'Status'],
      trimCharColumns: ['Ledger', 'Creditor', 'Borrower', 'Status'],
    },
    addFunction: 'dbo.PartyLedger_Equity_Loan_ADD_tr',
    addParams: ['Party', 'Ledger', 'Creditor', 'Borrower', 'Status'],
  },
  
  additionalFields: [
    {
      key: 'Creditor',
      label: 'Creditor Ledger',
      type: 'dropdown',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Creditor ledger is required'
        },
        {
          type: 'custom',
          message: 'Creditor and Borrower cannot be the same ledger',
          validator: (value: any, formData: any) => {
            return !formData?.Borrower || value !== formData.Borrower;
          }
        }
      ],
      editor: {
        type: 'dropdown',
        placeholder: 'Select creditor ledger',
        // Options will be dynamically populated from:
        // - dbo.Party_GET_Ledger_Asset_Counterparties_tvf results
        // - dbo.Party_GET_Ledger_EquityPartnership_tvf results
        options: [] // Dynamic options populated at runtime
      }
    },
    {
      key: 'Borrower',
      label: 'Borrower Ledger',
      type: 'dropdown',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Borrower ledger is required'
        },
        {
          type: 'custom',
          message: 'Borrower and Creditor cannot be the same ledger',
          validator: (value: any, formData: any) => {
            return !formData?.Creditor || value !== formData.Creditor;
          }
        }
      ],
      editor: {
        type: 'dropdown',
        placeholder: 'Select borrower ledger',
        // Options will be dynamically populated from:
        // - dbo.Party_GET_Ledger_Asset_Counterparties_tvf results
        // - dbo.Party_GET_Ledger_EquityPartnership_tvf results
        options: [] // Dynamic options populated at runtime
      }
    },
    {
      key: 'Status',
      label: 'Loan Status',
      type: 'dropdown',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'Loan status is required'
        }
      ],
      editor: {
        type: 'dropdown',
        placeholder: 'Select loan status',
        // Options are dynamically loaded from dbo.LoanStatusType table
        options: []
      }
    }
  ],
  
  ui: {
    icon: 'AccountBalance',
    color: '#ff5722',
    cardDescription: 'Loan agreements and debt structures',
  },
}; 