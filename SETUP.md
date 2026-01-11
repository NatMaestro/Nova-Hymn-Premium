# Setup Guide for Nova Hymnal Premium

## Initial Setup Steps

### 1. Install Dependencies
```bash
cd Nova-Hymnal-Premium
npm install
```

### 2. Copy Assets from Old App

You need to copy the following assets from `Nova-Hymnal-fe/assets/` to `Nova-Hymnal-Premium/assets/`:

#### Icons (Required)
Copy all files from `Nova-Hymnal-fe/assets/icons/` to `Nova-Hymnal-Premium/assets/icons/`:
- `back.png` - Back navigation icon
- `favorite.png` - Unfavorited state
- `favorite-filled.png` - Favorited state
- `forward.png` - Forward/next icon
- `searchIcon.png` - Search icon
- `book.png` - Book icon

#### Fonts (Required)
Copy all font files from `Nova-Hymnal-fe/assets/fonts/` to `Nova-Hymnal-Premium/assets/fonts/`:
- `Onest-Black.ttf`
- `Onest-Bold.ttf`
- `Onest-ExtraBold.ttf`
- `Onest-ExtraLight.ttf`
- `Onest-Light.ttf`
- `Onest-Medium.ttf`
- `Onest-Regular.ttf`
- `Onest-SemiBold.ttf`
- `Onest-Thin.ttf`

#### Images (Update as needed)
- Update `icon.png` with your app icon
- Update `splash-icon.png` with your splash screen
- Update `adaptive-icon.png` for Android

### 3. Configure App

#### Update app.json
- Set your bundle identifier (iOS): `com.novahymnal.premium`
- Set your package name (Android): `com.novahymnal.premium`
- Update app name and slug as needed

#### Configure API
Update `lib/api.ts` with your backend API URL:
```typescript
baseURL: "https://your-api-url.com/api/v1"
```

#### Configure Premium Products
Update `contexts/PremiumContext.tsx` with your product IDs:
- iOS: Set up in App Store Connect
- Android: Set up in Google Play Console

### 4. Run the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Premium Features Setup

### In-App Purchases

1. **iOS (App Store Connect)**
   - Create a subscription product
   - Product ID: `com.novahymnal.premium.monthly`
   - Set pricing and subscription duration

2. **Android (Google Play Console)**
   - Create a subscription product
   - Product ID: `com.novahymnal.premium.monthly`
   - Set pricing and subscription duration

3. **Testing**
   - Use sandbox/test accounts
   - Test purchase flow in development builds
   - Verify restore purchases functionality

### Backend API Requirements

Your backend should support these endpoints:

#### Free Features
- `GET /api/v1/hymns` - Get all hymns
- `GET /api/v1/hymns/:id` - Get hymn by ID
- `GET /api/v1/categories` - Get all categories

#### Premium Features
- `GET /api/v1/hymns/:id/sheet-music` - Get sheet music URL
- `GET /api/v1/hymns/:id/audio/piano` - Get piano audio URL
- `GET /api/v1/hymns/:id/audio/soprano` - Get soprano audio URL
- `GET /api/v1/hymns/:id/audio/alto` - Get alto audio URL
- `GET /api/v1/hymns/:id/audio/tenor` - Get tenor audio URL
- `GET /api/v1/hymns/:id/audio/bass` - Get bass audio URL
- `GET /api/v1/sheet-music` - Get all sheet music

## Feature Summary

### Free Tier Features
✅ Browse all hymns
✅ Search hymns
✅ View lyrics
✅ Category filtering
✅ Hymn of the Day
✅ Limited favorites (10 hymns)
✅ Basic hymn information

### Premium Tier Features
✅ Unlimited favorites
✅ Sheet music viewer
✅ Piano accompaniment audio
✅ Vocal part audio (all parts)
✅ Sheet music library
✅ Audio controls (tempo, seek, loop)
✅ Scripture references
✅ Hymn history
✅ Ad-free experience
✅ Advanced features

## Troubleshooting

### Common Issues

1. **Icons not showing**
   - Make sure all icon files are copied to `assets/icons/`
   - Check file names match exactly

2. **Fonts not loading**
   - Ensure all font files are in `assets/fonts/`
   - Check `tailwind.config.js` font configuration

3. **Premium features not working**
   - Verify in-app purchase setup in stores
   - Check product IDs match configuration
   - Test with sandbox accounts

4. **API errors**
   - Verify API base URL is correct
   - Check network connectivity
   - Verify backend endpoints are available

## Next Steps

1. Copy assets from old app
2. Configure app.json with your details
3. Set up in-app purchases in app stores
4. Test all features
5. Build and deploy

