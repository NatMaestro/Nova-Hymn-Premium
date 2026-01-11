// API Configuration
// Supports environment-based configuration for dev and production

import { Platform } from "react-native";

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

// Environment info
export const ENV_INFO = {
  isDev: __DEV__,
  isProduction: !__DEV__,
  apiUrl: API_CONFIG.BASE_URL,
  useMockData: USE_MOCK_DATA,
};

// Log configuration in development
if (__DEV__) {
  console.log('📡 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    useMockData: USE_MOCK_DATA,
    timeout: API_CONFIG.TIMEOUT,
    platform: Platform.OS,
    note: Platform.OS === 'android' ? 'Using 10.0.2.2 for Android emulator' : 'Using localhost',
  });
}
