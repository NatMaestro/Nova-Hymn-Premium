import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { playlistStorage } from '@/lib/playlistStorage';
import { Playlist, Hymn } from '@/types';
import { ArrowLeftIcon, TrashIcon } from 'react-native-heroicons/outline';

const PlaylistDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const playlistData = await playlistStorage.getPlaylist(id);
      setPlaylist(playlistData);
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHymn = (hymnId: number) => {
    Alert.alert(
      'Remove Hymn',
      'Are you sure you want to remove this hymn from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistStorage.removeHymnFromPlaylist(id, hymnId);
              await loadPlaylist();
            } catch (error) {
              console.error('Error removing hymn:', error);
              Alert.alert('Error', 'Failed to remove hymn');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Loading playlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: theme.colors.text, marginBottom: 8 }}>
            Playlist not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: theme.colors.textSecondary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ArrowLeftIcon size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.colors.text,
            }}
          >
            {playlist.name}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 }}>
            {playlist.hymns.length} {playlist.hymns.length === 1 ? 'hymn' : 'hymns'}
          </Text>
        </View>
      </View>

      {playlist.hymns.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: theme.colors.text, marginBottom: 8 }}>
            This playlist is empty
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
            Add hymns to this playlist from any hymn detail page
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlist.hymns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/all-hymns/${item.id}`)}
              style={{
                backgroundColor: theme.colors.card,
                marginHorizontal: 16,
                marginTop: 12,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                  Hymn #{item.number} • {item.category}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveHymn(item.id)}
                style={{ padding: 8, marginLeft: 12 }}
              >
                <TrashIcon size={20} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default PlaylistDetailScreen;

