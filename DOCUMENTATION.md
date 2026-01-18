# Nova Hymnal Premium - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Premium System](#premium-system)
5. [Ad-Based Premium Unlock](#ad-based-premium-unlock)
6. [Redux State Management](#redux-state-management)
7. [API Integration](#api-integration)
8. [Loading States](#loading-states)
9. [Deployment](#deployment)
10. [Development Guide](#development-guide)

---

## Project Overview

Nova Hymnal Premium is a React Native mobile application built with Expo that provides access to a comprehensive collection of hymns for various Christian denominations (Catholic, Methodist, Baptist). The app features both free and premium tiers, with plans for ad-based premium unlocks.

### Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Django REST Framework
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Context API
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router

---

## Architecture

### Frontend Structure
```
Nova-Hymnal-Premium/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── all-hymns/         # Hymn list and detail pages
│   ├── premium/           # Premium upgrade screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React Context providers
│   ├── PremiumContext.tsx # Premium status management
│   ├── AuthContext.tsx    # Authentication
│   ├── ThemeContext.tsx   # Theme management
│   └── DenominationContext.tsx # Denomination selection
├── lib/                   # Utilities and API
│   ├── api.ts             # API service layer
│   ├── adUnlock.ts        # Ad unlock utilities
│   └── config.ts          # Configuration
└── types/                 # TypeScript type definitions
```

### Backend Structure
```
Nova-Hymnal-Backend/
├── hymns/                 # Main Django app
│   ├── models.py          # Database models
│   ├── views.py           # API viewsets
│   ├── serializers.py     # DRF serializers
│   ├── admin.py           # Django admin
│   └── urls.py            # URL routing
└── config/                # Django settings
```

---

## Features

### Free Features
- ✅ Browse all hymns by denomination
- ✅ View hymn lyrics
- ✅ Search hymns
- ✅ Filter by category
- ✅ Limited favorites (10 hymns)
- ✅ Hymn of the Day
- ✅ Basic hymn information

### Premium Features (Currently Disabled)
- ⏸️ Unlimited favorites
- ⏸️ Sheet music viewer
- ⏸️ Audio playback (piano, vocal parts)
- ⏸️ Split-screen mode (lyrics + sheet music)
- ⏸️ Scripture references
- ⏸️ Hymn history & context
- ⏸️ Advanced search & filters
- ⏸️ Custom playlists
- ⏸️ Hymn annotations & notes
- ⏸️ Ad-free experience

**Note**: Premium features are currently disabled. See [Premium System](#premium-system) for details.

---

## Premium System

### Current Status
**Premium features are DISABLED** for freemium launch. All features are currently available to all users.

### Configuration
In `contexts/PremiumContext.tsx`:
```typescript
const ENABLE_PREMIUM_FEATURES = false; // Set to true to enable premium
```

### Premium Sources (When Enabled)
1. **Subscription Premium** (RevenueCat) - Permanent
2. **Ad-Based Premium Unlock** - Temporary (1h, 4h, or 24h)
3. **None** - Free tier

### Premium Status Check
The app checks premium status in this order:
1. Subscription status (RevenueCat)
2. Backend subscription status
3. Ad-based unlock status
4. Local storage cache

---

## Ad-Based Premium Unlock

### Overview
Users can watch rewarded ads (AdMob) to temporarily unlock premium features. The infrastructure is ready but AdMob integration is pending.

### Unlock Types
- **Short**: 1 hour premium (1 ad)
- **Medium**: 4 hours premium (2 ads)
- **Long**: 24 hours premium (3 ads)

### Rate Limiting
- Maximum 5 ads per day (configurable)
- Daily reset at midnight
- Cooldown between ads (configurable)

### Storage
Ad unlock data is stored locally in AsyncStorage:
```typescript
{
  expiresAt: "2024-01-15T14:30:00Z",
  unlockType: "short" | "medium" | "long",
  adUnlockCount: 3,
  lastAdWatchDate: "2024-01-15"
}
```

### Expiry Management
- Automatic expiry check every 60 seconds
- Background timer updates UI when unlock expires
- Automatic cleanup of expired unlocks

### Implementation Status
- ✅ Storage utilities (`lib/adUnlock.ts`)
- ✅ PremiumContext integration
- ✅ Expiry checking mechanism
- ⏳ AdMob SDK integration (pending)
- ⏳ Ad watching UI (pending)

### Future Integration Steps
1. Install `react-native-google-mobile-ads`
2. Configure AdMob ad units
3. Implement `watchAdForPremium` function
4. Add "Watch Ad" buttons in UI
5. Set `ENABLE_PREMIUM_FEATURES = true`

See `AD_BASED_PREMIUM_ARCHITECTURE.md` for detailed architecture.

---

## Redux State Management

### Overview
Redux Toolkit has been integrated to provide centralized state management with intelligent caching, reducing unnecessary API calls and improving app performance.

### Store Structure
```
store/
├── index.ts              # Store configuration
├── hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
├── selectors.ts          # Reusable selectors
└── slices/
    ├── hymnsSlice.ts     # Hymns state with denomination-based caching
    ├── categoriesSlice.ts # Categories state (30min cache)
    ├── denominationsSlice.ts # Denominations state (1hr cache)
    ├── dailyHymnSlice.ts # Daily hymn (date-based cache)
    └── favoritesSlice.ts # Favorites management
```

### Key Features

#### 1. **Intelligent Caching**
- **Hymns**: Cached for 5 minutes per denomination/period combination
- **Categories**: Cached for 30 minutes (rarely change)
- **Denominations**: Cached for 1 hour (rarely change)
- **Daily Hymn**: Cached until next day (automatic date check)

#### 2. **Denomination-Based Caching**
Hymns are cached separately for each combination:
- `1_new` - Catholic New hymns
- `1_old` - Catholic Old hymns
- `2_all` - Methodist hymns
- `3_all` - Baptist hymns

#### 3. **Automatic Cache Management**
- Cache expires based on timestamps
- Daily hymn automatically refreshes on new day
- No manual cache invalidation needed

### Usage Example

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHymns, fetchCategories } from "@/store/slices/hymnsSlice";
import { selectHymnsByDenomination, selectHymnsLoading } from "@/store/selectors";

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { selectedDenomination, selectedPeriod } = useDenomination();
  
  // Get data from Redux (uses cache if available)
  const hymns = useAppSelector((state) =>
    selectHymnsByDenomination(state, selectedDenomination?.id, selectedPeriod)
  );
  const loading = useAppSelector(selectHymnsLoading);
  
  // Fetch data (only if cache expired)
  useEffect(() => {
    if (selectedDenomination) {
      dispatch(fetchHymns({
        denomination: selectedDenomination.id,
        hymn_period: selectedPeriod
      }));
    }
  }, [dispatch, selectedDenomination, selectedPeriod]);
  
  // Use cached data...
};
```

### Benefits
- ✅ **Reduced API Calls**: Data cached and reused across screens
- ✅ **Better Performance**: No duplicate fetches when navigating
- ✅ **Automatic Cache Management**: Expiry handled automatically
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Centralized State**: Single source of truth

See `REDUX_SETUP.md` for detailed documentation.

---

## API Integration

### Base URL Configuration
The app automatically selects the API base URL based on environment:
- **Development**: `http://localhost:8000/api/v1` (or `http://10.0.2.2:8000/api/v1` for Android emulator)
- **Production**: `https://nova-hymnal-be.onrender.com/api/v1`

### Environment Variables
```env
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_DEV_API_URL=http://YOUR_IP:8000/api/v1
EXPO_PUBLIC_PROD_API_URL=https://nova-hymnal-be.onrender.com/api/v1
EXPO_PUBLIC_API_BASE_URL=  # Optional override
```

### API Endpoints

#### Hymns
- `GET /api/v1/hymns/` - List hymns (supports `denomination` and `hymn_period` filters)
- `GET /api/v1/hymns/{id}/` - Get hymn details
- `GET /api/v1/hymns/featured/` - Get featured hymns
- `GET /api/v1/hymns/daily/` - Get hymn of the day

#### Denominations
- `GET /api/v1/denominations/` - List active denominations

#### Categories
- `GET /api/v1/categories/` - List categories

#### Authentication
- `POST /api/v1/auth/login/` - Login (JWT)
- `POST /api/v1/auth/register/` - Register
- `GET /api/v1/auth/profile/` - Get user profile

### Authentication
- JWT tokens stored in AsyncStorage
- Automatic token refresh on 401 errors
- Anonymous access allowed for basic features

---

## Loading States

### Implementation
All data-fetching screens now include loading indicators:

#### Home Screen
- ✅ Daily hymn loading
- ✅ Categories loading
- ✅ Hymns list loading

#### All Hymns Screen
- ✅ Categories loading
- ✅ Hymns list loading (full-screen spinner)

#### Hymn Detail Screen
- ✅ Hymn data loading (full-screen spinner)

### Loading Components
- `ActivityIndicator` for spinners
- Loading messages for user feedback
- Theme-aware colors

### Loading States Tracked
- `loadingHymns` - Hymns list fetching
- `loadingCategories` - Categories fetching
- `loadingDailyHymn` - Daily hymn fetching
- `loading` - Individual hymn detail fetching

---

## Denomination System

### Supported Denominations
- **Catholic** (with "New" and "Old" periods)
- **Methodist**
- **Baptist**

### Features
- Sidebar selector for denomination
- Period selection for Catholic hymns (New/Old)
- Persistent selection (AsyncStorage)
- Auto-selection of first available denomination
- Filter hymns by denomination and period

### Storage
```typescript
{
  selectedDenomination: Denomination,
  selectedPeriod: "new" | "old" | null
}
```

---

## Deployment

### Prerequisites
1. Expo account
2. EAS Build configured
3. Backend deployed (Render, Railway, etc.)
4. Environment variables set

### Build Commands
```bash
# Development build
eas build --profile development --platform android

# Production build
eas build --profile production --platform android
```

### Environment Setup
1. Create `.env` file with required variables
2. Update API URLs for production
3. Configure AdMob (when ready)
4. Set up RevenueCat (when enabling premium)

### Play Store Deployment
1. Build production APK/AAB
2. Create app listing
3. Upload build
4. Submit for review

---

## Development Guide

### Setup
```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

### Key Files

#### Premium Management
- `contexts/PremiumContext.tsx` - Premium status and ad unlocks
- `lib/adUnlock.ts` - Ad unlock utilities

#### API Integration
- `lib/api.ts` - API service layer
- `lib/config.ts` - API configuration

#### Navigation
- `app/_layout.tsx` - Root layout and navigation
- `app/(tabs)/` - Tab navigation screens

### Code Style
- TypeScript for type safety
- NativeWind for styling (Tailwind CSS)
- React Context for state management
- Functional components with hooks

### Testing
- Test on both Android and iOS
- Test with different denominations
- Test loading states
- Test error handling

---

## Future Enhancements

### Planned Features
1. **AdMob Integration**
   - Rewarded ads for premium unlocks
   - Banner ads for free users
   - Interstitial ads

2. **Offline Mode**
   - Download hymns for offline access
   - Cache sheet music
   - Offline audio playback

3. **Social Features**
   - Share hymns
   - Referral system
   - Community playlists

4. **Analytics**
   - User engagement tracking
   - Ad performance metrics
   - Feature usage analytics

---

## Troubleshooting

### Common Issues

#### API Connection Errors
- Check API base URL in `lib/config.ts`
- Verify backend is running
- Check network connectivity
- For Android emulator, use `10.0.2.2` instead of `localhost`

#### Premium Features Not Working
- Check `ENABLE_PREMIUM_FEATURES` flag
- Verify RevenueCat configuration (if enabled)
- Check ad unlock status (if using ads)

#### Loading States Not Showing
- Verify loading state is set to `true` before API call
- Check `finally` block sets loading to `false`
- Ensure `ActivityIndicator` is imported

---

## Support

For issues or questions:
1. Check this documentation
2. Review architecture documents
3. Check code comments
4. Review API documentation (Swagger)

---

## License

[Your License Here]

---

**Last Updated**: January 2024
**Version**: 1.0.0

