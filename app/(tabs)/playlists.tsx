import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumGate } from '@/components/PremiumGate';
import { playlistStorage } from '@/lib/playlistStorage';
import { Playlist } from '@/types';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon } from 'react-native-heroicons/outline';

const PlaylistsScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const allPlaylists = await playlistStorage.getAllPlaylists();
      setPlaylists(allPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      await playlistStorage.createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
      await loadPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistStorage.deletePlaylist(playlist.id);
              await loadPlaylists();
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setShowCreateModal(true);
  };

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist || !newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      await playlistStorage.updatePlaylist(editingPlaylist.id, {
        name: newPlaylistName.trim(),
      });
      setNewPlaylistName('');
      setEditingPlaylist(null);
      setShowCreateModal(false);
      await loadPlaylists();
    } catch (error) {
      console.error('Error updating playlist:', error);
      Alert.alert('Error', 'Failed to update playlist');
    }
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <PremiumGate featureName="Custom Playlists">
            <View />
          </PremiumGate>
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
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            flex: 1,
          }}
        >
          My Playlists
        </Text>
        <TouchableOpacity
          onPress={() => {
            setEditingPlaylist(null);
            setNewPlaylistName('');
            setShowCreateModal(true);
          }}
          style={{
            backgroundColor: theme.colors.textSecondary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <PlusIcon size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: '600' }}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Loading playlists...</Text>
        </View>
      ) : playlists.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: theme.colors.text, marginBottom: 8 }}>
            No playlists yet
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
            Create your first playlist to organize your favorite hymns
          </Text>
          <TouchableOpacity
            onPress={() => {
              setEditingPlaylist(null);
              setNewPlaylistName('');
              setShowCreateModal(true);
            }}
            style={{
              marginTop: 20,
              backgroundColor: theme.colors.textSecondary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Create Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/playlists/${item.id}`)}
              style={{
                backgroundColor: theme.colors.card,
                marginHorizontal: 16,
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: theme.colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                    {item.hymns.length} {item.hymns.length === 1 ? 'hymn' : 'hymns'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleEditPlaylist(item)}
                    style={{ padding: 8 }}
                  >
                    <PencilIcon size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePlaylist(item)}
                    style={{ padding: 8 }}
                  >
                    <TrashIcon size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingPlaylist(null);
          setNewPlaylistName('');
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.text,
                marginBottom: 16,
              }}
            >
              {editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}
            </Text>

            <TextInput
              placeholder="Playlist name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={{
                backgroundColor: theme.colors.card,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.border,
                color: theme.colors.text,
                fontSize: 16,
                marginBottom: 16,
              }}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingPlaylist(null);
                  setNewPlaylistName('');
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: theme.colors.textSecondary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {editingPlaylist ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PlaylistsScreen;

