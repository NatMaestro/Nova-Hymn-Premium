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


