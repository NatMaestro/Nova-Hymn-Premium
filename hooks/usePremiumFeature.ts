import { usePremium } from '@/contexts/PremiumContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const usePremiumFeature = (featureName: string) => {
  const { isPremium, watchAdForPremium, canWatchAd } = usePremium();
  const router = useRouter();

  const requirePremium = (callback?: () => void) => {
    if (isPremium) {
      callback?.();
      return true;
    } else {
      Alert.alert(
        'Premium Feature',
        `${featureName} is available in the Premium version. Upgrade now to unlock this feature and many more!`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Watch Ad',
            onPress: async () => {
              if (!canWatchAd) {
                Alert.alert(
                  'Ad Unlock Unavailable',
                  'Ad unlock is on cooldown or daily limit reached. Please try again later.'
                );
                return;
              }

              try {
                await watchAdForPremium('short');
                Alert.alert('Premium Unlocked!', 'You now have temporary premium access.');
                callback?.();
              } catch (error: any) {
                Alert.alert('Ad Error', error.message || 'Unable to watch ad right now.');
              }
            },
          },
          {
            text: 'Upgrade',
            onPress: () => router.push('/premium'),
          },
        ]
      );
      return false;
    }
  };

  return { isPremium, requirePremium };
};


