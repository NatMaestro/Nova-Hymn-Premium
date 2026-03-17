import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { REVENUECAT_API_KEYS, ENTITLEMENT_ID } from "@/lib/revenuecat";
import { verifySubscription } from "@/lib/api";
import {
  isAdUnlockActive,
  getRemainingUnlockTime,
  AdUnlockType,
  createAdUnlock,
  canWatchAd as canWatchAdUtil,
  getAdUnlockData,
} from "@/lib/adUnlock";
import { runRewardedAdFlow } from "@/lib/admob";

// Dynamically import RevenueCat to handle cases where it's not installed
let Purchases: any = null;
try {
  const PurchasesModule = require("react-native-purchases");
  // Check if the module has the default export or named exports
  Purchases = PurchasesModule.default || PurchasesModule;
  
  // Verify that Purchases has the required methods
  if (Purchases && typeof Purchases.configure !== 'function') {
    console.warn("RevenueCat SDK loaded but configure method not available");
    Purchases = null;
  }
} catch (error) {
  console.warn(
    "react-native-purchases not available. Install with: npm install react-native-purchases"
  );
  Purchases = null;
}

// Type definitions for RevenueCat (fallback if types not available)
interface CustomerInfo {
  entitlements: {
    active: { [key: string]: any };
  };
  originalAppUserId: string;
}

interface PurchasesOffering {
  availablePackages: PurchasesPackage[];
}

interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
  };
}

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
  offerings: PurchasesOffering | null;
  toggleDevMode?: () => Promise<void>; // For development only
  
  // Ad-based unlock properties (for future AdMob integration)
  adUnlockExpiresAt: Date | null;
  adUnlockType: AdUnlockType | null;
  remainingAdUnlockTime: number; // seconds remaining
  canWatchAd: boolean;
  watchAdForPremium: (unlockType: AdUnlockType) => Promise<void>; // Placeholder for AdMob integration
  getAdUnlockStatus: () => {
    isActive: boolean;
    expiresAt: Date | null;
    timeRemaining: number;
  };
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_STORAGE_KEY = "premium_status";
const DEV_MODE_KEY = "dev_mode_premium"; // For development/testing
const AD_UNLOCK_STORAGE_KEY = "ad_unlock_data"; // For ad-based premium unlocks

// ============================================
// PREMIUM FEATURE FLAGS
// ============================================
// Set to true to enable dev mode (simulates premium without purchase)
const ENABLE_DEV_MODE = false;

// Set to true to use RevenueCat, false to use legacy expo-in-app-purchases
const USE_REVENUECAT = true;

// Ad unlock is now active — AdMob integration is wired up.
const ENABLE_PREMIUM_FEATURES = true;

export const PremiumProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  
  // Ad unlock state (for future AdMob integration)
  const [adUnlockExpiresAt, setAdUnlockExpiresAt] = useState<Date | null>(null);
  const [adUnlockType, setAdUnlockType] = useState<AdUnlockType | null>(null);
  const [remainingAdUnlockTime, setRemainingAdUnlockTime] = useState(0);
  const [canWatchAd, setCanWatchAd] = useState(true);

  useEffect(() => {
    // Only initialize RevenueCat if premium features are enabled
    if (ENABLE_PREMIUM_FEATURES && USE_REVENUECAT && Platform.OS !== "web") {
      initializeRevenueCat();
    }
    checkPremiumStatus();
  }, []);

  // Update RevenueCat user ID when authentication changes
  useEffect(() => {
    // Skip if premium features are disabled
    if (!ENABLE_PREMIUM_FEATURES) return;
    
    if (!Purchases || !USE_REVENUECAT || Platform.OS === "web") return;
    
    // Check if methods exist before calling
    if (typeof Purchases.logIn !== 'function' || typeof Purchases.logOut !== 'function') {
      console.warn("RevenueCat methods not available");
      return;
    }

    if (isAuthenticated && user) {
      Purchases.logIn(user.id.toString()).catch((error: any) => {
        console.warn("Error logging in to RevenueCat:", error);
      });
    } else if (!isAuthenticated) {
      Purchases.logOut().catch((error: any) => {
        console.warn("Error logging out of RevenueCat:", error);
      });
    }
  }, [isAuthenticated, user]);

  // Re-check premium status when user authentication changes
  useEffect(() => {
    checkPremiumStatus();
  }, [isAuthenticated, user]);

  // Check ad unlock status periodically (every minute)
  useEffect(() => {
    const checkAdUnlock = async () => {
      const hasAdUnlock = await isAdUnlockActive();
      if (hasAdUnlock) {
        const remaining = await getRemainingUnlockTime();
        setRemainingAdUnlockTime(remaining);
        if (remaining === 0) {
          // Unlock expired, refresh premium status
          await checkPremiumStatus();
        }
      } else {
        setRemainingAdUnlockTime(0);
        setAdUnlockExpiresAt(null);
        setAdUnlockType(null);
      }
    };

    // Check immediately
    checkAdUnlock();

    // Then check every minute
    const interval = setInterval(checkAdUnlock, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Update canWatchAd status
  useEffect(() => {
    const updateCanWatchAd = async () => {
      const canWatchResult = await canWatchAdUtil();
      setCanWatchAd(canWatchResult);
    };
    updateCanWatchAd();
  }, []);

  const initializeRevenueCat = async () => {
    if (!Purchases) {
      console.warn("RevenueCat SDK not available");
      return;
    }

    // Check if configure method exists
    if (typeof Purchases.configure !== 'function') {
      console.warn("RevenueCat configure method not available. SDK may not be properly loaded.");
      return;
    }

    try {
      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEYS.ios
          : REVENUECAT_API_KEYS.android;

      if (
        apiKey &&
        apiKey !== "your_ios_api_key_here" &&
        apiKey !== "your_android_api_key_here"
      ) {
        await Purchases.configure({ apiKey });

        // Fetch offerings
        if (typeof Purchases.getOfferings === 'function') {
          const offerings = await Purchases.getOfferings();
          if (offerings.current !== null) {
            setOfferings(offerings.current);
          }
        }

        // Set up customer info update listener
        if (typeof Purchases.addCustomerInfoUpdateListener === 'function') {
          Purchases.addCustomerInfoUpdateListener(
            (customerInfo: CustomerInfo) => {
              updatePremiumStatus(customerInfo);
            }
          );
        }
      } else {
        console.warn(
          "RevenueCat API key not configured. Using dev mode or fallback."
        );
      }
    } catch (error: any) {
      console.error("Error initializing RevenueCat:", error);
    }
  };

  const updatePremiumStatus = (customerInfo?: CustomerInfo) => {
    if (customerInfo) {
      const hasPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(hasPremium);
      AsyncStorage.setItem(PREMIUM_STORAGE_KEY, hasPremium ? "true" : "false");
    }
  };

  const checkPremiumStatus = async () => {
    try {
      setIsLoading(true);

      // TEMPORARILY DISABLED: Return false if premium features are disabled
      if (!ENABLE_PREMIUM_FEATURES) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      // Check dev mode first (for development/testing)
      if (ENABLE_DEV_MODE) {
        const devMode = await AsyncStorage.getItem(DEV_MODE_KEY);
        if (devMode === "true") {
          setIsPremium(true);
          setIsLoading(false);
          return;
        }
      }

      // If using RevenueCat, check entitlement status
      if (USE_REVENUECAT && Platform.OS !== "web" && Purchases) {
        try {
          const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
          const hasPremium =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

          if (hasPremium) {
            setIsPremium(true);
            await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, "true");

            // If authenticated, sync with backend
            if (isAuthenticated && user) {
              await syncSubscriptionWithBackend(customerInfo);
            }

            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          console.warn("Error checking RevenueCat status:", error);
          // Fall through to backend check
        }
      }

      // If user is authenticated, check backend subscription status
      if (isAuthenticated && user) {
        try {
          const { getSubscriptionStatus } = await import("@/lib/api");
          const status = await getSubscriptionStatus();
          if (status.has_premium) {
            setIsPremium(true);
            await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, "true");
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn("Error checking backend subscription:", error);
          // Fall through to local check
        }
      }

      // Check ad-based unlock (for future AdMob integration)
      const hasAdUnlock = await isAdUnlockActive();
      if (hasAdUnlock) {
        const remaining = await getRemainingUnlockTime();
        setRemainingAdUnlockTime(remaining);
        // Get unlock data for type
        const { getAdUnlockData } = await import("@/lib/adUnlock");
        const unlockData = await getAdUnlockData();
        if (unlockData) {
          setAdUnlockExpiresAt(new Date(unlockData.expiresAt));
          setAdUnlockType(unlockData.unlockType);
        }
        setIsPremium(true);
        setIsLoading(false);
        return;
      } else {
        // Clear ad unlock state if expired
        setAdUnlockExpiresAt(null);
        setAdUnlockType(null);
        setRemainingAdUnlockTime(0);
      }

      // Check local storage
      const stored = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
      if (stored === "true") {
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      setIsPremium(false);
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const syncSubscriptionWithBackend = async (customerInfo: CustomerInfo) => {
    try {
      if (!isAuthenticated || !user) return;

      const activeEntitlement =
        customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (!activeEntitlement) return;

      // Get the latest transaction
      const latestTransaction = activeEntitlement.latestPurchaseDate;
      const productIdentifier = activeEntitlement.productIdentifier;

      // Verify subscription with backend
      await verifySubscription({
        transaction_id:
          activeEntitlement.originalTransactionIdentifier ||
          customerInfo.originalAppUserId,
        product_id: productIdentifier,
        receipt_data: JSON.stringify(customerInfo),
        platform: Platform.OS === "ios" ? "ios" : "android",
      });
    } catch (error) {
      console.error("Error syncing subscription with backend:", error);
    }
  };

  const purchasePremium = async () => {
    try {
      // Dev mode: Simulate purchase
      if (ENABLE_DEV_MODE) {
        console.log("🧪 DEV MODE: Simulating premium purchase");
        await AsyncStorage.setItem(DEV_MODE_KEY, "true");
        setIsPremium(true);
        return;
      }

      if (Platform.OS === "web") {
        throw new Error("Web purchases not supported yet");
      }

      // Use RevenueCat if available
      if (USE_REVENUECAT && Purchases) {
        try {
          const offerings = await Purchases.getOfferings();
          if (!offerings.current) {
            throw new Error("No subscription offerings available");
          }

          // Get the first available package (usually monthly)
          const packageToPurchase = offerings.current.availablePackages[0];
          if (!packageToPurchase) {
            throw new Error("No subscription packages available");
          }

          // Purchase the package
          const { customerInfo }: { customerInfo: CustomerInfo } =
            await Purchases.purchasePackage(packageToPurchase);

          // Check if purchase was successful
          const hasPremium =
            customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

          if (hasPremium) {
            setIsPremium(true);
            await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, "true");

            // Sync with backend if authenticated
            if (isAuthenticated && user) {
              await syncSubscriptionWithBackend(customerInfo);
            }
          } else {
            throw new Error("Purchase completed but premium not activated");
          }
        } catch (error: any) {
          // Handle user cancellation
          if (error.userCancelled) {
            throw new Error("Purchase was cancelled");
          }
          throw error;
        }
      } else {
        // Fallback to legacy expo-in-app-purchases (if needed)
        throw new Error(
          "Legacy purchase system not available. Please use RevenueCat."
        );
      }
    } catch (error: any) {
      console.error("Error purchasing premium:", error);
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      // Dev mode: Restore from dev storage
      if (ENABLE_DEV_MODE) {
        console.log("🧪 DEV MODE: Restoring premium status");
        await checkPremiumStatus();
        return;
      }

      if (Platform.OS === "web") {
        return;
      }

      // Use RevenueCat if available
      if (USE_REVENUECAT && Purchases) {
        try {
          const customerInfo: CustomerInfo = await Purchases.restorePurchases();
          updatePremiumStatus(customerInfo);

          // Sync with backend if authenticated
          if (isAuthenticated && user) {
            await syncSubscriptionWithBackend(customerInfo);
          }
        } catch (error) {
          console.error("Error restoring purchases:", error);
          throw error;
        }
      } else {
        throw new Error(
          "Restore purchases not available. Please use RevenueCat."
        );
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
      throw error;
    }
  };

  // Dev mode toggle function (for testing)
  const toggleDevMode = async () => {
    if (!ENABLE_DEV_MODE) return;

    const currentDevMode = await AsyncStorage.getItem(DEV_MODE_KEY);
    if (currentDevMode === "true") {
      await AsyncStorage.removeItem(DEV_MODE_KEY);
      setIsPremium(false);
      console.log("🧪 DEV MODE: Premium disabled");
    } else {
      await AsyncStorage.setItem(DEV_MODE_KEY, "true");
      setIsPremium(true);
      console.log("🧪 DEV MODE: Premium enabled");
    }
  };

  const watchAdForPremium = async (unlockType: AdUnlockType): Promise<void> => {
    if (Platform.OS === "web") {
      throw new Error("Rewarded ads are not supported on web.");
    }

    const canWatch = await canWatchAdUtil();
    if (!canWatch) {
      throw new Error("Daily ad limit reached. Try again tomorrow.");
    }

    // This throws if the ad fails to load, times out, or user closes before reward.
    await runRewardedAdFlow();

    // Only reaches here after reward is confirmed earned.
    const unlockData = await createAdUnlock(unlockType);
    const remaining = await getRemainingUnlockTime();

    // Update state immediately — no need to re-run checkPremiumStatus.
    setAdUnlockExpiresAt(new Date(unlockData.expiresAt));
    setAdUnlockType(unlockData.unlockType);
    setRemainingAdUnlockTime(remaining);
    setIsPremium(true);

    // Refresh canWatchAd after consuming one ad slot.
    const canWatchNext = await canWatchAdUtil();
    setCanWatchAd(canWatchNext);
  };

  const getAdUnlockStatus = () => {
    return {
      isActive: adUnlockExpiresAt !== null && remainingAdUnlockTime > 0,
      expiresAt: adUnlockExpiresAt,
      timeRemaining: remainingAdUnlockTime,
    };
  };

  const contextValue: PremiumContextType = {
    isPremium,
    isLoading,
    purchasePremium,
    restorePurchases,
    checkPremiumStatus,
    offerings,
    adUnlockExpiresAt,
    adUnlockType,
    remainingAdUnlockTime,
    canWatchAd,
    watchAdForPremium,
    getAdUnlockStatus,
    ...(ENABLE_DEV_MODE ? { toggleDevMode } : {}),
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};
