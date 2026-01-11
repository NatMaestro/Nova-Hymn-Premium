# Nova Hymnal Premium - Features Documentation

## Free Features (Available to All Users)

### 1. Hymn Browsing
- **Browse All Hymns**: View complete list of all available hymns
- **Hymn Details**: See hymn number, title, author, category, and language
- **Navigation**: Easy navigation between hymn list and details

### 2. Search Functionality
- **Real-time Search**: Search hymns as you type
- **Multi-field Search**: Search by hymn title or number
- **Quick Results**: Instant filtered results

### 3. Category Filtering
- **Category Browsing**: Browse hymns by category (Worship, Praise, Thanksgiving, etc.)
- **Quick Filters**: Horizontal scrollable category chips
- **All Category**: View all hymns regardless of category

### 4. Hymn of the Day
- **Daily Feature**: Get a different hymn each day
- **Date-based Selection**: Consistent daily hymn based on date
- **Quick Preview**: See first verse and navigate to full hymn

### 5. Favorites (Limited)
- **Save Favorites**: Mark hymns as favorites
- **View Favorites**: See all favorited hymns on home screen
- **Limit**: Free users can save up to 10 favorites
- **Persistent Storage**: Favorites saved locally

### 6. Basic Hymn Information
- **Lyrics**: Full hymn lyrics with verses and choruses
- **Metadata**: Author, category, language information
- **Verse Numbering**: Clear verse and chorus identification

## Premium Features (Subscription Required)

### 1. Unlimited Favorites
- **No Limits**: Save as many hymns as you want
- **Unlimited Storage**: No restrictions on favorites list

### 2. Sheet Music Viewer
- **PDF Viewer**: View sheet music directly in app
- **Zoom Controls**: Zoom in/out for detailed viewing
- **Pan Support**: Navigate through sheet music
- **No Download**: View without taking device storage
- **Library Access**: Browse complete sheet music library

### 3. Audio Playback

#### Piano Accompaniment
- **Play-along**: Piano accompaniment for singing along
- **Full Control**: Play, pause, seek through audio
- **Tempo Control**: Adjust playback speed (0.5x to 1.5x)
- **Time Display**: See current position and duration

#### Vocal Parts
- **Soprano**: Learn soprano part with audio
- **Alto**: Learn alto part with audio
- **Tenor**: Learn tenor part with audio
- **Bass**: Learn bass part with audio
- **Individual Control**: Each part has its own player

### 4. Audio Controls
- **Playback Speed**: Adjust tempo for learning (0.5x, 0.75x, 1.0x, 1.25x, 1.5x)
- **Seek**: Jump to any position in audio
- **Loop**: Loop specific sections (coming soon)
- **Mix Parts**: Combine vocal parts (coming soon)

### 5. Sheet Music Library
- **Complete Library**: Access all available sheet music
- **Browse & Search**: Find sheet music easily
- **Quick Access**: Navigate to sheet music from library
- **Thumbnail Preview**: See previews before opening

### 6. Enhanced Hymn Information
- **Scripture References**: See related Bible verses
- **Hymn History**: Learn the story behind each hymn
- **Author Biographies**: Information about hymn authors (coming soon)

### 7. Advanced Features
- **Ad-free Experience**: No advertisements
- **Dark Mode**: Comfortable viewing in low light (coming soon)
- **Custom Playlists**: Create setlists for services (coming soon)
- **Offline Mode**: Download hymns for offline use (coming soon)
- **Export & Share**: Share hymns and playlists (coming soon)

## Premium Upgrade Flow

### Upgrade Screen
- **Feature List**: See all premium features
- **Pricing**: Clear monthly subscription price
- **Purchase**: One-tap subscription
- **Restore**: Restore previous purchases

### Premium Gates
- **Feature Protection**: Premium features are gated
- **Upgrade Prompts**: Clear calls to action
- **Seamless Experience**: Smooth upgrade flow

## User Experience

### Free Users
- Full access to basic features
- Clear indication of premium features
- Easy upgrade path when needed
- No ads or interruptions

### Premium Users
- Access to all features
- Seamless premium experience
- No limitations or restrictions
- Priority support (coming soon)

## Technical Implementation

### Premium Status Management
- Context-based premium state
- AsyncStorage for local caching
- In-app purchase integration
- Purchase verification

### Feature Gates
- `PremiumGate` component for UI protection
- `usePremiumFeature` hook for programmatic checks
- Consistent upgrade prompts
- Graceful degradation

### API Integration
- RESTful API for hymn data
- Separate endpoints for premium content
- Secure authentication (coming soon)
- Offline caching (coming soon)

## Future Enhancements

### Planned Features
- Custom playlists and setlists
- Offline mode with downloads
- Dark mode theme
- Advanced search filters
- Hymn annotations and notes
- Recording feature
- Sharing capabilities
- Multiple language support
- Transpose sheet music
- Split-screen mode

### Coming Soon
- Collaborative playlists
- Hymn analytics
- Practice tracking
- Export features
- Print functionality

