// Storage utility for better persistence management
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
export const STORAGE_KEYS = {
  FAVORITES: "favorite_hymns",
  PREMIUM_STATUS: "premium_status",
  USER_PREFERENCES: "user_preferences",
  RECENT_HYMNS: "recent_hymns",
  OFFLINE_DATA: "offline_data",
} as const;

// Generic storage functions
export const storage = {
  // Get item
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  // Set item
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  // Remove item
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  // Clear all
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  },

  // Get multiple items
  async getMultiple(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error("Error getting multiple items from storage:", error);
      return [];
    }
  },

  // Set multiple items
  async setMultiple(keyValuePairs: [string, any][]): Promise<boolean> {
    try {
      const stringified = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(stringified);
      return true;
    } catch (error) {
      console.error("Error setting multiple items in storage:", error);
      return false;
    }
  },
};

// Specific storage functions for app features
export const favoritesStorage = {
  async get(): Promise<number[]> {
    return (await storage.get<number[]>(STORAGE_KEYS.FAVORITES)) || [];
  },

  async add(hymnId: number): Promise<boolean> {
    const favorites = await this.get();
    if (!favorites.includes(hymnId)) {
      favorites.push(hymnId);
      return await storage.set(STORAGE_KEYS.FAVORITES, favorites);
    }
    return true;
  },

  async remove(hymnId: number): Promise<boolean> {
    const favorites = await this.get();
    const updated = favorites.filter((id) => id !== hymnId);
    return await storage.set(STORAGE_KEYS.FAVORITES, updated);
  },

  async toggle(hymnId: number): Promise<boolean> {
    const favorites = await this.get();
    if (favorites.includes(hymnId)) {
      return await this.remove(hymnId);
    } else {
      return await this.add(hymnId);
    }
  },

  async isFavorite(hymnId: number): Promise<boolean> {
    const favorites = await this.get();
    return favorites.includes(hymnId);
  },

  async clear(): Promise<boolean> {
    return await storage.remove(STORAGE_KEYS.FAVORITES);
  },
};

export const recentHymnsStorage = {
  async get(limit: number = 10): Promise<number[]> {
    const recent = (await storage.get<number[]>(STORAGE_KEYS.RECENT_HYMNS)) || [];
    return recent.slice(0, limit);
  },

  async add(hymnId: number): Promise<boolean> {
    const recent = await this.get(50); // Keep last 50
    const updated = [hymnId, ...recent.filter((id) => id !== hymnId)];
    return await storage.set(STORAGE_KEYS.RECENT_HYMNS, updated.slice(0, 50));
  },

  async clear(): Promise<boolean> {
    return await storage.remove(STORAGE_KEYS.RECENT_HYMNS);
  },
};

export const preferencesStorage = {
  async get(): Promise<Record<string, any>> {
    return (await storage.get<Record<string, any>>(STORAGE_KEYS.USER_PREFERENCES)) || {};
  },

  async set(preferences: Record<string, any>): Promise<boolean> {
    return await storage.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  async update(key: string, value: any): Promise<boolean> {
    const preferences = await this.get();
    preferences[key] = value;
    return await this.set(preferences);
  },
};

