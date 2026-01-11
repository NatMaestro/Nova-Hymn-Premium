import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getHymnSheetMusic, getHymnById, getSheetMusicById } from '@/lib/api';
import { SheetMusicViewer } from '@/components/SheetMusicViewer';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumGate } from '@/components/PremiumGate';

const SheetMusicDetail = () => {
  const { id, hymnId, title } = useLocalSearchParams();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [sheetMusicUrl, setSheetMusicUrl] = useState<string | null>(null);
  const [hymnTitle, setHymnTitle] = useState<string>(title as string || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSheetMusic();
  }, [id]);

  const fetchSheetMusic = async () => {
    try {
      setLoading(true);
      
      let sheetMusicData: any;
      
      // If hymnId exists, fetch hymn-related sheet music
      if (hymnId && hymnId !== '') {
        try {
          sheetMusicData = await getHymnSheetMusic(Number(hymnId));
        } catch (error) {
          console.warn('Failed to fetch hymn sheet music, trying by ID:', error);
          // Fallback to fetching by sheet music ID
          sheetMusicData = await getSheetMusicById(Number(id));
        }
      } else {
        // Fetch general sheet music by ID
        sheetMusicData = await getSheetMusicById(Number(id));
      }
      
      const url = typeof sheetMusicData === 'string' 
        ? sheetMusicData 
        : sheetMusicData?.url || sheetMusicData?.file_url;
      
      if (!url) {
        console.warn('No sheet music URL found');
        setSheetMusicUrl(null);
        return;
      }
      
      console.log('Sheet music URL:', url);
      setSheetMusicUrl(url);

      // Get title
      if (sheetMusicData?.title) {
        setHymnTitle(sheetMusicData.title);
      } else if (hymnId && hymnId !== '') {
        try {
          const hymn = await getHymnById(Number(hymnId));
          setHymnTitle(hymn.title);
        } catch (error) {
          console.warn('Could not fetch hymn title:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching sheet music:', error);
      setSheetMusicUrl(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-[#FCF7E7]">
        <StatusBar barStyle="dark-content" backgroundColor="#FCF7E7" />
        <View className="flex-1 items-center justify-center p-5">
          <PremiumGate featureName="Sheet Music Viewer">
            <View />
          </PremiumGate>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FCF7E7] items-center justify-center">
        <ActivityIndicator size="large" color="#062958" />
        <Text className="text-lg text-[#062958] mt-4">Loading sheet music...</Text>
      </SafeAreaView>
    );
  }

  if (!sheetMusicUrl) {
    return (
      <SafeAreaView className="flex-1 bg-[#FCF7E7] items-center justify-center p-5">
        <Text className="text-lg text-[#062958] mb-4">
          Sheet music not available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#062958] px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SheetMusicViewer
      sheetMusicUrl={sheetMusicUrl}
      hymnTitle={hymnTitle || 'Sheet Music'}
    />
  );
};

export default SheetMusicDetail;

