import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from 'react-native-heroicons/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { useAudioManager } from '@/contexts/AudioManagerContext';
import { useVocalMix } from '@/contexts/VocalMixContext';
import { PremiumGate } from '@/components/PremiumGate';
import CustomSlider from './CustomSlider';

interface VocalMixerProps {
  audioUrls: {
    soprano?: string;
    alto?: string;
    tenor?: string;
    bass?: string;
  };
  hymnTitle: string;
  hymnId: string; // Add hymnId to get selected parts
}

interface PartState {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  isEnabled: boolean;
}

export const VocalMixer: React.FC<VocalMixerProps> = ({ audioUrls, hymnTitle, hymnId }) => {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const { pauseAllExcept, registerMixer, unregisterMixer } = useAudioManager();
  const { getSelectedParts, togglePart } = useVocalMix();
  const mixerIdRef = useRef<string>(`vocal-mixer-${hymnTitle}`);
  const [parts, setParts] = useState<Record<string, PartState>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterPosition, setMasterPosition] = useState(0);
  const [masterDuration, setMasterDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get selected parts from context
  const selectedParts = getSelectedParts(hymnId);
  
  // Only show parts that are selected for mixing
  const availableParts = selectedParts
    .filter((part) => part.url && part.type) // Only include parts with valid URL and type
    .map((part) => ({
      key: part.type,
      label: part.type.charAt(0).toUpperCase() + part.type.slice(1),
      url: part.url,
    }));

  useEffect(() => {
    initializeParts();
    return () => {
      cleanup();
    };
  }, [selectedParts.length]); // Re-initialize when selected parts change

  // Register mixer pause callback
  useEffect(() => {
    const pauseMixer = async () => {
      if (isPlaying) {
        const validParts = Object.values(parts).filter(p => p.isEnabled && p.sound);
        await Promise.all(
          validParts.map(async (part) => {
            if (part.sound) {
              try {
                const status = await part.sound.getStatusAsync();
                if (status.isLoaded) {
                  await part.sound.pauseAsync();
                }
              } catch (error) {
                console.error('Error pausing part:', error);
              }
            }
          })
        );
        setIsPlaying(false);
      }
    };

    registerMixer(mixerIdRef.current, pauseMixer);

    return () => {
      unregisterMixer(mixerIdRef.current);
      cleanup();
    };
  }, [parts, isPlaying, registerMixer, unregisterMixer]);

  useEffect(() => {
    if (isPlaying) {
      startPositionTracking();
    } else {
      stopPositionTracking();
    }
    return () => stopPositionTracking();
  }, [isPlaying]);

  const initializeParts = async () => {
    // Only initialize parts that are selected for mixing
    if (availableParts.length === 0) {
      setParts({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const initialParts: Record<string, PartState> = {};
    
    for (const part of availableParts) {
      if (part.url) {
        try {
          // Validate URL before attempting to load
          if (!part.url.startsWith('http://') && !part.url.startsWith('https://')) {
            console.warn(`Invalid audio URL for ${part.key}: ${part.url}`);
            initialParts[part.key] = {
              sound: null,
              isPlaying: false,
              position: 0,
              duration: 0,
              volume: 0.8,
              isEnabled: false,
            };
            continue;
          }

          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audio loading timed out after 15 seconds')), 15000);
          });

          // Race between audio loading and timeout
          const { sound } = await Promise.race([
            Audio.Sound.createAsync(
              { uri: part.url },
              { shouldPlay: false, volume: 0.8 }
            ),
            timeoutPromise
          ]) as { sound: Audio.Sound };
          
          // Wait a bit and check status to ensure sound is loaded
          await new Promise(resolve => setTimeout(resolve, 100));
          const status = await sound.getStatusAsync();
          
          if (!status.isLoaded) {
            console.warn(`Sound for ${part.key} did not load properly`);
            await sound.unloadAsync();
            initialParts[part.key] = {
              sound: null,
              isPlaying: false,
              position: 0,
              duration: 0,
              volume: 0.8,
              isEnabled: true, // Keep enabled even if sound failed to load (user can see it's unavailable)
            };
            continue;
          }

          initialParts[part.key] = {
            sound,
            isPlaying: false,
            position: 0,
            duration: status.durationMillis || 0,
            volume: 0.8,
            isEnabled: true, // All selected parts are enabled by default
          };

          // Set up status update listener
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setParts(prev => {
                const currentPart = prev[part.key];
                if (!currentPart) return prev;
                return {
                  ...prev,
                  [part.key]: {
                    ...currentPart,
                    position: status.positionMillis || 0,
                    isPlaying: status.isPlaying || false,
                  },
                };
              });
            }
          });
        } catch (error) {
          console.error(`Error loading ${part.key}:`, error);
          // Initialize part with null sound to show it's unavailable
          initialParts[part.key] = {
            sound: null,
            isPlaying: false,
            position: 0,
            duration: 0,
            volume: 0.8,
            isEnabled: false,
          };
        }
      }
    }

    // Set master duration from first loaded part
    const loadedParts = Object.values(initialParts).filter(p => p.sound && p.duration > 0);
    if (loadedParts.length > 0) {
      setMasterDuration(loadedParts[0].duration);
    }

    setParts(initialParts);
  };

  const cleanup = async () => {
    stopPositionTracking();
    const partsToClean = Object.values(parts);
    for (const part of partsToClean) {
      if (part?.sound) {
        try {
          await part.sound.unloadAsync();
        } catch (error) {
          console.error('Error unloading sound:', error);
        }
      }
    }
  };

  const startPositionTracking = () => {
    positionIntervalRef.current = setInterval(() => {
      const enabledParts = Object.values(parts).filter(p => p.isEnabled && p.sound);
      if (enabledParts.length > 0) {
        // Use the position from the first enabled part
        const firstPart = enabledParts[0];
        setMasterPosition(firstPart.position);
      }
    }, 100);
  };

  const stopPositionTracking = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  };

  const playPause = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Mixing vocal parts is a premium feature.');
      return;
    }

    setIsLoading(true);
    try {
      // Filter parts that are enabled and have loaded sounds
      const enabledParts = Object.values(parts).filter(p => p.isEnabled && p.sound);
      
      // Verify all sounds are actually loaded before playing
      const validParts = await Promise.all(
        enabledParts.map(async (part) => {
          if (!part.sound) return null;
          try {
            const status = await part.sound.getStatusAsync();
            if (status.isLoaded) {
              return part;
            } else {
              console.warn(`Part ${part.key} sound is not loaded, status:`, status);
              return null;
            }
          } catch (error) {
            console.error('Error checking sound status:', error);
            return null;
          }
        })
      );
      
      const filteredParts = validParts.filter((p): p is PartState => p !== null);
      
      if (filteredParts.length === 0) {
        Alert.alert('No Parts Available', 'Please enable at least one vocal part with loaded audio.');
        setIsLoading(false);
        return;
      }

      if (isPlaying) {
        // Pause all enabled parts
        await Promise.all(
          filteredParts.map(async (part) => {
            if (part.sound) {
              try {
                const status = await part.sound.getStatusAsync();
                if (status.isLoaded) {
                  await part.sound.pauseAsync();
                }
              } catch (error) {
                console.error('Error pausing part:', error);
              }
            }
          })
        );
        setIsPlaying(false);
        setIsLoading(false);
      } else {
        // Pause all other audio players before starting mixer
        // This will pause any individual AudioPlayer components that are playing
        try {
          // Note: pauseAllExcept won't pause other mixers, only AudioPlayers
          // But since we're the only mixer playing at a time, this is fine
          await pauseAllExcept(mixerIdRef.current);
          
          // Small delay to ensure pause operations complete
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error('Error pausing other players:', error);
        }
        
        // Play all enabled parts from current position
        await Promise.all(
          filteredParts.map(async (part) => {
            if (part.sound) {
              try {
                const status = await part.sound.getStatusAsync();
                if (status.isLoaded) {
                  await part.sound.setPositionAsync(masterPosition);
                  // Double-check sound is still loaded before playing
                  const playStatus = await part.sound.getStatusAsync();
                  if (playStatus.isLoaded) {
                    await part.sound.playAsync();
                  } else {
                    console.warn(`Sound for part ${part.key} is not loaded, skipping playback`);
                  }
                } else {
                  console.warn(`Sound for part is not loaded, status:`, status);
                }
              } catch (error) {
                console.error('Error playing part:', error);
                // Try to reload the sound if it failed
                try {
                  const status = await part.sound.getStatusAsync();
                  if (!status.isLoaded) {
                    console.log(`Attempting to reload sound for part ${part.key}`);
                    // Sound might have been unloaded, we need to reload it
                    // But we don't have the URL here, so we'll just skip this part
                  }
                } catch (reloadError) {
                  console.error('Error checking sound status after play failure:', reloadError);
                }
              }
            }
          })
        );
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing/pausing:', error);
      Alert.alert('Error', 'Failed to control playback');
      setIsLoading(false);
    }
  };

  const seek = async (value: number) => {
    try {
      const enabledParts = Object.values(parts).filter(p => p.isEnabled && p.sound);
      await Promise.all(
        enabledParts.map(async (part) => {
          if (part.sound) {
            try {
              const status = await part.sound.getStatusAsync();
              if (status.isLoaded) {
                await part.sound.setPositionAsync(value);
              }
            } catch (error) {
              console.error('Error seeking part:', error);
            }
          }
        })
      );
      setMasterPosition(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };


  const setPartVolume = async (key: string, volume: number) => {
    const part = parts[key];
    if (!part || !part.sound) return;

    try {
      const status = await part.sound.getStatusAsync();
      if (status.isLoaded) {
        await part.sound.setVolumeAsync(volume);
        setParts(prev => ({
          ...prev,
          [key]: { ...prev[key], volume },
        }));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (availableParts.length === 0) {
    return null;
  }

  return (
    <PremiumGate featureName="Vocal Mix">
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Mix Vocal Parts
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Play multiple vocal parts simultaneously
        </Text>

        {/* Master Controls */}
        <View style={styles.masterControls}>
          <View style={styles.playbackControls}>
            <TouchableOpacity
              onPress={playPause}
              style={[styles.playButton, { backgroundColor: theme.colors.text }]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : isPlaying ? (
                <PauseIcon size={24} color="white" />
              ) : (
                <PlayIcon size={24} color="white" />
              )}
            </TouchableOpacity>

            <View style={styles.sliderContainer}>
              <CustomSlider
                value={masterPosition}
                minimumValue={0}
                maximumValue={masterDuration || 1}
                onSlidingComplete={seek}
                minimumTrackTintColor={theme.colors.textSecondary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.textSecondary}
                disabled={masterDuration === 0}
              />
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                  {formatTime(masterPosition)}
                </Text>
                <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                  {formatTime(masterDuration)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Individual Part Controls */}
        <View style={styles.partsContainer}>
          <Text
            style={[
              styles.instructionText,
              { color: theme.colors.textSecondary, marginBottom: 12 },
            ]}
          >
            Mixing {availableParts.length} part{availableParts.length !== 1 ? 's' : ''}:
          </Text>
          {availableParts.map((part) => {
            const partState = parts[part.key];
            if (!partState) return null;
            
            // Show unavailable indicator if sound failed to load
            if (!partState.sound) {
              return (
                <View
                  key={part.key}
                  style={[
                    styles.partCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      opacity: 0.5,
                    },
                  ]}
                >
                  <Text style={[styles.partLabel, { color: theme.colors.textSecondary }]}>
                    {part.label} - Audio unavailable
                  </Text>
                </View>
              );
            }

            return (
              <View
                key={part.key}
                style={[
                  styles.partCard,
                  {
                    backgroundColor: partState.isEnabled
                      ? theme.colors.accent
                      : theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.partHeader}>
                  <View style={styles.partToggle}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: theme.colors.textSecondary,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text
                      style={[
                        styles.partLabel,
                        {
                          color: theme.colors.text,
                        },
                      ]}
                    >
                      {part.label}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (part.url) {
                          togglePart(hymnId, {
                            type: part.key as 'soprano' | 'alto' | 'tenor' | 'bass',
                            url: part.url,
                            title: `${hymnTitle} - ${part.label}`,
                          });
                        }
                      }}
                      style={styles.removeButton}
                    >
                      <Text style={[styles.removeButtonText, { color: theme.colors.textSecondary }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.volumeControl}>
                    <SpeakerWaveIcon
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <CustomSlider
                      value={partState.volume}
                      minimumValue={0}
                      maximumValue={1}
                      onSlidingComplete={(value) => setPartVolume(part.key, value)}
                      minimumTrackTintColor={theme.colors.textSecondary}
                      maximumTrackTintColor={theme.colors.border}
                      thumbTintColor={theme.colors.textSecondary}
                      style={styles.volumeSlider}
                    />
                    <Text
                      style={[styles.volumeText, { color: theme.colors.textSecondary }]}
                    >
                      {Math.round(partState.volume * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </PremiumGate>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  masterControls: {
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
  },
  partsContainer: {
    gap: 12,
  },
  partCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  partHeader: {
    marginBottom: 8,
  },
  partToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeSlider: {
    flex: 1,
  },
  volumeText: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
});

