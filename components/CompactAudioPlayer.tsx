import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { PlayIcon, PauseIcon } from 'react-native-heroicons/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useAudioManager } from '@/contexts/AudioManagerContext';
import CustomSlider from './CustomSlider';

interface CompactAudioPlayerProps {
  audioUrl: string;
  title: string;
  type?: 'piano' | 'soprano' | 'alto' | 'tenor' | 'bass';
  hymnId?: string;
  onClose?: () => void;
}

export const CompactAudioPlayer: React.FC<CompactAudioPlayerProps> = ({
  audioUrl,
  title,
  type = 'piano',
  hymnId,
  onClose,
}) => {
  const { theme } = useTheme();
  const { registerPlayer, unregisterPlayer, pauseAllExcept, pauseAllMixers, getPlayer, getAllPlayers, currentlyPlaying } = useAudioManager();
  // Try to use the same player ID as AudioPlayer for the same audio
  const mainPlayerId = `${title}-${type}`;
  const compactPlayerId = `compact-${title}-${type}`;
  const playerIdRef = useRef<string>(compactPlayerId);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUsingMainPlayer, setIsUsingMainPlayer] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Check if there's already a player for this audio (from AudioPlayer component)
    const checkForExistingPlayer = async () => {
      const existingPlayer = getPlayer(mainPlayerId);
      if (existingPlayer && mounted) {
        // Use the existing player instead of creating a new one
        setSound(existingPlayer);
        setIsUsingMainPlayer(true);
        
        // Set up status listener for the existing player
        existingPlayer.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && mounted) {
            setPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying);
            if (status.durationMillis) {
              setDuration(status.durationMillis);
            }
          }
        });
        
        // Get initial status
        try {
          const status = await existingPlayer.getStatusAsync();
          if (status.isLoaded && mounted) {
            setPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying);
            setDuration(status.durationMillis || 0);
          }
        } catch (error) {
          console.error('Error getting initial status:', error);
        }
      } else if (mounted) {
        // No existing player yet, wait a bit and check again, or create our own
        setTimeout(() => {
          if (mounted) {
            const player = getPlayer(mainPlayerId);
            if (player) {
              // Found it! Use it
              setSound(player);
              setIsUsingMainPlayer(true);
              player.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && mounted) {
                  setPosition(status.positionMillis || 0);
                  setIsPlaying(status.isPlaying);
                  if (status.durationMillis) {
                    setDuration(status.durationMillis);
                  }
                }
              });
            } else {
              // Still no player, create our own
              loadAudio();
            }
          }
        }, 500);
      }
    };
    
    checkForExistingPlayer();
    
    return () => {
      mounted = false;
      // Only cleanup if we created our own player
      if (sound && !isUsingMainPlayer) {
        unregisterPlayer(playerIdRef.current);
        sound.getStatusAsync()
          .then((status) => {
            if (status.isLoaded) {
              return sound.unloadAsync();
            }
          })
          .catch(() => {});
      }
    };
  }, [audioUrl, mainPlayerId]);

  const loadAudio = async () => {
    if (!audioUrl || (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://'))) {
      return;
    }

    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      setSound(audioSound);
      registerPlayer(playerIdRef.current, audioSound);

      const status = await audioSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }

      audioSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const playPause = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Use the main player ID if we're using the main player, otherwise use compact ID
        const playerIdToUse = isUsingMainPlayer ? mainPlayerId : playerIdRef.current;
        await Promise.all([
          pauseAllExcept(playerIdToUse),
          pauseAllMixers()
        ]);
        await new Promise(resolve => setTimeout(resolve, 50));
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const seek = async (value: number) => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(value);
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show player if we have sound (either existing or our own)
  if (!sound) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={playPause}
          style={[styles.playButton, { backgroundColor: theme.colors.textSecondary }]}
        >
          {isPlaying ? (
            <PauseIcon size={20} color="white" />
          ) : (
            <PlayIcon size={20} color="white" />
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.controls}>
            <CustomSlider
              value={position}
              minimumValue={0}
              maximumValue={duration || 1}
              onSlidingComplete={seek}
              minimumTrackTintColor={theme.colors.textSecondary}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={theme.colors.textSecondary}
              disabled={duration === 0}
              style={styles.slider}
            />
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 4,
  },
  time: {
    fontSize: 11,
    minWidth: 70,
    textAlign: 'right',
  },
});

