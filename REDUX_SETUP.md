# Redux Setup Documentation

## Overview

Redux Toolkit has been integrated into the app to provide centralized state management and intelligent caching, reducing unnecessary API calls and improving performance.

## Architecture

### Store Structure
```
store/
├── index.ts              # Store configuration
├── hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
├── selectors.ts          # Reusable selectors
└── slices/
    ├── hymnsSlice.ts     # Hymns state management
    ├── categoriesSlice.ts # Categories state management
    ├── denominationsSlice.ts # Denominations state management
    ├── dailyHymnSlice.ts # Daily hymn state management
    └── favoritesSlice.ts # Favorites state management
```

## Features

### 1. **Intelligent Caching**
- **Hymns**: Cached for 5 minutes per denomination/period combination
- **Categories**: Cached for 30 minutes (rarely change)
- **Denominations**: Cached for 1 hour (rarely change)
- **Daily Hymn**: Cached until next day (date-based check)

### 2. **Automatic Cache Invalidation**
- Cache expires based on timestamps
- Daily hymn automatically refreshes on new day
- Manual cache clearing available

### 3. **Denomination-Based Caching**
Hymns are cached separately for each denomination/period combination:
- `1_new` - Catholic New hymns
- `1_old` - Catholic Old hymns
- `2_all` - Methodist hymns
- `3_all` - Baptist hymns

## Usage

### Basic Setup

The Redux store is already integrated in `app/_layout.tsx`:

```typescript
import { Provider } from "react-redux";
import { store } from "@/store";

<Provider store={store}>
  {/* Your app */}
</Provider>
```

### Using Redux in Components

#### 1. Import Hooks and Actions
```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHymns, fetchHymnById } from "@/store/slices/hymnsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchDailyHymn } from "@/store/slices/dailyHymnSlice";
import {
  selectHymnsByDenomination,
  selectHymnsLoading,
  selectAllCategories,
  // ... other selectors
} from "@/store/selectors";
```

#### 2. Use in Component
```typescript
const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  
  // Select data from Redux
  const hymns = useAppSelector((state) =>
    selectHymnsByDenomination(
      state,
      selectedDenomination?.id,
      selectedPeriod
    )
  );
  const loading = useAppSelector(selectHymnsLoading);
  const categories = useAppSelector(selectAllCategories);
  
  // Fetch data (automatically uses cache if available)
  useEffect(() => {
    if (selectedDenomination) {
      dispatch(fetchHymns({
        denomination: selectedDenomination.id,
        hymn_period: selectedPeriod
      }));
    }
    dispatch(fetchCategories());
  }, [dispatch, selectedDenomination, selectedPeriod]);
  
  // Use data...
};
```

## Available Actions

### Hymns
```typescript
// Fetch hymns (with caching)
dispatch(fetchHymns({ denomination?: number, hymn_period?: 'new' | 'old' }));

// Fetch single hymn
dispatch(fetchHymnById({ id: number, params?: {...} }));

// Clear cache
dispatch(clearCache());

// Update hymn
dispatch(updateHymn(hymn));
```

### Categories
```typescript
// Fetch categories (with caching)
dispatch(fetchCategories());

// Clear categories
dispatch(clearCategories());
```

### Denominations
```typescript
// Fetch denominations (with caching)
dispatch(fetchDenominations());

// Clear denominations
dispatch(clearDenominations());
```

### Daily Hymn
```typescript
// Fetch daily hymn (cached until next day)
dispatch(fetchDailyHymn());

// Clear daily hymn
dispatch(clearDailyHymn());
```

### Favorites
```typescript
import {
  setFavorites,
  addFavorite,
  removeFavorite,
  setFavoriteHymns,
} from "@/store/slices/favoritesSlice";

// Set favorite IDs
dispatch(setFavorites([1, 2, 3]));

// Add favorite
dispatch(addFavorite(hymnId));

// Remove favorite
dispatch(removeFavorite(hymnId));
```

## Selectors

### Hymns Selectors
```typescript
// All hymns
const allHymns = useAppSelector(selectAllHymns);

// Hymns by denomination
const hymns = useAppSelector((state) =>
  selectHymnsByDenomination(state, denominationId, period)
);

// Single hymn by ID
const hymn = useAppSelector((state) => selectHymnById(state, hymnId));

// Loading state
const loading = useAppSelector(selectHymnsLoading);

// Error state
const error = useAppSelector(selectHymnsError);

// Current hymn (detail view)
const currentHymn = useAppSelector(selectCurrentHymn);
```

### Categories Selectors
```typescript
const categories = useAppSelector(selectAllCategories);
const loading = useAppSelector(selectCategoriesLoading);
const error = useAppSelector(selectCategoriesError);
```

### Denominations Selectors
```typescript
const denominations = useAppSelector(selectAllDenominations);
const loading = useAppSelector(selectDenominationsLoading);
const error = useAppSelector(selectDenominationsError);
```

### Daily Hymn Selectors
```typescript
const dailyHymn = useAppSelector(selectDailyHymn);
const loading = useAppSelector(selectDailyHymnLoading);
const error = useAppSelector(selectDailyHymnError);
```

### Favorites Selectors
```typescript
// Favorite IDs
const favoriteIds = useAppSelector(selectFavoriteIds);

// Favorite hymns with full data
const favoriteHymns = useAppSelector(selectFavoriteHymnsWithData);

// Check if hymn is favorite
const isFavorite = useAppSelector((state) => selectIsFavorite(state, hymnId));
```

## Cache Configuration

### Default Cache Durations
- **Hymns**: 5 minutes
- **Categories**: 30 minutes
- **Denominations**: 1 hour
- **Daily Hymn**: 24 hours (or until next day)

### Customizing Cache Duration
```typescript
import { setCacheExpiry } from "@/store/slices/hymnsSlice";

// Set hymns cache to 10 minutes
dispatch(setCacheExpiry(10 * 60 * 1000));
```

## Migration Guide

### Before (Direct API Calls)
```typescript
const [hymns, setHymns] = useState<Hymn[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getHymns(params);
      setHymns(response.results);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [params]);
```

### After (Redux)
```typescript
const dispatch = useAppDispatch();
const hymns = useAppSelector((state) =>
  selectHymnsByDenomination(state, denominationId, period)
);
const loading = useAppSelector(selectHymnsLoading);

useEffect(() => {
  dispatch(fetchHymns({ denomination: denominationId, hymn_period: period }));
}, [dispatch, denominationId, period]);
```

## Benefits

1. **Reduced API Calls**: Data is cached and reused across components
2. **Better Performance**: No duplicate fetches when navigating between screens
3. **Centralized State**: Single source of truth for all data
4. **Automatic Cache Management**: Expiry handled automatically
5. **Type Safety**: Full TypeScript support with typed hooks
6. **Easy Testing**: Redux state is easy to test and mock

## Cache Behavior

### When Cache is Used
- Data exists in store
- Cache hasn't expired (based on timestamp)
- Same parameters (denomination/period)

### When Fresh Data is Fetched
- Cache expired
- No cached data exists
- Different parameters requested
- Manual cache clear

### Daily Hymn Special Case
- Automatically checks if it's a new day
- Only fetches once per day
- Cache persists across app restarts (until date changes)

## Best Practices

1. **Use Selectors**: Always use selectors instead of accessing state directly
2. **Dispatch in useEffect**: Fetch data in useEffect with proper dependencies
3. **Don't Duplicate State**: Remove local useState for data that's in Redux
4. **Use Loading States**: Use Redux loading states instead of local ones
5. **Handle Errors**: Check error state from Redux

## Example: Complete Component Migration

### Before
```typescript
const HomeScreen = () => {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const hymnsData = await getHymns();
      const categoriesData = await getCategories();
      setHymns(hymnsData.results);
      setCategories(categoriesData);
      setLoading(false);
    };
    fetchData();
  }, []);
  
  // ... render
};
```

### After
```typescript
const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const hymns = useAppSelector(selectAllHymns);
  const categories = useAppSelector(selectAllCategories);
  const loading = useAppSelector(selectHymnsLoading);
  
  useEffect(() => {
    dispatch(fetchHymns());
    dispatch(fetchCategories());
  }, [dispatch]);
  
  // ... render
};
```

## Troubleshooting

### Data Not Updating
- Check if cache has expired
- Verify parameters match cached data
- Try clearing cache: `dispatch(clearCache())`

### Too Many API Calls
- Ensure you're using Redux instead of direct API calls
- Check cache expiry settings
- Verify selectors are being used correctly

### Stale Data
- Reduce cache duration if needed
- Clear cache manually when data changes
- Use `updateHymn` action to update specific items

## Next Steps

1. **Migrate Remaining Screens**: Update other screens to use Redux
2. **Add Persistence**: Consider adding Redux Persist for offline support
3. **Add Optimistic Updates**: Update UI immediately, sync with backend
4. **Add Pagination**: Implement pagination in Redux for large lists

---

**Last Updated**: January 2024

