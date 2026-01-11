import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
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
  const router = useRouter();

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
      <TouchableOpacity
        onPress={() => router.push('/premium')}
        className="bg-[#062958] px-6 py-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">
          Upgrade to Premium
        </Text>
      </TouchableOpacity>
    </View>
  );
};


