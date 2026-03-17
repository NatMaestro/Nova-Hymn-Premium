import React, { ReactNode, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { usePremium } from '@/contexts/PremiumContext';
import { useRouter } from 'expo-router';

interface PremiumGateProps {
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  featureName, 
  children, 
  fallback 
}) => {
  const { isPremium } = usePremiumFeature(featureName);
  const { watchAdForPremium, canWatchAd } = usePremium();
  const router = useRouter();
  const [watchingAd, setWatchingAd] = useState(false);

  const handleWatchAd = async () => {
    try {
      setWatchingAd(true);
      await watchAdForPremium('short');
      Alert.alert('Premium Unlocked!', 'You now have temporary premium access.');
    } catch (error: any) {
      Alert.alert('Ad Error', error.message || 'Unable to watch ad right now.');
    } finally {
      setWatchingAd(false);
    }
  };

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View className="p-4 bg-[#F6F1DA] rounded-lg border border-[#E4E4E4]">
      <Text className="text-lg font-semibold text-[#062958] mb-2">
        Premium Feature
      </Text>
      <Text className="text-[#062958] mb-4">
        {featureName} is available in the Premium version.
      </Text>
      <View className="gap-2">
        <TouchableOpacity
          onPress={handleWatchAd}
          disabled={watchingAd || !canWatchAd}
          className="bg-[#2E8B57] px-6 py-3 rounded-lg"
          style={{ opacity: watchingAd || !canWatchAd ? 0.6 : 1 }}
        >
          {watchingAd ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Watch Ad for Temporary Premium
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/premium')}
          className="bg-[#062958] px-6 py-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Upgrade to Premium
          </Text>
        </TouchableOpacity>
      </View>

      {!canWatchAd && (
        <Text className="text-[#062958] mt-3 text-xs text-center">
          Ad unlock is on cooldown or daily limit reached. You can still upgrade any time.
        </Text>
      )}
    </View>
  );
};


