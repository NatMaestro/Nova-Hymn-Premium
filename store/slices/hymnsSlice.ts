import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getHymns, getHymnById } from '@/lib/api';
import { Hymn } from '@/types';

interface HymnsState {
  items: Hymn[];
  itemsByDenomination: Record<string, Hymn[]>; // Key: "denominationId_period" or "denominationId"
  currentHymn: Hymn | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // Timestamp
  cacheExpiry: number; // Cache duration in milliseconds (default: 5 minutes)
}

const initialState: HymnsState = {
  items: [],
  itemsByDenomination: {},
  currentHymn: null,
  loading: false,
  error: null,
  lastFetched: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// Async thunk for fetching hymns
export const fetchHymns = createAsyncThunk(
  'hymns/fetchHymns',
  async (params?: { denomination?: number; hymn_period?: 'new' | 'old' }, { getState }) => {
    const state = getState() as { hymns: HymnsState };
    const cacheKey = params 
      ? `${params.denomination || 'all'}_${params.hymn_period || 'all'}`
      : 'all';
    
    // Check cache
    const cachedHymns = state.hymns.itemsByDenomination[cacheKey];
    const lastFetched = state.hymns.lastFetched;
    const cacheExpiry = state.hymns.cacheExpiry;
    
    if (cachedHymns && lastFetched && Date.now() - lastFetched < cacheExpiry) {
      // Return cached data
      return { hymns: cachedHymns, cacheKey, fromCache: true };
    }
    
    // Fetch from API
    const response = await getHymns(params);
    const hymns: Hymn[] = response.results.map((h) => ({
      id: h.id,
      number: h.number,
      title: h.title,
      slug: h.slug,
      author: h.author,
      author_name: h.author_name,
      category: h.category,
      category_name: h.category_name,
      language: h.language,
      is_premium: h.is_premium,
      is_featured: h.is_featured,
      view_count: h.view_count,
      created_at: h.created_at,
    }));
    
    return { hymns, cacheKey, fromCache: false };
  }
);

// Async thunk for fetching single hymn
export const fetchHymnById = createAsyncThunk(
  'hymns/fetchHymnById',
  async (
    { id, params }: { id: number; params?: { denomination?: number; hymn_period?: 'new' | 'old' } },
    { getState }
  ) => {
    const state = getState() as { hymns: HymnsState };
    
    // Check if hymn is already in cache
    const existingHymn = state.hymns.items.find(h => h.id === id);
    if (existingHymn && state.hymns.currentHymn?.id === id) {
      return { hymn: state.hymns.currentHymn, fromCache: true };
    }
    
    // Fetch from API
    const hymnData = await getHymnById(id, params);
    
    // Transform to Hymn format
    const hymn: Hymn = {
      id: hymnData.id,
      number: hymnData.number,
      title: hymnData.title,
      slug: hymnData.slug,
      author: hymnData.author,
      author_name: hymnData.author_name,
      author_biography: hymnData.author_biography || undefined,
      category: hymnData.category,
      category_name: hymnData.category_name,
      language: hymnData.language,
      verses: hymnData.verses || [],
      sheetMusicUrl: hymnData.sheet_music_url || null,
      audioUrls: hymnData.audio_urls || null,
      scriptureReferences: hymnData.scripture_references || [],
      history: hymnData.history || null,
      meter: hymnData.meter || null,
      key_signature: hymnData.key_signature || null,
      time_signature: hymnData.time_signature || null,
      is_premium: hymnData.is_premium,
      is_featured: hymnData.is_featured,
      view_count: hymnData.view_count,
      created_at: hymnData.created_at,
      updated_at: hymnData.updated_at,
    };
    
    return { hymn, fromCache: false };
  }
);

const hymnsSlice = createSlice({
  name: 'hymns',
  initialState,
  reducers: {
    clearHymns: (state) => {
      state.items = [];
      state.itemsByDenomination = {};
      state.currentHymn = null;
      state.error = null;
    },
    clearCache: (state) => {
      state.itemsByDenomination = {};
      state.lastFetched = null;
    },
    setCacheExpiry: (state, action: PayloadAction<number>) => {
      state.cacheExpiry = action.payload;
    },
    updateHymn: (state, action: PayloadAction<Hymn>) => {
      const index = state.items.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      // Update in denomination cache
      Object.keys(state.itemsByDenomination).forEach(key => {
        const denomIndex = state.itemsByDenomination[key].findIndex(h => h.id === action.payload.id);
        if (denomIndex !== -1) {
          state.itemsByDenomination[key][denomIndex] = action.payload;
        }
      });
      // Update current hymn if it's the same
      if (state.currentHymn?.id === action.payload.id) {
        state.currentHymn = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch hymns
      .addCase(fetchHymns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHymns.fulfilled, (state, action) => {
        state.loading = false;
        const { hymns, cacheKey, fromCache } = action.payload;
        
        // Update cache
        state.itemsByDenomination[cacheKey] = hymns;
        
        // Merge into main items array (avoid duplicates)
        hymns.forEach(hymn => {
          if (!state.items.find(h => h.id === hymn.id)) {
            state.items.push(hymn);
          }
        });
        
        if (!fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchHymns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch hymns';
      })
      // Fetch hymn by ID
      .addCase(fetchHymnById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHymnById.fulfilled, (state, action) => {
        state.loading = false;
        const { hymn, fromCache } = action.payload;
        state.currentHymn = hymn;
        
        // Add to items if not already present
        if (!state.items.find(h => h.id === hymn.id)) {
          state.items.push(hymn);
        }
      })
      .addCase(fetchHymnById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch hymn';
      });
  },
});

export const { clearHymns, clearCache, setCacheExpiry, updateHymn } = hymnsSlice.actions;
export default hymnsSlice.reducer;

