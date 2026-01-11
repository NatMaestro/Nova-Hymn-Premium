# API Configuration Guide

## Mock Data vs Live Backend

The app supports both mock data and live backend seamlessly. Switch between them with a single configuration change.

### Configuration

Edit `lib/config.ts`:

```typescript
export const USE_MOCK_DATA = true;  // Set to false to use live backend
```

### Mock Data

- **Location**: `lib/mockData.ts`
- **Contains**: 8 sample hymns, 9 categories, 5 authors
- **Features**: 
  - Simulates network delays (200-500ms)
  - Matches backend API response structure
  - Includes premium features (sheet music, audio)
  - Date-based "hymn of the day"

### Live Backend

When `USE_MOCK_DATA = false`, the app connects to:
- **Development**: `http://localhost:8000/api/v1`
- **Production**: Update `API_CONFIG.BASE_URL` in `lib/config.ts`

## API Endpoints

All endpoints match the Django backend structure:

### Hymns
- `GET /api/v1/hymns/` - List all hymns (paginated, filterable)
- `GET /api/v1/hymns/{id}/` - Get hymn details
- `GET /api/v1/hymns/featured/` - Get featured hymns
- `GET /api/v1/hymns/daily/` - Get hymn of the day
- `GET /api/v1/hymns/{id}/sheet_music/` - Get sheet music
- `GET /api/v1/hymns/{id}/audio/{type}/` - Get audio file

### Categories
- `GET /api/v1/categories/` - List all categories

### Authors
- `GET /api/v1/authors/` - List all authors

### Sheet Music
- `GET /api/v1/sheet-music/` - List all sheet music

## Response Transformation

The API responses are automatically transformed to match the frontend types:
- `HymnListResponse` → `Hymn` (via `transformHymnList`)
- `HymnDetailResponse` → `Hymn` (via `transformHymnDetail`)

## Storage

The app uses **AsyncStorage** for persistence:
- Favorites storage
- Premium status
- User preferences
- Recent hymns
- Offline data (future)

See `lib/storage.ts` for storage utilities.

## Switching to Live Backend

1. **Update config**:
   ```typescript
   // lib/config.ts
   export const USE_MOCK_DATA = false;
   ```

2. **Update base URL** (if needed):
   ```typescript
   export const API_CONFIG = {
     BASE_URL: "https://your-api.com/api/v1",
   };
   ```

3. **Test endpoints** - The UI will work the same way!

## Error Handling

All API calls include error handling:
```typescript
import { handleApiError } from "@/lib/api";

try {
  const hymns = await getHymns();
} catch (error) {
  const message = handleApiError(error);
  // Show error to user
}
```

## Adding More Mock Data

Edit `lib/mockData.ts` and add to:
- `mockHymns` array
- `mockCategories` array (if needed)
- `mockAuthors` array (if needed)
- `mockSheetMusic` array (if needed)

The mock data structure must match the backend API response format.

