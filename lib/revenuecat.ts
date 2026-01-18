/**
 * RevenueCat Configuration
 * 
 * To set up RevenueCat:
 * 1. Sign up at https://www.revenuecat.com
 * 2. Create a project and get your API keys
 * 3. Add your API keys to .env or config
 * 4. Configure products in RevenueCat dashboard
 */

import { Platform } from "react-native";

// RevenueCat API Keys - Get these from your RevenueCat dashboard
// For now, using placeholder values - replace with your actual keys
export const REVENUECAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "your_ios_api_key_here",
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "your_android_api_key_here",
};

// Product IDs - These should match your App Store Connect / Google Play Console product IDs
export const PRODUCT_IDS = {
  premium_monthly: Platform.select({
    ios: "com.novahymnal.premium.monthly",
    android: "com.novahymnal.premium.monthly",
    default: "com.novahymnal.premium.monthly",
  })!,
  premium_yearly: Platform.select({
    ios: "com.novahymnal.premium.yearly",
    android: "com.novahymnal.premium.yearly",
    default: "com.novahymnal.premium.yearly",
  })!,
};

// Entitlement ID - This is the identifier for premium access in RevenueCat
export const ENTITLEMENT_ID = "premium";



