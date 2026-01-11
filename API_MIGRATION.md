# API Migration Guide

## What Changed

### 1. API Structure
- Updated to match Django backend response format
- Added response transformation helpers
- Mock data system for development

### 2. Storage
- Centralized storage utilities in `lib/storage.ts`
- Better error handling
- Type-safe storage functions

### 3. Types
- Updated to match backend API structure
- Added API response types
- Frontend-friendly transformation types

## Files Updated

### New Files
- `lib/config.ts` - API configuration (mock/live switch)
- `lib/mockData.ts` - Comprehensive mock data
- `lib/storage.ts` - Storage utilities
- `lib/apiHelpers.ts` - Response transformation helpers
- `README_API.md` - API documentation

### Updated Files
- `lib/api.ts` - Complete rewrite with mock/live support
- `types/index.ts` - Updated types to match backend

## How to Use

### In Your Screens

**Before:**
```typescript
const categories = await getCategories();
setCategories(categories);
```

**After (same code, but now works with both mock and live):**
```typescript
import { getCategories } from "@/lib/api";

const categories = await getCategories();
setCategories(categories);
```

### Using Storage

**Before:**
```typescript
const stored = await AsyncStorage.getItem(FAVORITES_KEY);
const favorites = stored ? JSON.parse(stored) : [];
```

**After:**
```typescript
import { favoritesStorage } from "@/lib/storage";

const favorites = await favoritesStorage.get();
await favoritesStorage.add(hymnId);
await favoritesStorage.remove(hymnId);
const isFavorite = await favoritesStorage.isFavorite(hymnId);
```

## Switching Between Mock and Live

1. **Edit `lib/config.ts`**:
   ```typescript
   export const USE_MOCK_DATA = false; // Change to false for live backend
   ```

2. **Update base URL** (if needed):
   ```typescript
   export const API_CONFIG = {
     BASE_URL: "http://localhost:8000/api/v1", // Your backend URL
   };
   ```

3. **That's it!** The UI will work the same way.

## Response Format

### API Response (Backend)
```json
{
  "id": 1,
  "number": 101,
  "title": "Amazing Grace",
  "category": 4,
  "category_name": "Grace",
  "author": 1,
  "author_name": "John Newton",
  "verses": [...],
  "sheet_music_url": "...",
  "audio_urls": {...}
}
```

### Frontend Hymn Type
```typescript
{
  id: 1,
  number: 101,
  title: "Amazing Grace",
  category: 4,
  category_name: "Grace",
  author: 1,
  author_name: "John Newton",
  verses: [...],
  sheetMusicUrl: "...",
  audioUrls: {...}
}
```

The transformation happens automatically in the API layer.

## Next Steps

1. Update screens to use new storage utilities (optional but recommended)
2. Test with mock data first
3. Switch to live backend when ready
4. No UI changes needed - everything works the same!

