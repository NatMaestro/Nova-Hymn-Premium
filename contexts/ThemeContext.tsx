import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from './PremiumContext';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  navy: string;
  card: string;
  cardBorder: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@theme_mode';

const lightColors: ThemeColors = {
  background: '#FCF7E7',
  backgroundSecondary: '#FFFEF1',
  text: '#062958',
  textSecondary: '#0B489A',
  border: '#E4E4E4',
  accent: '#F6F1DA',
  navy: '#071c49',
  card: '#FFFEF1',
  cardBorder: '#E4E4E4',
};

const darkColors: ThemeColors = {
  background: '#1e1b18',
  backgroundSecondary: '#2a2520',
  text: '#e8e4df',
  textSecondary: '#d4af37',
  border: '#3d3833',
  accent: '#3a352f',
  navy: '#1a2332',
  card: '#2a2520',
  cardBorder: '#3d3833',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { isPremium } = usePremium();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme preference from storage (only for premium users)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (isPremium) {
          const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
          if (stored && (stored === 'light' || stored === 'dark' || stored === 'auto')) {
            setThemeModeState(stored as ThemeMode);
          }
        } else {
          // Free users always use light mode
          setThemeModeState('light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadTheme();
  }, [isPremium]);

  // Determine if dark mode should be active (only for premium users)
  const effectiveMode = isPremium ? themeMode : 'light';
  const isDark = isPremium && (effectiveMode === 'dark' || (effectiveMode === 'auto' && systemColorScheme === 'dark'));

  // Get current theme colors
  const colors = isDark ? darkColors : lightColors;

  const theme: Theme = {
    mode: effectiveMode,
    colors,
    isDark,
  };

  const setThemeMode = async (mode: ThemeMode) => {
    if (!isPremium) {
      // Free users can't change theme
      return;
    }
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = async () => {
    if (!isPremium) {
      // Free users can't toggle theme
      return;
    }
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  // Don't render until theme is loaded to avoid flash
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode: effectiveMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
