import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSheetMusicLibrary } from '@/lib/api';
import { SheetMusic } from '@/types';
import { PremiumGate } from '@/components/PremiumGate';
import { usePremium } from '@/contexts/PremiumContext';

const SheetMusicLibrary = () => {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [sheetMusic, setSheetMusic] = useState<SheetMusic[]>([]);
  const [filteredSheetMusic, setFilteredSheetMusic] = useState<SheetMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSheetMusic();
  }, []);

  const fetchSheetMusic = async () => {
    try {
      setLoading(true);
      const data = await getSheetMusicLibrary();
      setSheetMusic(data);
      setFilteredSheetMusic(data);
    } catch (error) {
      console.error('Error fetching sheet music:', error);
      setSheetMusic([]);
      setFilteredSheetMusic([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSheetMusic(sheetMusic);
    } else {
      const filtered = sheetMusic.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hymnId.toString().includes(searchQuery)
      );
      setFilteredSheetMusic(filtered);
    }
  }, [searchQuery, sheetMusic]);

  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-[#FCF7E7]">
        <StatusBar barStyle="dark-content" backgroundColor="#FCF7E7" />
        <View className="flex-1 items-center justify-center p-5">
          <PremiumGate featureName="Sheet Music Library">
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

  return (
    <SafeAreaView className="flex-1 bg-[#FCF7E7]">
      <StatusBar barStyle="dark-content" backgroundColor="#FCF7E7" />
      
      <View className="px-5 pt-5">
        <Text className="text-3xl font-bold text-[#062958] mb-4">
          Sheet Music Library
        </Text>
        <Text className="text-lg text-[#062958] opacity-75 mb-4">
          Browse and search all available sheet music
        </Text>
        
        {/* Search Bar */}
        <View className="bg-[#FFFEF1] rounded-lg border border-[#E4E4E4] mb-4">
          <TextInput
            placeholder="Search by title or hymn number..."
            placeholderTextColor="#06295880"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="px-4 py-3 text-[#062958] text-lg"
            style={{ fontSize: 16 }}
          />
        </View>
      </View>

      <FlatList
        data={filteredSheetMusic}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/sheet-music/[id]',
              params: { id: item.id, hymnId: item.hymnId }
            })}
            className="bg-[#FFFEF1] mx-5 mb-4 p-4 rounded-lg border border-[#E4E4E4]"
          >
            <View className="flex-row items-center">
              {item.thumbnailUrl && (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  className="w-16 h-16 rounded mr-4"
                  resizeMode="cover"
                />
              )}
              <View className="flex-1">
                <Text className="text-xl font-semibold text-[#062958]">
                  {item.title}
                </Text>
                <Text className="text-sm text-[#062958] opacity-75 mt-1">
                  Hymn #{item.hymnId}
                </Text>
              </View>
              <Image
                source={require('../../assets/icons/forward.png')}
                className="h-6 w-6"
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10 px-5">
            <Text className="text-lg text-[#062958] text-center">
              {searchQuery.trim() 
                ? `No sheet music found matching "${searchQuery}"`
                : 'No sheet music available yet.'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default SheetMusicLibrary;

