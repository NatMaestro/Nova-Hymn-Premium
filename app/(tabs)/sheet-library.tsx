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
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSheetMusicLibrary } from '@/lib/api';
import { SheetMusic } from '@/types';
import { PremiumGate } from '@/components/PremiumGate';
import { usePremium } from '@/contexts/PremiumContext';
import { useTheme } from '@/contexts/ThemeContext';

const SheetMusicLibrary = () => {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { theme } = useTheme();
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
      const query = searchQuery.toLowerCase();
      const filtered = sheetMusic.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        (item.composer && item.composer.toLowerCase().includes(query)) ||
        (item.hymnId && item.hymnId.toString().includes(searchQuery))
      );
      setFilteredSheetMusic(filtered);
    }
  }, [searchQuery, sheetMusic]);

  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={styles.centerContent}>
          <PremiumGate featureName="Sheet Music Library">
            <View />
          </PremiumGate>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading sheet music...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Sheet Music Library
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Browse and search all available sheet music
        </Text>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TextInput
            placeholder="Search by title or composer..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
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
              params: { 
                id: item.id.toString(), 
                hymnId: item.hymnId?.toString() || '',
                title: item.title
              }
            })}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.colors.accent }]}>
                  <Text style={[styles.thumbnailText, { color: theme.colors.textSecondary }]}>
                    PDF
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text 
                  style={[styles.cardTitle, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.composer && (
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    {item.composer}
                  </Text>
                )}
              </View>
              <Image
                source={require('../../assets/icons/forward.png')}
                style={styles.forwardIcon}
                resizeMode="contain"
                tintColor={theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  searchContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  forwardIcon: {
    height: 24,
    width: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default SheetMusicLibrary;

