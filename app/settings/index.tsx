import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { MoonIcon, SunIcon, ArrowLeftIcon } from 'react-native-heroicons/outline';

const SettingsScreen = () => {
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isPremium } = usePremium();

  const handleBack = () => {
    router.back();
  };

  const handleThemeChange = async (mode: 'light' | 'dark' | 'auto') => {
    await setThemeMode(mode);
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background 
      }}
    >
      <StatusBar 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background} 
      />

      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        <TouchableOpacity onPress={handleBack} style={{ marginRight: 16 }}>
          <ArrowLeftIcon size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: theme.colors.text 
        }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Theme Section */}
        <View style={{ padding: 16 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: theme.colors.text,
            marginBottom: 16,
          }}>
            Appearance
          </Text>

          <View style={{ 
            backgroundColor: theme.colors.card, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 16,
            marginBottom: 16,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: theme.colors.text,
                  marginBottom: 4,
                }}>
                  Theme Mode
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors.textSecondary,
                }}>
                  Choose your preferred theme
                </Text>
              </View>
              {theme.isDark ? (
                <MoonIcon size={24} color={theme.colors.textSecondary} />
              ) : (
                <SunIcon size={24} color={theme.colors.textSecondary} />
              )}
            </View>

            {/* Light Mode */}
            <TouchableOpacity
              onPress={() => handleThemeChange('light')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: themeMode === 'light' 
                  ? theme.colors.accent 
                  : 'transparent',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SunIcon 
                  size={20} 
                  color={themeMode === 'light' ? theme.colors.text : theme.colors.textSecondary} 
                />
                <Text style={{ 
                  fontSize: 16, 
                  color: themeMode === 'light' ? theme.colors.text : theme.colors.textSecondary,
                  marginLeft: 12,
                }}>
                  Light
                </Text>
              </View>
              {themeMode === 'light' && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.textSecondary,
                }} />
              )}
            </TouchableOpacity>

            {/* Dark Mode */}
            <TouchableOpacity
              onPress={() => handleThemeChange('dark')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: themeMode === 'dark' 
                  ? theme.colors.accent 
                  : 'transparent',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MoonIcon 
                  size={20} 
                  color={themeMode === 'dark' ? theme.colors.text : theme.colors.textSecondary} 
                />
                <Text style={{ 
                  fontSize: 16, 
                  color: themeMode === 'dark' ? theme.colors.text : theme.colors.textSecondary,
                  marginLeft: 12,
                }}>
                  Dark
                </Text>
              </View>
              {themeMode === 'dark' && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.textSecondary,
                }} />
              )}
            </TouchableOpacity>

            {/* Auto Mode */}
            <TouchableOpacity
              onPress={() => handleThemeChange('auto')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: themeMode === 'auto' 
                  ? theme.colors.accent 
                  : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>🌓</Text>
                <Text style={{ 
                  fontSize: 16, 
                  color: themeMode === 'auto' ? theme.colors.text : theme.colors.textSecondary,
                }}>
                  Auto (System)
                </Text>
              </View>
              {themeMode === 'auto' && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.textSecondary,
                }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Section */}
        <View style={{ padding: 16 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: theme.colors.text,
            marginBottom: 16,
          }}>
            Premium
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/premium')}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: theme.colors.text,
                marginBottom: 4,
              }}>
                {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors.textSecondary,
              }}>
                {isPremium 
                  ? 'Enjoy all premium features' 
                  : 'Unlock all features and support the app'}
              </Text>
            </View>
            <Text style={{ 
              fontSize: 16, 
              color: theme.colors.textSecondary,
            }}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

