import { LedgerTypeConfig } from '../types';

export const equityPartnershipConfig: LedgerTypeConfig = {
  type: 'Equity',
  subtype: 'Partnership',
  displayName: 'Equity Partnership',
  pluralDisplayName: 'Equity Partnerships',
  description: 'Partnership agreements with counterparty percentage allocations',
  
  database: {
    fetchFunction: 'dbo.Party_GET_Ledger_Equity_Partnerships_tvf',
    fetchParams: ['Party'],
    fetchColumns: {
      select: ['Ledger', 'Description'],
      trimCharColumns: ['Ledger'],
    },
    addFunction: 'dbo.PartyLedger_Equity_Partnership_ADD_tr',
    addParams: ['Party', 'Ledger', 'counterpartyPercentages'],
  },
  
  // Additional fields beyond Party and Ledger
  additionalFields: [
    {
      key: 'counterpartyPercentages',
      label: 'Counterparty Percentages',
      type: 'table',
      required: true,
      validation: [
        {
          type: 'required',
          message: 'At least one counterparty percentage is required',
        },
        {
          type: 'custom',
          message: 'Percentage totals must equal 100%',
          validator: (value: any[]) => {
            if (!Array.isArray(value) || value.length === 0) return false;
            const total = value.reduce((sum, item) => {
              const percentage = (item.Percent_Numerator / item.Percent_Denominator) * 100;
              return sum + percentage;
            }, 0);
            return Math.abs(total - 100) < 0.01; // Allow for floating point precision
          },
        },
        {
          type: 'custom',
          message: 'Each counterparty can only be selected once',
          validator: (value: any[]) => {
            if (!Array.isArray(value) || value.length <= 1) return true;
            const counterparties = value.map(item => item.Counterparty).filter(Boolean);
            const uniqueCounterparties = new Set(counterparties);
            return counterparties.length === uniqueCounterparties.size;
          },
        },
      ],
      editor: {
        type: 'table',
        tableConfig: {
          columns: [
            {
              key: 'Counterparty',
              label: 'Counterparty',
              type: 'dropdown',
              required: true,
              validation: [
                {
                  type: 'required',
                  message: 'Counterparty is required',
                },
              ],
            },
            {
              key: 'Percent_Numerator',
              label: 'Percentage Numerator',
              type: 'number',
              required: true,
              validation: [
                {
                  type: 'required',
                  message: 'Numerator is required',
                },
                {
                  type: 'custom',
                  message: 'Numerator must be positive',
                  validator: (value: number) => value > 0,
                },
              ],
            },
            {
              key: 'Percent_Denominator',
              label: 'Percentage Denominator',
              type: 'number',
              required: true,
              validation: [
                {
                  type: 'required',
                  message: 'Denominator is required',
                },
                {
                  type: 'custom',
                  message: 'Denominator must be positive',
                  validator: (value: number) => value > 0,
                },
              ],
            },
          ],
          allowAdd: true,
          allowRemove: true,
        },
      },
      display: {
        align: 'left',
      },
    },
  ],
  
  ui: {
    icon: 'Handshake',
    color: '#ff9800',
    cardDescription: 'Manage partnership agreements and percentage allocations',
  },
}; 