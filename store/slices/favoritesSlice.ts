import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hymn } from '@/types';

const FAVORITES_KEY = 'favorite_hymns';

interface FavoritesState {
  hymnIds: number[];
  hymns: Hymn[]; // Cached hymn objects
  loading: boolean;
}

const initialState: FavoritesState = {
  hymnIds: [],
  hymns: [],
  loading: false,
};

// Load favorites from AsyncStorage
export const loadFavorites = async (): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// Save favorites to AsyncStorage
export const saveFavorites = async (favoriteIds: number[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavorites: (state, action: PayloadAction<number[]>) => {
      state.hymnIds = action.payload;
    },
    addFavorite: (state, action: PayloadAction<number>) => {
      if (!state.hymnIds.includes(action.payload)) {
        state.hymnIds.push(action.payload);
        saveFavorites(state.hymnIds);
      }
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      state.hymnIds = state.hymnIds.filter(id => id !== action.payload);
      saveFavorites(state.hymnIds);
    },
    setFavoriteHymns: (state, action: PayloadAction<Hymn[]>) => {
      state.hymns = action.payload;
    },
    addFavoriteHymn: (state, action: PayloadAction<Hymn>) => {
      if (!state.hymns.find(h => h.id === action.payload.id)) {
        state.hymns.push(action.payload);
      }
    },
    removeFavoriteHymn: (state, action: PayloadAction<number>) => {
      state.hymns = state.hymns.filter(h => h.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setFavorites,
  addFavorite,
  removeFavorite,
  setFavoriteHymns,
  addFavoriteHymn,
  removeFavoriteHymn,
  setLoading,
} = favoritesSlice.actions;
export default favoritesSlice.reducer;

