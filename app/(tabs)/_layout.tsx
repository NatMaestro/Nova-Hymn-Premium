import { Tabs, Redirect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremium } from "@/contexts/PremiumContext";
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  QueueListIcon,
} from "react-native-heroicons/outline";
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  QueueListIcon as QueueListIconSolid,
} from "react-native-heroicons/solid";

export default function TabLayout() {
  const { theme } = useTheme();
  const { isPremium, isLoading } = usePremium();

  // Redirect free users to the home screen without tabs
  if (!isLoading && !isPremium) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textSecondary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <HomeIconSolid size={24} color={color} />
            ) : (
              <HomeIcon size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="all-hymns"
        options={{
          title: "All Hymns",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <BookOpenIconSolid size={24} color={color} />
            ) : (
              <BookOpenIcon size={24} color={color} />
            ),
        }}
      />
      {isPremium && (
        <Tabs.Screen
          name="sheet-library"
          options={{
            title: "Sheet Library",
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <DocumentTextIconSolid size={24} color={color} />
              ) : (
                <DocumentTextIcon size={24} color={color} />
              ),
          }}
        />
      )}
      {isPremium && (
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <QueueListIconSolid size={24} color={color} />
              ) : (
                <QueueListIcon size={24} color={color} />
              ),
          }}
        />
      )}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <Cog6ToothIconSolid size={24} color={color} />
            ) : (
              <Cog6ToothIcon size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
