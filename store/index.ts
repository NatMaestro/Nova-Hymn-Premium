import { configureStore } from '@reduxjs/toolkit';
import hymnsReducer from './slices/hymnsSlice';
import categoriesReducer from './slices/categoriesSlice';
import denominationsReducer from './slices/denominationsSlice';
import dailyHymnReducer from './slices/dailyHymnSlice';
import favoritesReducer from './slices/favoritesSlice';

export const store = configureStore({
  reducer: {
    hymns: hymnsReducer,
    categories: categoriesReducer,
    denominations: denominationsReducer,
    dailyHymn: dailyHymnReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['hymns/fetchHymns/fulfilled', 'categories/fetchCategories/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp', 'meta.arg'],
        // Ignore these paths in the state
        ignoredPaths: ['hymns.cache', 'categories.cache'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

