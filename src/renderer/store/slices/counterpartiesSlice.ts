import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';

// ---------- Types ----------

export interface Counterparty {
  Party: string;
  Counterparty: string;
  CreditLimit: number;
}

export interface CounterpartiesState {
  items: Counterparty[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Form operations
  formLoading: boolean;
  formError: string | null;
}

// ---------- Initial State ----------

const initialState: CounterpartiesState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
  formLoading: false,
  formError: null,
};

// ---------- Async Thunks ----------

// Fetch all counterparties for the current party
export const fetchCounterparties = createAsyncThunk<
  Counterparty[], // Return type on success
  string, // Party argument
  { rejectValue: string }
>(
  'counterparties/fetchCounterparties',
  async (party, { rejectWithValue }) => {
    try {
      if (!window.electronAPI?.executeSqlQuery) {
        throw new Error('SQL execution API is not available.');
      }
      
      // Query with explicit column selection instead of SELECT *
      const query = `SELECT Counterparty, CreditLimit FROM dbo.Party_GET_Counterparties_tvf('${party.replace(/'/g, "''")}')`;
      const result = await window.electronAPI.executeSqlQuery(query);
      
      // Transform the data to include Party field and trim CHAR fields
      const transformedData = (result.recordset || []).map((row: any) => ({
        Party: party.trim(), // Set Party to the current party parameter
        Counterparty: (row.Counterparty || '').trim(), // Trim CHAR(16) padding
        CreditLimit: Number(row.CreditLimit || 0)
      }));
      
      return transformedData;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch counterparties');
    }
  }
);

// Add a new counterparty
export const addCounterparty = createAsyncThunk<
  void, // Return type on success
  { party: string; counterparty: string; creditLimit?: number }, // Arguments
  { rejectValue: string }
>(
  'counterparties/addCounterparty',
  async ({ party, counterparty, creditLimit = 0 }, { rejectWithValue }) => {
    try {
      if (!window.electronAPI?.executeSqlQuery) {
        throw new Error('SQL execution API is not available.');
      }
      
      // Escape single quotes in parameters
      const escapedParty = party.replace(/'/g, "''");
      const escapedCounterparty = counterparty.replace(/'/g, "''");
      
      const query = `EXEC dbo.PartyCounterparty_ADD_tr @Party = '${escapedParty}', @Counterparty = '${escapedCounterparty}', @CreditLimit = ${creditLimit}`;
      await window.electronAPI.executeSqlQuery(query);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add counterparty');
    }
  }
);

// ---------- Slice ----------

export const counterpartiesSlice = createSlice({
  name: 'counterparties',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.formError = null;
    },
    
    // Clear form error specifically
    clearFormError: (state) => {
      state.formError = null;
    },
    
    // Clear counterparties when party changes
    clearCounterparties: (state) => {
      state.items = [];
      state.error = null;
      state.formError = null;
      state.lastUpdated = null;
    },
    
    // Reset entire state
    resetState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch counterparties
    builder
      .addCase(fetchCounterparties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCounterparties.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchCounterparties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch counterparties';
      });

    // Add counterparty
    builder
      .addCase(addCounterparty.pending, (state) => {
        state.formLoading = true;
        state.formError = null;
      })
      .addCase(addCounterparty.fulfilled, (state) => {
        state.formLoading = false;
        state.formError = null;
        // Note: We'll need to refetch the list after adding
        // This could be optimized by adding the new item to the state directly
      })
      .addCase(addCounterparty.rejected, (state, action) => {
        state.formLoading = false;
        state.formError = action.payload || 'Failed to add counterparty';
      });
  },
});

// ---------- Actions ----------

export const {
  clearError,
  clearFormError,
  clearCounterparties,
  resetState,
} = counterpartiesSlice.actions;

// ---------- Selectors ----------

export const selectCounterpartiesState = (state: RootState) => state.counterparties;
export const selectCounterparties = (state: RootState) => state.counterparties.items;
export const selectCounterpartiesLoading = (state: RootState) => state.counterparties.loading;
export const selectCounterpartiesError = (state: RootState) => state.counterparties.error;
export const selectCounterpartiesLastUpdated = (state: RootState) => state.counterparties.lastUpdated;

export const selectCounterpartiesFormLoading = (state: RootState) => state.counterparties.formLoading;
export const selectCounterpartiesFormError = (state: RootState) => state.counterparties.formError;

// Derived selectors
export const selectCounterpartiesCount = (state: RootState) => state.counterparties.items.length;

export const selectCounterpartiesByParty = (party: string) => (state: RootState) =>
  state.counterparties.items.filter(item => item.Party === party);

export const selectCounterpartyByName = (party: string, counterpartyName: string) => (state: RootState) =>
  state.counterparties.items.find(item => 
    item.Party === party && item.Counterparty === counterpartyName
  );

// ---------- Export ----------

export default counterpartiesSlice.reducer; 