import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";
import { ADMOB_CONFIG } from "@/lib/config";

const DEV_TEST_REWARDED_IDS = {
  ios: "ca-app-pub-9675131081126619/5226988781",
  android: "ca-app-pub-9675131081126619/3893725811",
};

const DEFAULT_LOAD_TIMEOUT_MS = 15000;
const DEFAULT_SHOW_TIMEOUT_MS = 45000;

type MobileAdsModule = {
  RewardedAd: {
    createForAdRequest: (adUnitId: string, requestOptions?: Record<string, unknown>) => RewardedAdInstance;
  };
  AdEventType: {
    LOADED: string;
    ERROR: string;
    CLOSED: string;
  };
  RewardedAdEventType: {
    EARNED_REWARD: string;
  };
};

type RewardedAdInstance = {
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (eventType: string, listener: (payload?: any) => void) => () => void;
};

export interface RewardedAdReward {
  type: string;
  amount: number;
}

export interface LoadedRewardedAd {
  ad: RewardedAdInstance;
  adUnitId: string;
  loadedAt: number;
}

export interface RewardedAdFlowResult {
  rewarded: true;
  reward: RewardedAdReward;
  adUnitId: string;
  loadedAt: number;
  shownAt: number;
  completedAt: number;
}

export interface RewardedAdAvailability {
  available: boolean;
  reason?: string;
}

export const getRewardedAdAvailability = (): RewardedAdAvailability => {
  if (Platform.OS === "web") {
    return { available: false, reason: "Rewarded ads are not supported on web." };
  }

  if (Constants.executionEnvironment === "storeClient") {
    return {
      available: false,
      reason:
        "Rewarded ads are unavailable in Expo Go. Use a dev client or release build.",
    };
  }

  if (!NativeModules.RNGoogleMobileAdsModule) {
    return {
      available: false,
      reason:
        "AdMob native module is missing. Rebuild the app after native dependency changes.",
    };
  }

  return { available: true };
};

const getMobileAdsModule = (): MobileAdsModule => {
  try {
    return require("react-native-google-mobile-ads") as MobileAdsModule;
  } catch {
    throw new Error("react-native-google-mobile-ads is not available.");
  }
};

const getRewardedAdUnitId = (): string => {
  if (Platform.OS === "web") {
    throw new Error("Rewarded ads are not supported on web.");
  }

  if (__DEV__) {
    return Platform.OS === "ios"
      ? DEV_TEST_REWARDED_IDS.ios
      : DEV_TEST_REWARDED_IDS.android;
  }

  const unitId = ADMOB_CONFIG.rewardedAdUnitId;
  if (!unitId) {
    throw new Error("Rewarded ad unit ID is missing for release build.");
  }

  return unitId;
};

export const loadRewardedAd = async (
  timeoutMs: number = DEFAULT_LOAD_TIMEOUT_MS
): Promise<LoadedRewardedAd> => {
  const { RewardedAd, AdEventType } = getMobileAdsModule();
  const adUnitId = getRewardedAdUnitId();
  const ad = RewardedAd.createForAdRequest(adUnitId);

  return new Promise<LoadedRewardedAd>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (unsubscribeFns: Array<() => void>) => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    const settle = (
      unsubscribeFns: Array<() => void>,
      callback: () => void
    ) => {
      if (settled) return;
      settled = true;
      cleanup(unsubscribeFns);
      callback();
    };

    const unsubscribeFns: Array<() => void> = [];

    unsubscribeFns.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        settle(unsubscribeFns, () => {
          resolve({ ad, adUnitId, loadedAt: Date.now() });
        });
      })
    );

    unsubscribeFns.push(
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        settle(unsubscribeFns, () => {
          reject(new Error(`Rewarded ad failed to load: ${JSON.stringify(error)}`));
        });
      })
    );

    timeout = setTimeout(() => {
      settle(unsubscribeFns, () => {
        reject(new Error("Rewarded ad load timed out."));
      });
    }, timeoutMs);

    ad.load();
  });
};

export const showRewardedAd = async (
  ad: RewardedAdInstance,
  timeoutMs: number = DEFAULT_SHOW_TIMEOUT_MS
): Promise<RewardedAdReward> => {
  const { AdEventType, RewardedAdEventType } = getMobileAdsModule();

  return new Promise<RewardedAdReward>((resolve, reject) => {
    let settled = false;
    let reward: RewardedAdReward | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (unsubscribeFns: Array<() => void>) => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    const settle = (
      unsubscribeFns: Array<() => void>,
      callback: () => void
    ) => {
      if (settled) return;
      settled = true;
      cleanup(unsubscribeFns);
      callback();
    };

    const unsubscribeFns: Array<() => void> = [];

    unsubscribeFns.push(
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (earnedReward) => {
        reward = {
          type: earnedReward?.type || "reward",
          amount: typeof earnedReward?.amount === "number" ? earnedReward.amount : 1,
        };
      })
    );

    unsubscribeFns.push(
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        settle(unsubscribeFns, () => {
          reject(new Error(`Rewarded ad failed while showing: ${JSON.stringify(error)}`));
        });
      })
    );

    unsubscribeFns.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        settle(unsubscribeFns, () => {
          if (!reward) {
            reject(new Error("Rewarded ad closed before reward was earned."));
            return;
          }

          resolve(reward);
        });
      })
    );

    timeout = setTimeout(() => {
      settle(unsubscribeFns, () => {
        reject(new Error("Rewarded ad show timed out."));
      });
    }, timeoutMs);

    ad.show().catch((error) => {
      settle(unsubscribeFns, () => {
        reject(new Error(`Unable to show rewarded ad: ${String(error)}`));
      });
    });
  });
};

export const runRewardedAdFlow = async (): Promise<RewardedAdFlowResult> => {
  const availability = getRewardedAdAvailability();
  if (!availability.available) {
    throw new Error(availability.reason || "Rewarded ads are unavailable in this build.");
  }

  const { ad, adUnitId, loadedAt } = await loadRewardedAd();
  const shownAt = Date.now();
  const reward = await showRewardedAd(ad);

  return {
    rewarded: true,
    reward,
    adUnitId,
    loadedAt,
    shownAt,
    completedAt: Date.now(),
  };
};
