// API Configuration
// Supports environment-based configuration for dev and production

import { Platform } from "react-native";

const parseNumberEnv = (
  key: string,
  fallback: number,
  minValue: number = 0
): number => {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minValue) {
    if (__DEV__) {
      console.warn(
        `[Config] Invalid ${key}="${raw}". Falling back to ${fallback}.`
      );
    }
    return fallback;
  }

  return parsed;
};

const getStringEnv = (key: string, fallback: string = ""): string => {
  return process.env[key] || fallback;
};

const DEFAULT_ADMOB_TEST_IDS = {
  rewardedAndroid: "ca-app-pub-9675131081126619/3893725811",
  rewardedIos: "ca-app-pub-9675131081126619/5226988781",
  //change the banner later
  bannerAndroid: "ca-app-pub-3940256099942544/6300978111",
  bannerIos: "ca-app-pub-3940256099942544/2934735716",
};

// Get the correct localhost address based on platform
const getLocalhostAddress = (): string => {
  // Check for explicit override (highest priority)
  if (process.env.EXPO_PUBLIC_DEV_API_URL) {
    return process.env.EXPO_PUBLIC_DEV_API_URL;
  }

  // Android emulator uses 10.0.2.2 to access host machine's localhost
  // However, sometimes this doesn't work, so we'll try localhost first
  // and provide instructions for using computer IP if needed
  if (Platform.OS === 'android') {
    // Try 10.0.2.2 first (standard Android emulator address)
    // If this doesn't work, user should set EXPO_PUBLIC_DEV_API_URL with their computer IP
    return "http://10.0.2.2:8000/api/v1";
  }
  
  // iOS simulator and web can use localhost
  return "http://localhost:8000/api/v1";
};

// Get API URL from environment variable or use defaults
const getApiBaseUrl = (): string => {
  // Check for explicit environment variable (highest priority)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Check for environment-specific variables
  const env = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development';
  
  if (env === 'production' || !__DEV__) {
    // Production: Use Render URL or environment variable
    return process.env.EXPO_PUBLIC_PROD_API_URL || "https://nova-hymnal-be.onrender.com/api/v1";
  } else {
    // Development: Use platform-specific localhost
    return getLocalhostAddress();
  }
};

// Set USE_MOCK_DATA to false to use real backend
// Can be overridden via environment variable: EXPO_PUBLIC_USE_MOCK_DATA=true
export const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true'; // Default to false (use real backend)

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
  RETRY_ATTEMPTS: parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
  RETRY_DELAY: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000', 10),
};

export const ADMOB_CONFIG = {
  androidAppId: getStringEnv("EXPO_PUBLIC_ADMOB_ANDROID_APP_ID"),
  iosAppId: getStringEnv("EXPO_PUBLIC_ADMOB_IOS_APP_ID"),
  rewardedAdUnitIdAndroid: getStringEnv(
    "EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID",
    __DEV__ ? DEFAULT_ADMOB_TEST_IDS.rewardedAndroid : ""
  ),
  rewardedAdUnitIdIos: getStringEnv(
    "EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS",
    __DEV__ ? DEFAULT_ADMOB_TEST_IDS.rewardedIos : ""
  ),
  bannerAdUnitIdAndroid: getStringEnv(
    "EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID",
    __DEV__ ? DEFAULT_ADMOB_TEST_IDS.bannerAndroid : ""
  ),
  bannerAdUnitIdIos: getStringEnv(
    "EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_IOS",
    __DEV__ ? DEFAULT_ADMOB_TEST_IDS.bannerIos : ""
  ),
  rewardedAdUnitId:
    Platform.OS === "ios"
      ? getStringEnv(
          "EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS",
          __DEV__ ? DEFAULT_ADMOB_TEST_IDS.rewardedIos : ""
        )
      : getStringEnv(
          "EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID",
          __DEV__ ? DEFAULT_ADMOB_TEST_IDS.rewardedAndroid : ""
        ),
  bannerAdUnitId:
    Platform.OS === "ios"
      ? getStringEnv(
          "EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_IOS",
          __DEV__ ? DEFAULT_ADMOB_TEST_IDS.bannerIos : ""
        )
      : getStringEnv(
          "EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_ANDROID",
          __DEV__ ? DEFAULT_ADMOB_TEST_IDS.bannerAndroid : ""
        ),
};

export const AD_UNLOCK_SETTINGS = {
  maxAdsPerDay: parseNumberEnv("EXPO_PUBLIC_MAX_ADS_PER_DAY", 5, 1),
  cooldownMinutes: parseNumberEnv("EXPO_PUBLIC_AD_COOLDOWN_MINUTES", 10, 0),
  durationsHours: {
    short: parseNumberEnv("EXPO_PUBLIC_AD_UNLOCK_SHORT_DURATION_HOURS", 1, 1),
    medium: parseNumberEnv("EXPO_PUBLIC_AD_UNLOCK_MEDIUM_DURATION_HOURS", 4, 1),
    long: parseNumberEnv("EXPO_PUBLIC_AD_UNLOCK_LONG_DURATION_HOURS", 24, 1),
  },
};

const validateAdMobAndUnlockConfig = (): void => {
  if (Platform.OS === "web") return;

  const warnings: string[] = [];

  if (!ADMOB_CONFIG.androidAppId) {
    warnings.push("EXPO_PUBLIC_ADMOB_ANDROID_APP_ID is missing.");
  }

  if (!ADMOB_CONFIG.iosAppId) {
    warnings.push("EXPO_PUBLIC_ADMOB_IOS_APP_ID is missing.");
  }

  if (!ADMOB_CONFIG.rewardedAdUnitIdAndroid) {
    warnings.push("EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_ANDROID is missing.");
  }

  if (!ADMOB_CONFIG.rewardedAdUnitIdIos) {
    warnings.push("EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_IOS is missing.");
  }

  if (AD_UNLOCK_SETTINGS.maxAdsPerDay < 1) {
    warnings.push("EXPO_PUBLIC_MAX_ADS_PER_DAY must be >= 1.");
  }

  if (AD_UNLOCK_SETTINGS.cooldownMinutes < 0) {
    warnings.push("EXPO_PUBLIC_AD_COOLDOWN_MINUTES must be >= 0.");
  }

  if (__DEV__ && warnings.length > 0) {
    console.warn("[AdMob Config] Validation warnings:\n- " + warnings.join("\n- "));
  }
};

// Environment info
export const ENV_INFO = {
  isDev: __DEV__,
  isProduction: !__DEV__,
  apiUrl: API_CONFIG.BASE_URL,
  useMockData: USE_MOCK_DATA,
  admobRewardedUnitConfigured: Boolean(ADMOB_CONFIG.rewardedAdUnitId),
  adUnlockSettings: AD_UNLOCK_SETTINGS,
};

// Log configuration in development
if (__DEV__) {
  validateAdMobAndUnlockConfig();

  console.log('📡 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    useMockData: USE_MOCK_DATA,
    timeout: API_CONFIG.TIMEOUT,
    platform: Platform.OS,
    note: Platform.OS === 'android' ? 'Using 10.0.2.2 for Android emulator' : 'Using localhost',
  });

  console.log('🎯 AdMob Configuration:', {
    hasAndroidAppId: Boolean(ADMOB_CONFIG.androidAppId),
    hasIosAppId: Boolean(ADMOB_CONFIG.iosAppId),
    rewardedUnitIdConfigured: Boolean(ADMOB_CONFIG.rewardedAdUnitId),
    bannerUnitIdConfigured: Boolean(ADMOB_CONFIG.bannerAdUnitId),
    unlockSettings: AD_UNLOCK_SETTINGS,
  });
}
