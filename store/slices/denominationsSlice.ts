import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDenominations } from '@/lib/api';
import { Denomination } from '@/types';

interface DenominationsState {
  items: Denomination[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheExpiry: number; // Cache duration in milliseconds (default: 1 hour)
}

const initialState: DenominationsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
  cacheExpiry: 60 * 60 * 1000, // 1 hour (denominations rarely change)
};

// Async thunk for fetching denominations
export const fetchDenominations = createAsyncThunk(
  'denominations/fetchDenominations',
  async (_, { getState }) => {
    const state = getState() as { denominations: DenominationsState };
    
    // Check cache
    if (state.denominations.items.length > 0 && 
        state.denominations.lastFetched && 
        Date.now() - state.denominations.lastFetched < state.denominations.cacheExpiry) {
      return { denominations: state.denominations.items, fromCache: true };
    }
    
    // Fetch from API
    const denominations = await getDenominations();
    return { denominations, fromCache: false };
  }
);

const denominationsSlice = createSlice({
  name: 'denominations',
  initialState,
  reducers: {
    clearDenominations: (state) => {
      state.items = [];
      state.error = null;
      state.lastFetched = null;
    },
    setCacheExpiry: (state, action) => {
      state.cacheExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDenominations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDenominations.fulfilled, (state, action) => {
        state.loading = false;
        const { denominations, fromCache } = action.payload;
        state.items = denominations;
        if (!fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchDenominations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch denominations';
      });
  },
});

export const { clearDenominations, setCacheExpiry } = denominationsSlice.actions;
export default denominationsSlice.reducer;

