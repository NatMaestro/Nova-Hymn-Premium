/**
 * Ad-Based Premium Unlock Utilities
 * 
 * This module handles storage and management of ad-based premium unlocks.
 * When AdMob is integrated, this will be used to track temporary premium access.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AD_UNLOCK_SETTINGS } from "@/lib/config";

export type AdUnlockType = "short" | "medium" | "long";

export interface AdUnlockData {
  expiresAt: string; // ISO timestamp
  unlockType: AdUnlockType;
  adUnlockCount: number; // Total ads watched today
  lastAdWatchDate: string; // Date string (YYYY-MM-DD) for daily reset
}

const AD_UNLOCK_STORAGE_KEY = "ad_unlock_data";

// Unlock duration configuration (in hours)
export const AD_UNLOCK_CONFIG: Record<AdUnlockType, { durationHours: number; label: string }> = {
  short: {
    durationHours: AD_UNLOCK_SETTINGS.durationsHours.short,
    label: "1 Hour Premium",
  },
  medium: {
    durationHours: AD_UNLOCK_SETTINGS.durationsHours.medium,
    label: "4 Hours Premium",
  },
  long: {
    durationHours: AD_UNLOCK_SETTINGS.durationsHours.long,
    label: "24 Hours Premium",
  },
};

/**
 * Get stored ad unlock data
 */
export const getAdUnlockData = async (): Promise<AdUnlockData | null> => {
  try {
    const stored = await AsyncStorage.getItem(AD_UNLOCK_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AdUnlockData;
  } catch (error) {
    console.error("Error getting ad unlock data:", error);
    return null;
  }
};

/**
 * Save ad unlock data
 */
export const saveAdUnlockData = async (data: AdUnlockData): Promise<void> => {
  try {
    await AsyncStorage.setItem(AD_UNLOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving ad unlock data:", error);
    throw error;
  }
};

/**
 * Clear ad unlock data
 */
export const clearAdUnlockData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AD_UNLOCK_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing ad unlock data:", error);
  }
};

/**
 * Check if ad unlock is currently active
 */
export const isAdUnlockActive = async (): Promise<boolean> => {
  const data = await getAdUnlockData();
  if (!data) return false;

  const expiresAt = new Date(data.expiresAt);
  const now = new Date();

  // Check if expired
  if (now >= expiresAt) {
    // Clean up expired unlock
    await clearAdUnlockData();
    return false;
  }

  return true;
};

/**
 * Get remaining unlock time in seconds
 */
export const getRemainingUnlockTime = async (): Promise<number> => {
  const data = await getAdUnlockData();
  if (!data) return 0;

  const expiresAt = new Date(data.expiresAt);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

  // If expired, clear and return 0
  if (remaining === 0) {
    await clearAdUnlockData();
  }

  return remaining;
};

/**
 * Create new ad unlock (called after successful ad watch)
 */
export const createAdUnlock = async (unlockType: AdUnlockType): Promise<AdUnlockData> => {
  const config = AD_UNLOCK_CONFIG[unlockType];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.durationHours * 60 * 60 * 1000);

  // Get existing data to track daily count
  const existing = await getAdUnlockData();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const adUnlockCount =
    existing && existing.lastAdWatchDate === today
      ? existing.adUnlockCount + 1
      : 1;

  const newData: AdUnlockData = {
    expiresAt: expiresAt.toISOString(),
    unlockType,
    adUnlockCount,
    lastAdWatchDate: today,
  };

  await saveAdUnlockData(newData);
  return newData;
};

/**
 * Check if user can watch another ad (rate limiting)
 */
export const canWatchAd = async (
  maxAdsPerDay: number = AD_UNLOCK_SETTINGS.maxAdsPerDay
): Promise<boolean> => {
  const dailyLimit = maxAdsPerDay;
  const data = await getAdUnlockData();
  if (!data) return true;

  const today = new Date().toISOString().split("T")[0];
  
  // Reset count if it's a new day
  if (data.lastAdWatchDate !== today) {
    return true;
  }

  // Check if under daily limit
  return data.adUnlockCount < dailyLimit;
};

/**
 * Format remaining time as human-readable string
 */
export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return "Expired";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

