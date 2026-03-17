import React, { useState } from 'react';
import { formatRemainingTime, AdUnlockType } from '@/lib/adUnlock';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '@/contexts/PremiumContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { 
  CheckIcon, 
  XMarkIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  StarIcon,
} from 'react-native-heroicons/outline';

type TabType = 'overview' | 'settings' | 'account';

const PremiumScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    isPremium,
    purchasePremium,
    restorePurchases,
    isLoading,
    toggleDevMode,
    watchAdForPremium,
    canWatchAd,
    remainingAdUnlockTime,
    adUnlockType,
  } = usePremium();
  const { isAuthenticated } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [watchingAdType, setWatchingAdType] = useState<AdUnlockType | null>(null);

  const AD_UNLOCK_OPTIONS: { type: AdUnlockType; duration: string; sub: string }[] = [
    { type: 'short', duration: '1 Hour', sub: 'Quick access' },
    { type: 'medium', duration: '4 Hours', sub: 'Afternoon session' },
    { type: 'long', duration: '24 Hours', sub: 'Full day access' },
  ];

  const handleWatchAd = async (unlockType: AdUnlockType) => {
    try {
      setWatchingAdType(unlockType);
      await watchAdForPremium(unlockType);
      const option = AD_UNLOCK_OPTIONS.find((o) => o.type === unlockType);
      Alert.alert('Premium Unlocked!', `You now have premium access for ${option?.duration ?? unlockType}.`);
    } catch (error: any) {
      Alert.alert('Ad Error', error.message || 'Failed to load ad. Please try again.');
    } finally {
      setWatchingAdType(null);
    }
  };

  const features = [
    { name: 'Unlimited favorites', available: true },
    { name: 'Sheet music viewer for all hymns', available: true },
    { name: 'Piano accompaniment audio', available: true },
    { name: 'Vocal part audio (Soprano, Alto, Tenor, Bass)', available: true },
    { name: 'Sheet music library access', available: true },
    { name: 'Scripture references', available: true },
    { name: 'Hymn history & context', available: true },
    { name: 'Ad-free experience', available: true },
    { name: 'Audio controls (tempo, loop, mix)', available: true },
    { name: 'Advanced search & filters', available: true },
    { name: 'Offline mode (download hymns & sheet music)', available: false, note: 'Coming soon' },
    { name: 'Custom playlists & setlists', available: true },
    { name: 'Split-screen mode (lyrics + sheet music)', available: true },
    { name: 'Transpose sheet music', available: false, note: 'Coming soon' },
    { name: 'Hymn annotations & notes', available: true },
    { name: 'Dark mode', available: true },
    { name: 'Export & share features', available: true },
  ];

  const handlePurchase = async () => {
    // Require authentication for premium purchase
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setPurchasing(true);
      await purchasePremium();
      Alert.alert('Success', 'Welcome to Premium! Enjoy all the features.');
      setActiveTab('overview'); // Switch to overview after purchase
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
      setActiveTab('overview');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to restore purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  const renderTabs = () => {
    if (!isPremium) {
      // For non-premium users, only show Overview tab (but still show it as a tab)
      return (
        <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[
              styles.tab,
              activeTab === 'overview' && { borderBottomWidth: 3, borderBottomColor: theme.colors.textSecondary }
            ]}
          >
            <StarIcon 
              size={20} 
              color={activeTab === 'overview' ? theme.colors.textSecondary : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { 
                color: activeTab === 'overview' ? theme.colors.textSecondary : theme.colors.textSecondary,
                fontWeight: activeTab === 'overview' ? '700' : '500'
              }
            ]}>
              Overview
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For premium users, show all tabs
    return (
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomWidth: 3, borderBottomColor: theme.colors.textSecondary }
          ]}
        >
          <StarIcon 
            size={20} 
            color={activeTab === 'overview' ? theme.colors.textSecondary : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { 
              color: activeTab === 'overview' ? theme.colors.textSecondary : theme.colors.textSecondary,
              fontWeight: activeTab === 'overview' ? '700' : '500'
            }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={[
            styles.tab,
            activeTab === 'settings' && { borderBottomWidth: 3, borderBottomColor: theme.colors.textSecondary }
          ]}
        >
          <Cog6ToothIcon 
            size={20} 
            color={activeTab === 'settings' ? theme.colors.textSecondary : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { 
              color: activeTab === 'settings' ? theme.colors.textSecondary : theme.colors.textSecondary,
              fontWeight: activeTab === 'settings' ? '700' : '500'
            }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('account')}
          style={[
            styles.tab,
            activeTab === 'account' && { borderBottomWidth: 3, borderBottomColor: theme.colors.textSecondary }
          ]}
        >
          <CreditCardIcon 
            size={20} 
            color={activeTab === 'account' ? theme.colors.textSecondary : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { 
              color: activeTab === 'account' ? theme.colors.textSecondary : theme.colors.textSecondary,
              fontWeight: activeTab === 'account' ? '700' : '500'
            }
          ]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOverview = () => {
    if (isPremium) {
      return (
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 20 }}>
            <View style={[styles.premiumCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <CheckIcon size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.premiumTitle, { color: theme.colors.text }]}>
                You're Premium!
              </Text>
              <Text style={[styles.premiumSubtitle, { color: theme.colors.textSecondary }]}>
                Thank you for supporting Nova Hymnal. Enjoy all premium features!
              </Text>
                {adUnlockType && (remainingAdUnlockTime ?? 0) > 0 && (
                  <View style={[styles.countdownBanner, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.countdownLabel, { color: theme.colors.textSecondary }]}>
                      Temporary access expires in
                    </Text>
                    <Text style={[styles.countdownTime, { color: theme.colors.text }]}>
                      {formatRemainingTime(remainingAdUnlockTime ?? 0)}
                    </Text>
                    {canWatchAd && (
                      <TouchableOpacity
                        onPress={() => handleWatchAd(adUnlockType)}
                        disabled={watchingAdType !== null}
                        style={[styles.extendButton, { borderColor: theme.colors.border }]}
                      >
                        {watchingAdType === adUnlockType ? (
                          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                        ) : (
                          <Text style={[styles.extendButtonText, { color: theme.colors.textSecondary }]}>
                            Watch Ad to Extend
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
            </View>

            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Premium Features
              </Text>
              
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                Available Now
              </Text>
              {features.filter(f => f.available).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckIcon size={24} color={theme.colors.textSecondary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    {feature.name}
                  </Text>
                </View>
              ))}
              
              <Text style={[styles.subsectionTitle, { color: theme.colors.text }, { marginTop: 24 }]}>
                Coming Soon
              </Text>
              {features.filter(f => !f.available).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.comingSoonBadge, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.comingSoonText, { color: theme.colors.text }]}>SO</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureText, { color: theme.colors.text, opacity: 0.75 }]}>
                      {feature.name}
                    </Text>
                    {feature.note && (
                      <Text style={[styles.featureNote, { color: theme.colors.textSecondary }]}>
                        {feature.note}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      );
    }

    // Non-premium overview
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Upgrade to Premium
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Unlock the full power of Nova Hymnal
            </Text>
          </View>

          <View style={[styles.pricingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.price, { color: theme.colors.text }]}>
                $4.99
              </Text>
              <Text style={[styles.pricePeriod, { color: theme.colors.text }]}>
                per month
              </Text>
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                Cancel anytime
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Premium Features
            </Text>
            
            <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
              Available Now
            </Text>
            {features.filter(f => f.available).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckIcon size={24} color={theme.colors.textSecondary} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  {feature.name}
                </Text>
              </View>
            ))}
            
            <Text style={[styles.subsectionTitle, { color: theme.colors.text }, { marginTop: 24 }]}>
              Coming Soon
            </Text>
            {features.filter(f => !f.available).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.comingSoonBadge, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.comingSoonText, { color: theme.colors.text }]}>SO</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureText, { color: theme.colors.text, opacity: 0.75 }]}>
                    {feature.name}
                  </Text>
                  {feature.note && (
                    <Text style={[styles.featureNote, { color: theme.colors.textSecondary }]}>
                      {feature.note}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Ad unlock section */}
          <View style={[styles.adUnlockCard, { borderColor: theme.colors.border }]}>
            <Text style={[styles.adUnlockTitle, { color: theme.colors.text }]}>
              Try Premium Free with an Ad
            </Text>
            <Text style={[styles.adUnlockSubtitle, { color: theme.colors.textSecondary }]}>
              Watch a short ad to unlock all premium features temporarily.
            </Text>
            <View style={styles.adUnlockButtons}>
              {AD_UNLOCK_OPTIONS.map(({ type, duration, sub }) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleWatchAd(type)}
                  disabled={watchingAdType !== null || !canWatchAd}
                  style={[
                    styles.adUnlockButton,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      opacity: watchingAdType !== null || !canWatchAd ? 0.5 : 1,
                    },
                  ]}
                >
                  {watchingAdType === type ? (
                    <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                  ) : (
                    <>
                      <Text style={[styles.adUnlockButtonLabel, { color: theme.colors.text }]}>
                        {duration}
                      </Text>
                      <Text style={[styles.adUnlockButtonSub, { color: theme.colors.textSecondary }]}>
                        {sub}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {!canWatchAd && (
              <Text style={[styles.adLimitText, { color: theme.colors.textSecondary }]}>
                Ad limit reached or cooldown active. Try again later.
              </Text>
            )}
          </View>

          <View style={styles.orDivider}>
            <View style={[styles.orDividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.orDividerText, { color: theme.colors.textSecondary }]}>or</Text>
            <View style={[styles.orDividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || isLoading}
            style={[styles.purchaseButton, { backgroundColor: theme.colors.text }]}
          >
            {purchasing || isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="white" />
                <Text style={styles.purchaseButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.purchaseButtonText}>Subscribe to Premium</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing || isLoading}
            style={styles.restoreButton}
          >
            <Text style={[styles.restoreButtonText, { color: theme.colors.textSecondary }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          {toggleDevMode && (
            <TouchableOpacity
              onPress={async () => {
                await toggleDevMode();
                Alert.alert(
                  'Dev Mode',
                  isPremium 
                    ? 'Premium disabled (Dev Mode)' 
                    : 'Premium enabled (Dev Mode)'
                );
              }}
              style={[styles.devButton, { backgroundColor: '#fbbf24' }]}
            >
              <Text style={styles.devButtonText}>
                🧪 {isPremium ? 'Disable' : 'Enable'} Premium (Dev Mode)
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscription will auto-renew unless cancelled at least 24 hours before
            the end of the current period.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderSettings = () => {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Premium Settings
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Customize your premium experience
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.settingGroupTitle, { color: theme.colors.text }]}>
              Audio Preferences
            </Text>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Default Playback Speed
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Set your preferred audio playback speed (coming soon)
              </Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Auto-play Next Audio
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Automatically play next audio track (coming soon)
              </Text>
            </View>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, { marginTop: 16 }]}>
            <Text style={[styles.settingGroupTitle, { color: theme.colors.text }]}>
              Sheet Music Preferences
            </Text>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Default Zoom Level
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Set default zoom for sheet music viewer (coming soon)
              </Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Auto-load Sheet Music
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Automatically load sheet music when viewing hymns (coming soon)
              </Text>
            </View>
          </View>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, { marginTop: 16 }]}>
            <Text style={[styles.settingGroupTitle, { color: theme.colors.text }]}>
              Download Preferences
            </Text>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Auto-download Favorites
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Automatically download sheet music for favorite hymns (coming soon)
              </Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                Storage Management
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                Manage downloaded content and storage (coming soon)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAccount = () => {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Subscription Management
          </Text>

          <View style={[styles.accountCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: theme.colors.text }]}>
                Subscription Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.textSecondary }]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: theme.colors.text }]}>
                Plan
              </Text>
              <Text style={[styles.accountValue, { color: theme.colors.textSecondary }]}>
                Premium Monthly
              </Text>
            </View>

            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: theme.colors.text }]}>
                Price
              </Text>
              <Text style={[styles.accountValue, { color: theme.colors.textSecondary }]}>
                $4.99/month
              </Text>
            </View>

            <View style={styles.accountItem}>
              <Text style={[styles.accountLabel, { color: theme.colors.text }]}>
                Next Billing Date
              </Text>
              <Text style={[styles.accountValue, { color: theme.colors.textSecondary }]}>
                Coming soon
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRestore}
            style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Cancel Subscription',
                'To cancel your subscription, please visit your device\'s App Store or Play Store settings.',
                [{ text: 'OK' }]
              );
            }}
            style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, { marginTop: 12 }]}
          >
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
              Manage Subscription
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              Billing History
            </Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              Billing history will be available soon
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      {renderTabs()}
      
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'account' && renderAccount()}

      {/* Auth Modal - shown when user tries to purchase without being logged in */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // After successful login, user can proceed with purchase
          setShowAuthModal(false);
        }}
        mode="login"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  pricingCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 24,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pricePeriod: {
    fontSize: 18,
    marginBottom: 16,
  },
  cancelText: {
    fontSize: 14,
  },
  premiumCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  featureNote: {
    fontSize: 14,
    marginTop: 4,
  },
  comingSoonBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  devButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  devButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  settingsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  accountCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  adUnlockCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginTop: 24,
  },
  adUnlockTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  adUnlockSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  adUnlockButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  adUnlockButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    gap: 4,
  },
  adUnlockButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  adUnlockButtonSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  adLimitText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countdownBanner: {
    marginTop: 20,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  countdownLabel: {
    fontSize: 13,
  },
  countdownTime: {
    fontSize: 28,
    fontWeight: '700',
  },
  extendButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  extendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PremiumScreen;
