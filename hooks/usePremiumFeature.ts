import { usePremium } from '@/contexts/PremiumContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const usePremiumFeature = (featureName: string) => {
  const { isPremium, purchasePremium } = usePremium();
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


