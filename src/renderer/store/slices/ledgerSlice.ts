import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { 
  LedgerState, 
  LedgerType, 
  LedgerSubtype, 
  LedgerItem, 
  getLedgerKey 
} from '@/accounting/components/entity/ledger/types';
import { getLedgerTypeConfig } from '@/accounting/components/entity/ledger/config';

// Initial state
const initialState: LedgerState = {
  currentType: null,
  currentSubtype: null,
  items: {},
  loading: {},
  errors: {},
  formLoading: false,
  formError: null,
};

// Helper function to build SQL queries following useEntityCRUD pattern
const buildSqlQuery = (
  functionName: string, 
  params: Record<string, any> = {},
  selectColumns?: string[]
): string => {
  // Check if we have table-valued parameters
  const hasTableParams = Object.entries(params).some(([key, value]) => 
    key === 'counterpartyPercentages' && Array.isArray(value)
  );

  if (hasTableParams) {
    // Handle stored procedures with table-valued parameters
    return buildStoredProcedureWithTableParams(functionName, params);
  }

  // Original logic for simple parameters
  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle different value types for SQL
      if (typeof value === 'string') {
        // Escape single quotes in strings
        const escapedValue = value.replace(/'/g, "''");
        return `@${key} = '${escapedValue}'`;
      } else if (typeof value === 'number') {
        return `@${key} = ${value}`;
      } else if (typeof value === 'boolean') {
        return `@${key} = ${value ? 1 : 0}`;
      } else if (value && Object.prototype.toString.call(value) === '[object Date]') {
        return `@${key} = '${(value as Date).toISOString()}'`;
      } else {
        // Convert to string as fallback
        return `@${key} = '${String(value)}'`;
      }
    })
    .join(', ');

  // Determine if it's a function call or stored procedure
  if (functionName.includes('_tr') || functionName.includes('EXEC')) {
    // Stored procedure
    return paramString 
      ? `EXEC ${functionName} ${paramString}`
      : `EXEC ${functionName}`;
  } else {
    // Table-valued function with explicit column selection
    const columnList = selectColumns ? selectColumns.join(', ') : '*';
    
    return paramString 
      ? `SELECT ${columnList} FROM ${functionName}(${Object.values(params).map(value => {
          if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
          }
          return value;
        }).join(', ')})`
      : `SELECT ${columnList} FROM ${functionName}()`;
  }
};

// Helper function to build stored procedure calls with table-valued parameters
const buildStoredProcedureWithTableParams = (
  functionName: string,
  params: Record<string, any>
): string => {
  let sql = '';
  
  // Handle counterpartyPercentages table parameter
  if (params.counterpartyPercentages && Array.isArray(params.counterpartyPercentages)) {
    sql += 'DECLARE @counterpartyPercentages CounterpartyPercentageTableType;\n';
    
    // Insert each counterparty percentage into the table variable
    params.counterpartyPercentages.forEach((item: any) => {
      const counterparty = item.Counterparty ? item.Counterparty.replace(/'/g, "''") : '';
      const numerator = item.Percent_Numerator || 0;
      const denominator = item.Percent_Denominator || 1;
      
      sql += `INSERT INTO @counterpartyPercentages (Counterparty, Percent_Numerator, Percent_Denominator) VALUES ('${counterparty}', ${numerator}, ${denominator});\n`;
    });
  }

  // Build the parameter string for non-table parameters
  const simpleParams = Object.entries(params)
    .filter(([key, value]) => key !== 'counterpartyPercentages' && value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        const escapedValue = value.replace(/'/g, "''");
        return `@${key} = '${escapedValue}'`;
      } else if (typeof value === 'number') {
        return `@${key} = ${value}`;
      } else if (typeof value === 'boolean') {
        return `@${key} = ${value ? 1 : 0}`;
      } else if (value && Object.prototype.toString.call(value) === '[object Date]') {
        return `@${key} = '${(value as Date).toISOString()}'`;
      } else {
        return `@${key} = '${String(value)}'`;
      }
    });

  // Add table parameter to the parameter list
  if (params.counterpartyPercentages) {
    simpleParams.push('@counterpartyPercentages = @counterpartyPercentages');
  }

  // Build the final EXEC statement
  sql += `EXEC ${functionName}`;
  if (simpleParams.length > 0) {
    sql += ` ${simpleParams.join(', ')}`;
  }
  sql += ';';

  return sql;
};

// Helper function to execute SQL with logging
const executeSqlWithLogging = async (query: string, functionName: string, params: any) => {
  console.log(`[Ledger DB] Calling ${functionName} with params:`, params);
  
  if (!window.electronAPI?.executeSqlQuery) {
    const error = 'SQL execution API is not available.';
    console.error(`[Ledger DB] ${functionName} FAILED:`, error);
    throw new Error(error);
  }
  
  try {
    const result = await window.electronAPI.executeSqlQuery(query);
    console.log(`[Ledger DB] ${functionName} SUCCESS:`, result);
    return result;
  } catch (error: any) {
    console.error(`[Ledger DB] ${functionName} FAILED:`, error);
    console.error(`[Ledger DB] Query was: ${query}`);
    throw new Error(error.message || 'Database operation failed');
  }
};

// Async thunks
export const fetchLedgerItems = createAsyncThunk(
  'ledger/fetchItems',
  async ({ party, type, subtype }: { party: string; type: LedgerType; subtype: LedgerSubtype }) => {
    const config = getLedgerTypeConfig(type, subtype);
    if (!config) {
      throw new Error(`Configuration not found for ${type} ${subtype}`);
    }

    const { fetchFunction, fetchParams, fetchColumns } = config.database;
    const params = { [fetchParams[0]]: party }; // First param is always Party
    
    // Build SQL query for table-valued function
    const query = buildSqlQuery(fetchFunction, params, fetchColumns.select);
    
    // Execute with logging
    const result = await executeSqlWithLogging(query, fetchFunction, params);

    if (!result.recordset) {
      throw new Error('No data returned from database');
    }

    // Process the data - trim CHAR columns if needed
    let processedData = result.recordset || [];
    if (fetchColumns.trimCharColumns) {
      processedData = processedData.map((item: any) => {
        const trimmedItem = { ...item };
        fetchColumns.trimCharColumns!.forEach(column => {
          if (trimmedItem[column] && typeof trimmedItem[column] === 'string') {
            trimmedItem[column] = trimmedItem[column].trim();
          }
        });
        return trimmedItem;
      });
    }

    return {
      key: getLedgerKey(type, subtype),
      items: processedData,
    };
  }
);

export const addLedgerItem = createAsyncThunk(
  'ledger/addItem',
  async ({ 
    party, 
    type, 
    subtype, 
    data 
  }: { 
    party: string; 
    type: LedgerType; 
    subtype: LedgerSubtype; 
    data: any;
  }) => {
    const config = getLedgerTypeConfig(type, subtype);
    if (!config) {
      throw new Error(`Configuration not found for ${type} ${subtype}`);
    }

    const { addFunction, addParams } = config.database;
    
    // Build parameters for the stored procedure
    const params: any = {
      [addParams[0]]: party,  // Party
      [addParams[1]]: data.Ledger,  // Ledger name
    };

    // Add additional parameters based on the specific type
    if (addParams.length > 2) {
      for (let i = 2; i < addParams.length; i++) {
        const paramName = addParams[i];
        params[paramName] = data[paramName];
      }
    }

    // Build SQL query for stored procedure
    const query = buildSqlQuery(addFunction, params);
    
    // Execute with logging
    await executeSqlWithLogging(query, addFunction, params);

    return {
      type,
      subtype,
      data,
    };
  }
);

export const deleteLedgerItem = createAsyncThunk(
  'ledger/deleteItem',
  async ({ 
    party, 
    ledgerName, 
    type, 
    subtype 
  }: { 
    party: string; 
    ledgerName: string; 
    type: LedgerType; 
    subtype: LedgerSubtype;
  }) => {
    const functionName = 'dbo.PartyLedger_DELETE_tr';
    const params = {
      Party: party,
      Ledger: ledgerName,
    };

    // Build SQL query for stored procedure
    const query = buildSqlQuery(functionName, params);
    
    // Execute with logging
    await executeSqlWithLogging(query, functionName, params);

    return {
      type,
      subtype,
      ledgerName,
    };
  }
);

// Create the slice
const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setCurrentNavigation: (state, action: PayloadAction<{ type: LedgerType | null; subtype: LedgerSubtype | null }>) => {
      state.currentType = action.payload.type;
      state.currentSubtype = action.payload.subtype;
    },
    
    clearError: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      state.errors[key] = null;
    },
    
    clearFormError: (state) => {
      state.formError = null;
    },
    
    clearLedgerItems: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.items[key];
      delete state.loading[key];
      delete state.errors[key];
    },
    
    clearAllLedgerItems: (state) => {
      state.items = {};
      state.loading = {};
      state.errors = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch ledger items
    builder
      .addCase(fetchLedgerItems.pending, (state, action) => {
        const { type, subtype } = action.meta.arg;
        const key = getLedgerKey(type, subtype);
        state.loading[key] = true;
        state.errors[key] = null;
      })
      .addCase(fetchLedgerItems.fulfilled, (state, action) => {
        const { key, items } = action.payload;
        state.loading[key] = false;
        state.items[key] = items;
        state.errors[key] = null;
      })
      .addCase(fetchLedgerItems.rejected, (state, action) => {
        const { type, subtype } = action.meta.arg;
        const key = getLedgerKey(type, subtype);
        state.loading[key] = false;
        state.errors[key] = action.error.message || 'Failed to fetch ledger items';
      });

    // Add ledger item
    builder
      .addCase(addLedgerItem.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(addLedgerItem.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        
        // Add the new item to the appropriate list if it's currently loaded
        const { type, subtype } = action.payload;
        const key = getLedgerKey(type, subtype);
        if (state.items[key]) {
          // For now, we'll just trigger a refresh by clearing the items
          // In a more sophisticated approach, we could add the item directly
          delete state.items[key];
        }
      })
      .addCase(addLedgerItem.rejected, (state, action) => {
        state.formLoading = false;
        state.formError = action.error.message || 'Failed to add ledger item';
      });

    // Delete ledger item
    builder
      .addCase(deleteLedgerItem.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(deleteLedgerItem.fulfilled, (state, action) => {
        state.formLoading = false;
        state.formError = null;
        
        // Remove the item from the appropriate list if it's currently loaded
        const { type, subtype, ledgerName } = action.payload;
        const key = getLedgerKey(type, subtype);
        if (state.items[key]) {
          state.items[key] = state.items[key].filter(
            (item: LedgerItem) => item.Ledger !== ledgerName
          );
        }
      })
      .addCase(deleteLedgerItem.rejected, (state, action) => {
        state.formLoading = false;
        state.formError = action.error.message || 'Failed to delete ledger item';
      });
  },
});

// Export actions
export const {
  setCurrentNavigation,
  clearError,
  clearFormError,
  clearLedgerItems,
  clearAllLedgerItems,
} = ledgerSlice.actions;

// Selectors
export const selectCurrentLedgerNavigation = (state: RootState) => ({
  type: state.ledger.currentType,
  subtype: state.ledger.currentSubtype,
});

export const selectLedgerItems = (state: RootState, type: LedgerType, subtype: LedgerSubtype) => {
  const key = getLedgerKey(type, subtype);
  return state.ledger.items[key] || [];
};

export const selectLedgerLoading = (state: RootState, type: LedgerType, subtype: LedgerSubtype) => {
  const key = getLedgerKey(type, subtype);
  return state.ledger.loading[key] || false;
};

export const selectLedgerError = (state: RootState, type: LedgerType, subtype: LedgerSubtype) => {
  const key = getLedgerKey(type, subtype);
  return state.ledger.errors[key] || null;
};

export const selectLedgerFormLoading = (state: RootState) => state.ledger.formLoading;
export const selectLedgerFormError = (state: RootState) => state.ledger.formError;

// Export reducer
export default ledgerSlice.reducer; 