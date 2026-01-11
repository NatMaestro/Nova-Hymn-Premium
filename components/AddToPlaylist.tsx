import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { playlistStorage } from '@/lib/playlistStorage';
import { Playlist, Hymn } from '@/types';
import { PlusIcon, CheckIcon } from 'react-native-heroicons/outline';

interface AddToPlaylistProps {
  hymn: Hymn;
  onClose: () => void;
  onAdded?: () => void;
}

export const AddToPlaylist: React.FC<AddToPlaylistProps> = ({
  hymn,
  onClose,
  onAdded,
}) => {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

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

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Custom playlists are a premium feature.');
      return;
    }

    try {
      const success = await playlistStorage.addHymnToPlaylist(playlistId, hymn);
      if (success) {
        Alert.alert('Success', 'Hymn added to playlist!');
        onAdded?.();
        await loadPlaylists();
      } else {
        Alert.alert('Info', 'This hymn is already in the playlist');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      Alert.alert('Error', 'Failed to add hymn to playlist');
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      const newPlaylist = await playlistStorage.createPlaylist(newPlaylistName.trim());
      await playlistStorage.addHymnToPlaylist(newPlaylist.id, hymn);
      setNewPlaylistName('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Playlist created and hymn added!');
      onAdded?.();
      await loadPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const isHymnInPlaylist = (playlist: Playlist) => {
    return playlist.hymns.some(h => h.id === hymn.id);
  };

  if (!isPremium) {
    return null;
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Add to Playlist
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hymnTitle, { color: theme.colors.textSecondary }]}>
            {hymn.title}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.colors.text }}>Loading playlists...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={[
                  styles.createButton,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <PlusIcon size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.createButtonText, { color: theme.colors.textSecondary }]}>
                  Create New Playlist
                </Text>
              </TouchableOpacity>

              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isInPlaylist = isHymnInPlaylist(item);
                  return (
                    <TouchableOpacity
                      onPress={() => !isInPlaylist && handleAddToPlaylist(item.id)}
                      disabled={isInPlaylist}
                      style={[
                        styles.playlistItem,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          opacity: isInPlaylist ? 0.6 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playlistName, { color: theme.colors.text }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.playlistCount, { color: theme.colors.textSecondary }]}>
                          {item.hymns.length} {item.hymns.length === 1 ? 'hymn' : 'hymns'}
                        </Text>
                      </View>
                      {isInPlaylist && (
                        <CheckIcon size={20} color={theme.colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No playlists yet. Create one to get started!
                    </Text>
                  </View>
                )}
              />
            </>
          )}
        </View>
      </View>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setNewPlaylistName('');
        }}
      >
        <View style={styles.createModalOverlay}>
          <View style={[styles.createModalContent, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.createModalTitle, { color: theme.colors.text }]}>
              Create Playlist
            </Text>
            <Text style={[styles.createModalSubtitle, { color: theme.colors.textSecondary }]}>
              {hymn.title}
            </Text>
            <TextInput
              placeholder="Playlist name"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={[
                styles.createInput,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              autoFocus
            />
            <View style={styles.createModalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
                style={[
                  styles.createModalButton,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.createModalButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateAndAdd}
                style={[
                  styles.createModalButton,
                  { backgroundColor: theme.colors.textSecondary },
                ]}
              >
                <Text style={styles.createModalButtonTextWhite}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  hymnTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  createModalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  createInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  createModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  createModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createModalButtonTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

