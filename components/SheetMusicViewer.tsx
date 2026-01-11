import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet, SafeAreaView, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';
import { useTheme } from '@/contexts/ThemeContext';

interface SheetMusicViewerProps {
  sheetMusicUrl: string;
  hymnTitle: string;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  sheetMusicUrl,
  hymnTitle,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [hasError, setHasError] = useState(false);
  const { width } = Dimensions.get('window');

  console.log('SheetMusicViewer rendering:', { sheetMusicUrl, hymnTitle });

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeftIcon size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {hymnTitle}
        </Text>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            onPress={handleZoomOut}
            style={[styles.zoomButton, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={[styles.zoomButtonText, { color: theme.colors.text }]}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleResetZoom}
            style={[styles.zoomButton, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={[styles.zoomButtonText, { color: theme.colors.text }]}>
              {Math.round(zoom * 100)}%
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleZoomIn}
            style={[styles.zoomButton, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={[styles.zoomButtonText, { color: theme.colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading sheet music...</Text>
        </View>
      )}

      {hasError ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            PDF Preview Not Available
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            The PDF cannot be displayed.{'\n\n'}
            This may be because:{'\n'}
            • The PDF URL is not accessible (404 error){'\n'}
            • The file format is not supported{'\n'}
            • Network connection issues{'\n\n'}
            When the backend is ready with real PDF URLs, they will display here automatically.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(sheetMusicUrl).catch((err: any) => {
                console.error('Failed to open URL:', err);
              });
            }}
            style={[styles.downloadButton, { backgroundColor: theme.colors.text }]}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Try Opening in Browser
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ 
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
                  <style>
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    html, body {
                      width: 100%;
                      height: 100%;
                      overflow: auto;
                      background-color: ${theme.colors.background};
                    }
                    .container {
                      width: 100%;
                      height: 100%;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                    }
                    iframe {
                      width: 100%;
                      height: 100vh;
                      border: none;
                      background: white;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <iframe 
                      src="https://docs.google.com/viewer?url=${encodeURIComponent(sheetMusicUrl)}&embedded=true" 
                      frameborder="0"
                    ></iframe>
                  </div>
                </body>
              </html>
            `
          }}
          style={styles.webview}
          onLoadEnd={() => {
            console.log('WebView loaded successfully');
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setLoading(false);
            // Try direct PDF as fallback
            if (!hasError) {
              setHasError(true);
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
            setLoading(false);
            // Show error for 404, 403, 500, etc.
            if (nativeEvent.statusCode >= 400) {
              setHasError(true);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  zoomButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  webview: {
    flex: 1,
    minHeight: 500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  downloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
