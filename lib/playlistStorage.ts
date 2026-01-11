import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, Hymn } from '@/types';

const PLAYLISTS_KEY = '@hymn_playlists';

export const playlistStorage = {
  // Get all playlists
  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      const stored = await AsyncStorage.getItem(PLAYLISTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  },

  // Get a single playlist by ID
  async getPlaylist(id: string): Promise<Playlist | null> {
    const playlists = await this.getAllPlaylists();
    return playlists.find(p => p.id === id) || null;
  },

  // Create a new playlist
  async createPlaylist(name: string): Promise<Playlist> {
    const playlists = await this.getAllPlaylists();
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      hymns: [],
      createdAt: new Date().toISOString(),
    };
    playlists.push(newPlaylist);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    return newPlaylist;
  },

  // Update a playlist
  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | null> {
    const playlists = await this.getAllPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    if (index === -1) return null;

    playlists[index] = { ...playlists[index], ...updates };
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    return playlists[index];
  },

  // Delete a playlist
  async deletePlaylist(id: string): Promise<boolean> {
    const playlists = await this.getAllPlaylists();
    const filtered = playlists.filter(p => p.id !== id);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered));
    return true;
  },

  // Add hymn to playlist
  async addHymnToPlaylist(playlistId: string, hymn: Hymn): Promise<boolean> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    // Check if hymn already exists
    if (playlist.hymns.some(h => h.id === hymn.id)) {
      return false; // Already exists
    }

    playlist.hymns.push(hymn);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    return true;
  },

  // Remove hymn from playlist
  async removeHymnFromPlaylist(playlistId: string, hymnId: number): Promise<boolean> {
    const playlists = await this.getAllPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;

    playlist.hymns = playlist.hymns.filter(h => h.id !== hymnId);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    return true;
  },

  // Get playlists containing a specific hymn
  async getPlaylistsWithHymn(hymnId: number): Promise<Playlist[]> {
    const playlists = await this.getAllPlaylists();
    return playlists.filter(p => p.hymns.some(h => h.id === hymnId));
  },
};

