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
  adUnlockCount: number; // kept for backward compat
  lastAdWatchDate: string; // kept for backward compat
}

/**
 * Separate from AdUnlockData so daily count and cooldown survive
 * unlock expiry. This key is never cleared automatically.
 */
export interface AdRateLimitData {
  dailyCount: number;
  lastWatchDate: string;  // YYYY-MM-DD
  lastWatchedAt: string;  // ISO timestamp of most recent ad watch
}

/**
 * Reason the user is blocked from watching another ad.
 * `cooldown_active` includes seconds until the user may watch again.
 */
export type AdWatchBlockReason =
  | { reason: 'daily_limit' }
  | { reason: 'cooldown_active'; cooldownSecondsRemaining: number };

const AD_UNLOCK_STORAGE_KEY = "ad_unlock_data";
const AD_RATE_LIMIT_STORAGE_KEY = "ad_rate_limit_data";

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

export const getAdRateLimitData = async (): Promise<AdRateLimitData | null> => {
  try {
    const stored = await AsyncStorage.getItem(AD_RATE_LIMIT_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AdRateLimitData;
  } catch {
    return null;
  }
};

const saveAdRateLimitData = async (data: AdRateLimitData): Promise<void> => {
  await AsyncStorage.setItem(AD_RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
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
 * Create new ad unlock (called after successful ad watch).
 * Also updates the persistent rate-limit record.
 */
export const createAdUnlock = async (unlockType: AdUnlockType): Promise<AdUnlockData> => {
  const config = AD_UNLOCK_CONFIG[unlockType];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.durationHours * 60 * 60 * 1000);
  const today = now.toISOString().split("T")[0];

  // Update rate-limit tracking in its own store so it survives unlock expiry.
  const existing = await getAdRateLimitData();
  const newRateLimit: AdRateLimitData = {
    dailyCount:
      existing && existing.lastWatchDate === today
        ? existing.dailyCount + 1
        : 1,
    lastWatchDate: today,
    lastWatchedAt: now.toISOString(),
  };
  await saveAdRateLimitData(newRateLimit);

  const newData: AdUnlockData = {
    expiresAt: expiresAt.toISOString(),
    unlockType,
    adUnlockCount: newRateLimit.dailyCount,
    lastAdWatchDate: today,
  };

  await saveAdUnlockData(newData);
  return newData;
};

/**
 * Seconds remaining in the per-ad cooldown window.
 * Returns 0 when the user is free to watch again.
 */
export const getCooldownRemainingSeconds = async (): Promise<number> => {
  const cooldownMs = AD_UNLOCK_SETTINGS.cooldownMinutes * 60 * 1000;
  if (cooldownMs <= 0) return 0;

  const data = await getAdRateLimitData();
  if (!data) return 0;

  const cooldownEndsAt = new Date(data.lastWatchedAt).getTime() + cooldownMs;
  return Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
};

/**
 * Returns the reason the user cannot watch an ad right now,
 * or null if they are allowed.
 * Checks daily limit before cooldown so the most permanent block surfaces first.
 */
export const getAdWatchBlockReason = async (
  maxAdsPerDay: number = AD_UNLOCK_SETTINGS.maxAdsPerDay
): Promise<AdWatchBlockReason | null> => {
  const data = await getAdRateLimitData();
  if (!data) return null;

  const today = new Date().toISOString().split("T")[0];

  // New day — counts reset automatically.
  if (data.lastWatchDate !== today) return null;

  // Daily limit is a hard block.
  if (data.dailyCount >= maxAdsPerDay) {
    return { reason: 'daily_limit' };
  }

  // Soft block: within cooldown window.
  const cooldownSecondsRemaining = await getCooldownRemainingSeconds();
  if (cooldownSecondsRemaining > 0) {
    return { reason: 'cooldown_active', cooldownSecondsRemaining };
  }

  return null;
};

/**
 * Quick boolean check — delegates to getAdWatchBlockReason.
 */
export const canWatchAd = async (
  maxAdsPerDay: number = AD_UNLOCK_SETTINGS.maxAdsPerDay
): Promise<boolean> => {
  const blockReason = await getAdWatchBlockReason(maxAdsPerDay);
  return blockReason === null;
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

