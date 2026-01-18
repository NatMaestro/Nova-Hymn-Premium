import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDailyHymn } from '@/lib/api';
import { Hymn } from '@/types';

interface DailyHymnState {
  hymn: Hymn | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastFetchedDate: string | null; // Date string (YYYY-MM-DD) to check if we need to refetch
  cacheExpiry: number; // Cache duration in milliseconds (default: 24 hours, but check date)
}

const initialState: DailyHymnState = {
  hymn: null,
  loading: false,
  error: null,
  lastFetched: null,
  lastFetchedDate: null,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
};

// Get today's date string
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
};

// Async thunk for fetching daily hymn
export const fetchDailyHymn = createAsyncThunk(
  'dailyHymn/fetchDailyHymn',
  async (_, { getState }) => {
    const state = getState() as { dailyHymn: DailyHymnState };
    const today = getTodayDateString();
    
    // Check if we already fetched today's hymn
    if (state.dailyHymn.hymn && 
        state.dailyHymn.lastFetchedDate === today &&
        state.dailyHymn.lastFetched && 
        Date.now() - state.dailyHymn.lastFetched < state.dailyHymn.cacheExpiry) {
      return { hymn: state.dailyHymn.hymn, fromCache: true };
    }
    
    // Fetch from API
    const dailyHymnData = await getDailyHymn();
    
    // Transform to Hymn format
    const hymn: Hymn = {
      id: dailyHymnData.id,
      number: dailyHymnData.number,
      title: dailyHymnData.title,
      slug: dailyHymnData.slug,
      author: dailyHymnData.author,
      author_name: dailyHymnData.author_name,
      author_biography: dailyHymnData.author_biography || undefined,
      category: dailyHymnData.category,
      category_name: dailyHymnData.category_name,
      language: dailyHymnData.language,
      verses: dailyHymnData.verses || [],
      sheetMusicUrl: dailyHymnData.sheet_music_url || null,
      audioUrls: dailyHymnData.audio_urls || null,
      scriptureReferences: dailyHymnData.scripture_references || [],
      history: dailyHymnData.history || null,
      meter: dailyHymnData.meter || null,
      key_signature: dailyHymnData.key_signature || null,
      time_signature: dailyHymnData.time_signature || null,
      is_premium: dailyHymnData.is_premium,
      is_featured: dailyHymnData.is_featured,
      view_count: dailyHymnData.view_count,
      created_at: dailyHymnData.created_at,
      updated_at: dailyHymnData.updated_at,
    };
    
    return { hymn, fromCache: false };
  }
);

const dailyHymnSlice = createSlice({
  name: 'dailyHymn',
  initialState,
  reducers: {
    clearDailyHymn: (state) => {
      state.hymn = null;
      state.error = null;
      state.lastFetched = null;
      state.lastFetchedDate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyHymn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyHymn.fulfilled, (state, action) => {
        state.loading = false;
        const { hymn, fromCache } = action.payload;
        state.hymn = hymn;
        if (!fromCache) {
          state.lastFetched = Date.now();
          state.lastFetchedDate = getTodayDateString();
        }
      })
      .addCase(fetchDailyHymn.rejected, (state, action) => {
        state.loading = false;
        // Don't set error for 404 (no hymn available)
        if (action.error.message?.includes('404')) {
          state.hymn = null;
        } else {
          state.error = action.error.message || 'Failed to fetch daily hymn';
        }
      });
  },
});

export const { clearDailyHymn } = dailyHymnSlice.actions;
export default dailyHymnSlice.reducer;

