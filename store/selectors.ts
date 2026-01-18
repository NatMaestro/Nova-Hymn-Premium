import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';
import { Hymn } from '@/types';

// Hymns selectors
export const selectAllHymns = (state: RootState) => state.hymns.items;
export const selectHymnsLoading = (state: RootState) => state.hymns.loading;
export const selectHymnsError = (state: RootState) => state.hymns.error;
export const selectCurrentHymn = (state: RootState) => state.hymns.currentHymn;

// Select hymns by denomination and period
export const selectHymnsByDenomination = (
  state: RootState,
  denominationId?: number,
  period?: 'new' | 'old'
): Hymn[] => {
  if (!denominationId) {
    return [];
  }
  const cacheKey = period ? `${denominationId}_${period}` : `${denominationId}_all`;
  return state.hymns.itemsByDenomination[cacheKey] || [];
};

// Select hymn by ID
export const selectHymnById = createSelector(
  [
    (state: RootState) => state.hymns.items,
    (_: RootState, id: number) => id,
  ],
  (hymns, id) => hymns.find(hymn => hymn.id === id)
);

// Categories selectors
export const selectAllCategories = (state: RootState) => state.categories.items;
export const selectCategoriesLoading = (state: RootState) => state.categories.loading;
export const selectCategoriesError = (state: RootState) => state.categories.error;

// Denominations selectors
export const selectAllDenominations = (state: RootState) => state.denominations.items;
export const selectDenominationsLoading = (state: RootState) => state.denominations.loading;
export const selectDenominationsError = (state: RootState) => state.denominations.error;

// Daily hymn selectors
export const selectDailyHymn = (state: RootState) => state.dailyHymn.hymn;
export const selectDailyHymnLoading = (state: RootState) => state.dailyHymn.loading;
export const selectDailyHymnError = (state: RootState) => state.dailyHymn.error;

// Favorites selectors
export const selectFavoriteIds = (state: RootState) => state.favorites.hymnIds;
export const selectFavoriteHymns = (state: RootState) => state.favorites.hymns;
export const selectFavoritesLoading = (state: RootState) => state.favorites.loading;

// Select favorite hymns with full data
export const selectFavoriteHymnsWithData = createSelector(
  [
    (state: RootState) => state.favorites.hymnIds,
    (state: RootState) => state.hymns.items,
  ],
  (favoriteIds, allHymns) => {
    return favoriteIds
      .map(id => allHymns.find(hymn => hymn.id === id))
      .filter((hymn): hymn is Hymn => hymn !== undefined);
  }
);

// Check if hymn is favorite
export const selectIsFavorite = createSelector(
  [
    (state: RootState) => state.favorites.hymnIds,
    (_: RootState, hymnId: number) => hymnId,
  ],
  (favoriteIds, hymnId) => favoriteIds.includes(hymnId)
);

