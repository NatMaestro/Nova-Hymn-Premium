import { Stack } from "expo-router";
import "./global.css";
import { Provider } from "react-redux";
import { store } from "@/store";
import { PremiumProvider, usePremium } from "@/contexts/PremiumContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AudioManagerProvider } from "@/contexts/AudioManagerContext";
import { VocalMixProvider } from "@/contexts/VocalMixContext";
import { DenominationProvider } from "@/contexts/DenominationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";

function RootLayoutNav() {
  const { isPremium } = usePremium();

  return (
    <Stack>
      {isPremium ? (
        // Premium users get tabs
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      ) : (
        // Free users get the original home screen without tabs
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen
        name="all-hymns/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="premium/index"
        options={{ 
          headerShown: true,
          title: "Upgrade to Premium",
          presentation: "modal"
        }}
      />
      <Stack.Screen
        name="sheet-music/[id]"
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen
        name="playlists/[id]"
        options={{ 
          headerShown: false
        }}
      />
      {/* Free users can still access all-hymns list */}
      <Stack.Screen
        name="all-hymns/index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;

    const initializeMobileAds = async () => {
      if (Platform.OS === "web") return;

      // In Expo Go, native AdMob modules are not linked.
      if (Constants.executionEnvironment === "storeClient") {
        if (__DEV__) {
          console.warn("[AdMob] Skipping initialization in Expo Go (storeClient)");
        }
        return;
      }

      if (!NativeModules.RNGoogleMobileAdsModule) {
        console.warn(
          "[AdMob] Native module RNGoogleMobileAdsModule not found. Rebuild and run a dev client/standalone build."
        );
        return;
      }

      try {
        const adsModule = require("react-native-google-mobile-ads");
        const mobileAds = adsModule.default;
        const MaxAdContentRating = adsModule.MaxAdContentRating;

        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
          testDeviceIdentifiers: __DEV__ ? ["EMULATOR"] : [],
        });

        if (isMounted) {
          await mobileAds().initialize();
        }

        if (__DEV__) {
          console.log("[AdMob] Mobile Ads initialized");
        }
      } catch (error) {
        console.warn("[AdMob] Failed to initialize mobile ads:", error);
      }
    };

    initializeMobileAds();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <PremiumProvider>
          <ThemeProvider>
            <DenominationProvider>
              <AudioManagerProvider>
                <VocalMixProvider>
                  <RootLayoutNav />
                </VocalMixProvider>
              </AudioManagerProvider>
            </DenominationProvider>
          </ThemeProvider>
        </PremiumProvider>
      </AuthProvider>
    </Provider>
  );
}


