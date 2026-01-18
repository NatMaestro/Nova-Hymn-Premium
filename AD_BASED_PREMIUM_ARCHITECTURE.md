# Ad-Based Premium Unlock Architecture

## Overview
This document outlines the architecture for implementing an ad-based premium unlock system where users can watch ads to temporarily unlock premium features.

## Current Premium System
- **Subscription-based**: RevenueCat integration for permanent premium subscriptions
- **Backend tracking**: Django backend tracks subscription status
- **Local storage**: AsyncStorage caches premium status

## Proposed Ad-Based Premium System

### Core Concept
Users watch rewarded ads (AdMob) to unlock premium features for a temporary period (e.g., 1 hour, 4 hours, 24 hours).

### Architecture Components

#### 1. **Premium Status Sources** (Priority Order)
```
1. Subscription Premium (RevenueCat) - Permanent
2. Ad-Based Premium Unlock - Temporary (expires)
3. None - Free tier
```

#### 2. **Ad Unlock Types** (Configurable)
- **Short unlock**: 1 hour (e.g., 1 ad)
- **Medium unlock**: 4 hours (e.g., 2 ads)
- **Long unlock**: 24 hours (e.g., 3 ads)

#### 3. **Data Storage**

**Local Storage (AsyncStorage):**
```typescript
{
  "ad_unlock_expires_at": "2024-01-15T14:30:00Z", // ISO timestamp
  "ad_unlock_type": "short" | "medium" | "long",
  "ad_unlock_count": 3, // Total ads watched today
  "last_ad_watch_date": "2024-01-15" // Date string for daily reset
}
```

**Backend (Optional - for authenticated users):**
```python
class AdUnlock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    unlock_type = models.CharField(max_length=20)  # 'short', 'medium', 'long'
    expires_at = models.DateTimeField()
    ad_watched_at = models.DateTimeField(auto_now_add=True)
    ad_unit_id = models.CharField(max_length=255)  # AdMob ad unit ID
    created_at = models.DateTimeField(auto_now_add=True)
```

#### 4. **Premium Context Enhancement**

**New Interface:**
```typescript
interface PremiumContextType {
  // Existing
  isPremium: boolean;
  isLoading: boolean;
  
  // New for ad unlocks
  adUnlockExpiresAt: Date | null;
  adUnlockType: 'short' | 'medium' | 'long' | null;
  remainingAdUnlockTime: number; // seconds remaining
  canWatchAd: boolean; // Check if user can watch another ad
  watchAdForPremium: (unlockType: 'short' | 'medium' | 'long') => Promise<void>;
  getAdUnlockStatus: () => {
    isActive: boolean;
    expiresAt: Date | null;
    timeRemaining: number;
  };
}
```

**Premium Status Logic:**
```typescript
const isPremium = 
  hasSubscriptionPremium || 
  hasActiveAdUnlock;
```

#### 5. **AdMob Integration Points**

**Required AdMob Ad Units:**
- Rewarded Ad (for unlocking premium)
- Banner Ad (for free tier users)
- Interstitial Ad (optional, for navigation)

**Ad Watch Flow:**
1. User taps "Watch Ad to Unlock Premium"
2. Show AdMob rewarded ad
3. On ad completion:
   - Calculate expiry time based on unlock type
   - Store unlock data locally
   - Optionally sync with backend (if authenticated)
   - Update premium status
   - Show success message

#### 6. **Expiry Management**

**Automatic Expiry Check:**
- Check on app launch
- Check when premium status is accessed
- Background timer to update UI when unlock expires
- Clean up expired unlocks

**Expiry Logic:**
```typescript
const hasActiveAdUnlock = () => {
  const expiresAt = getAdUnlockExpiresAt();
  if (!expiresAt) return false;
  return new Date() < expiresAt;
};
```

#### 7. **Rate Limiting**

**Daily Limits:**
- Maximum ads per day: 5-10 (configurable)
- Cooldown between ads: 5-10 minutes (configurable)
- Prevent abuse by tracking ad watch frequency

**Backend Validation (Optional):**
- Verify ad completion with AdMob server-side
- Track ad watch history
- Prevent duplicate unlocks

#### 8. **UI/UX Considerations**

**Premium Features Access:**
- Show "Watch Ad" button instead of "Upgrade" for free users
- Display remaining unlock time (e.g., "Premium expires in 2h 30m")
- Show countdown timer in premium features
- Graceful degradation when unlock expires

**Ad Watch UI:**
- Loading state while ad loads
- Error handling if ad fails to load
- Success animation after ad completion
- Clear messaging about unlock duration

#### 9. **Backend API Endpoints** (Optional)

```python
# Record ad unlock
POST /api/v1/ad-unlocks/
{
  "unlock_type": "short",
  "ad_unit_id": "ca-app-pub-xxx",
  "expires_at": "2024-01-15T14:30:00Z"
}

# Get active ad unlock status
GET /api/v1/ad-unlocks/status/
Response: {
  "has_active_unlock": true,
  "expires_at": "2024-01-15T14:30:00Z",
  "time_remaining_seconds": 7200
}
```

#### 10. **Implementation Steps**

**Phase 1: Disable Premium (Current)**
- ✅ Set all premium checks to return false
- ✅ Hide premium upgrade screens
- ✅ Show all features as free

**Phase 2: Ad Unlock Infrastructure**
- Add ad unlock storage utilities
- Enhance PremiumContext with ad unlock logic
- Add expiry checking mechanism
- Update premium status calculation

**Phase 3: AdMob Integration**
- Install `react-native-google-mobile-ads`
- Configure AdMob ad units
- Implement rewarded ad watching
- Handle ad completion callbacks

**Phase 4: UI Updates**
- Add "Watch Ad" buttons
- Show unlock countdown timers
- Update premium gate components
- Add ad unlock status indicators

**Phase 5: Backend Integration (Optional)**
- Create AdUnlock model
- Add API endpoints
- Sync ad unlocks with backend
- Add analytics tracking

## Configuration

### Environment Variables
```env
# AdMob Configuration
EXPO_PUBLIC_ADMOB_APP_ID=ca-app-pub-xxx
EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-xxx
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID=ca-app-pub-xxx

# Ad Unlock Settings
EXPO_PUBLIC_AD_UNLOCK_SHORT_DURATION_HOURS=1
EXPO_PUBLIC_AD_UNLOCK_MEDIUM_DURATION_HOURS=4
EXPO_PUBLIC_AD_UNLOCK_LONG_DURATION_HOURS=24
EXPO_PUBLIC_MAX_ADS_PER_DAY=5
EXPO_PUBLIC_AD_COOLDOWN_MINUTES=10
```

### Unlock Type Configuration
```typescript
const AD_UNLOCK_CONFIG = {
  short: {
    durationHours: 1,
    adsRequired: 1,
    label: "1 Hour Premium"
  },
  medium: {
    durationHours: 4,
    adsRequired: 2,
    label: "4 Hours Premium"
  },
  long: {
    durationHours: 24,
    adsRequired: 3,
    label: "24 Hours Premium"
  }
};
```

## Benefits

1. **Monetization**: Generate ad revenue from free users
2. **User Engagement**: Users can try premium features without payment
3. **Conversion**: Ad unlocks can lead to subscription purchases
4. **Flexibility**: Easy to adjust unlock durations and limits
5. **Analytics**: Track ad performance and unlock patterns

## Considerations

1. **Ad Availability**: Handle cases where ads aren't available
2. **Network Issues**: Graceful handling of ad load failures
3. **User Experience**: Balance ad frequency with UX
4. **Privacy**: Comply with ad tracking regulations
5. **Testing**: Test ad unlocks in development mode

## Future Enhancements

1. **Tiered Unlocks**: Different features unlocked for different durations
2. **Ad Rewards**: Bonus unlocks for watching multiple ads
3. **Social Sharing**: Unlock premium by sharing app
4. **Referral System**: Unlock premium by referring friends
5. **Achievement System**: Unlock premium through app usage milestones

