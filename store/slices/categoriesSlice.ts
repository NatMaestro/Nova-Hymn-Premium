import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheExpiry: number; // Cache duration in milliseconds (default: 30 minutes)
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
  cacheExpiry: 30 * 60 * 1000, // 30 minutes (categories don't change often)
};

// Async thunk for fetching categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { getState }) => {
    const state = getState() as { categories: CategoriesState };
    
    // Check cache
    if (state.categories.items.length > 0 && 
        state.categories.lastFetched && 
        Date.now() - state.categories.lastFetched < state.categories.cacheExpiry) {
      return { categories: state.categories.items, fromCache: true };
    }
    
    // Fetch from API
    const categories = await getCategories();
    return { categories, fromCache: false };
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories: (state) => {
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
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        const { categories, fromCache } = action.payload;
        state.items = categories;
        if (!fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      });
  },
});

export const { clearCategories, setCacheExpiry } = categoriesSlice.actions;
export default categoriesSlice.reducer;

