# Nova Hymnal Premium

A premium hymn app with sheet music, audio playback, and advanced features.

## Features

### Free Features
- ✅ Browse all hymns
- ✅ Search hymns by title or number
- ✅ View hymn lyrics
- ✅ Category filtering
- ✅ Hymn of the Day
- ✅ Limited favorites (10 hymns)
- ✅ Basic hymn information (author, category, language)

### Premium Features
- ✅ Unlimited favorites
- ✅ Sheet music viewer for all hymns
- ✅ Piano accompaniment audio
- ✅ Vocal part audio (Soprano, Alto, Tenor, Bass)
- ✅ Sheet music library access
- ✅ Audio controls (play/pause, seek, tempo adjustment)
- ✅ Scripture references
- ✅ Hymn history and context
- ✅ Ad-free experience
- ✅ Advanced search and filters
- ✅ Custom playlists (coming soon)
- ✅ Offline mode (coming soon)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Project Structure

```
Nova-Hymnal-Premium/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with PremiumProvider
│   ├── index.tsx           # Home screen
│   ├── premium/            # Premium upgrade screen
│   ├── all-hymns/         # Hymn list and detail screens
│   └── sheet-music/       # Sheet music screens
├── components/             # Reusable components
│   ├── AudioPlayer.tsx    # Audio playback component
│   ├── SheetMusicViewer.tsx # PDF sheet music viewer
│   ├── PremiumGate.tsx     # Premium feature gate
│   └── Search.tsx          # Search component
├── contexts/               # React contexts
│   └── PremiumContext.tsx  # Premium subscription management
├── hooks/                  # Custom hooks
│   └── usePremiumFeature.ts # Premium feature hook
├── lib/                    # Utilities and API
│   └── api.ts             # API integration
├── types/                  # TypeScript types
│   └── index.ts           # Type definitions
└── constants/             # Constants
    └── Colors.ts          # Color constants
```

## Configuration

### API Configuration
Update the API base URL in `lib/api.ts`:
```typescript
baseURL: "https://nova-hymnal-be.onrender.com/api/v1"
```

### Premium Subscription
Configure product IDs in `contexts/PremiumContext.tsx`:
- iOS: `com.novahymnal.premium.monthly`
- Android: `com.novahymnal.premium.monthly`

### App Configuration
Update `app.json` with your app details:
- Bundle identifier (iOS)
- Package name (Android)
- App name and slug

## Premium Features Implementation

### In-App Purchases
The app uses `expo-in-app-purchases` for subscription management. Make sure to:
1. Set up products in App Store Connect (iOS) and Google Play Console (Android)
2. Configure product IDs matching your app configuration
3. Test purchases in sandbox/test environments

### Premium Feature Gates
Use the `PremiumGate` component or `usePremiumFeature` hook to protect premium features:

```tsx
import { PremiumGate } from '@/components/PremiumGate';

<PremiumGate featureName="Sheet Music">
  <SheetMusicViewer url={sheetMusicUrl} />
</PremiumGate>
```

Or with the hook:

```tsx
import { usePremiumFeature } from '@/hooks/usePremiumFeature';

const { requirePremium } = usePremiumFeature('Audio Playback');
// Later in your code:
if (requirePremium(() => playAudio())) {
  // Feature is available
}
```

## Assets

Place your assets in the `assets/` directory:
- `assets/images/` - App icons, splash screens
- `assets/icons/` - App icons (back, forward, favorite, etc.)
- `assets/fonts/` - Custom fonts (Onest font family)

## Development

### Code Style
- TypeScript for type safety
- NativeWind (Tailwind CSS) for styling
- Expo Router for navigation

### Testing Premium Features
1. Use sandbox/test accounts for in-app purchases
2. Test premium status with `AsyncStorage` (for development)
3. Verify premium gates work correctly

## Building for Production

1. Configure app.json with production settings
2. Set up EAS Build:
```bash
npm install -g eas-cli
eas build:configure
eas build --platform ios
eas build --platform android
```

3. Submit to app stores:
```bash
eas submit --platform ios
eas submit --platform android
```

## License

Private - All rights reserved

