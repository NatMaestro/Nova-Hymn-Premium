import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, ArrowPathIcon, PlusIcon } from 'react-native-heroicons/outline';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { useAudioManager } from '@/contexts/AudioManagerContext';
import { useVocalMix } from '@/contexts/VocalMixContext';
import CustomSlider from './CustomSlider';

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  type?: 'piano' | 'soprano' | 'alto' | 'tenor' | 'bass';
  hymnId?: string; // Add hymnId to identify which hymn this belongs to
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  title,
  type = 'piano',
  hymnId
}) => {
  const { requirePremium } = usePremiumFeature('Audio Playback');
  const { registerPlayer, unregisterPlayer, pauseAllExcept, pauseAllMixers, currentlyPlaying } = useAudioManager();
  const { togglePart, getSelectedParts } = useVocalMix();
  const playerIdRef = useRef<string>(`${title}-${type}`);
  
  // Check if this part is selected for mixing (only for vocal parts)
  const isVocalPart = type !== 'piano';
  const selectedParts = hymnId ? getSelectedParts(hymnId) : [];
  const isInMix = isVocalPart && selectedParts.some(p => p.type === type);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        unregisterPlayer(playerIdRef.current);
        // Only unload if sound is actually loaded
        sound.getStatusAsync()
          .then((status) => {
            if (status.isLoaded) {
              return sound.unloadAsync();
            }
          })
          .catch((error) => {
            // Sound might already be unloaded, that's fine
            console.log('Error unloading sound in cleanup:', error);
          });
      }
    };
  }, [sound, unregisterPlayer]);

  const loadAudio = async (shouldPlayAfterLoad = false) => {
    if (!requirePremium(() => {})) {
      return false;
    }

    // Validate URL
    if (!audioUrl || (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://'))) {
      Alert.alert('Error', 'Invalid audio URL');
      return false;
    }

    setIsLoading(true);
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Audio loading timed out after 15 seconds')), 15000);
      });

      // Race between audio loading and timeout
      // Don't auto-play - we'll handle playing after pausing others
      const { sound: audioSound } = await Promise.race([
        Audio.Sound.createAsync(
          { uri: audioUrl },
          { 
            shouldPlay: false, // Always load without playing - we'll play manually after pausing others
            isLooping: isLooping,
          }
        ),
        timeoutPromise
      ]) as { sound: Audio.Sound };
      
      setSound(audioSound);
      
      // Register this player with the audio manager BEFORE setting up status updates
      registerPlayer(playerIdRef.current, audioSound);
      
      const status = await audioSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }

      audioSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish && !isLooping) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
      
      setIsLoading(false);
      
      // If we should play after load, do it now (after registration and pausing others)
      if (shouldPlayAfterLoad) {
        // Pause all other players and mixers first
        await Promise.all([
          pauseAllExcept(playerIdRef.current),
          pauseAllMixers()
        ]);
        
        // Small delay to ensure pause operations complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Now play
        await audioSound.playAsync();
        setIsPlaying(true);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
      
      // Handle specific error codes
      const errorCode = error?.code;
      let errorMessage = 'Failed to load audio';
      
      if (errorCode === -1001) {
        errorMessage = 'Audio loading timed out. Please check your internet connection and try again.';
      } else if (errorCode === -1100) {
        errorMessage = 'Audio file not found. The audio URL may be invalid.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error Loading Audio', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
      return false;
    }
  };

  const playPause = async () => {
    if (!sound) {
      // Load audio and play after loading
      const loaded = await loadAudio(true);
      if (loaded && sound) {
        // Pause all other players and mixers before starting this one
        await Promise.all([
          pauseAllExcept(playerIdRef.current),
          pauseAllMixers()
        ]);
        
        // Small delay to ensure pause operations complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setIsPlaying(true);
      }
      return;
    }

    try {
      // Check if sound is loaded before playing
      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          setIsLoading(true);
          // Reload if not loaded - but only unload if it's actually loaded
          try {
            const currentStatus = await sound.getStatusAsync();
            if (currentStatus.isLoaded) {
              await sound.unloadAsync();
            }
          } catch (unloadError) {
            // Sound might already be unloaded, that's fine
            console.log('Sound already unloaded or error during unload:', unloadError);
          }
          
          // Clear the sound reference before reloading
          setSound(null);
          unregisterPlayer(playerIdRef.current);
          
          const loaded = await loadAudio(true);
          if (loaded && sound) {
            // Pause all other players and mixers before starting this one
            await Promise.all([
              pauseAllExcept(playerIdRef.current),
              pauseAllMixers()
            ]);
            
            // Small delay to ensure pause operations complete
            await new Promise(resolve => setTimeout(resolve, 50));
            
            setIsPlaying(true);
          }
          return;
        }
      } catch (statusError) {
        // Sound might not be accessible, try to reload
        console.warn('Error checking sound status, attempting reload:', statusError);
        setIsLoading(true);
        try {
          setSound(null);
          unregisterPlayer(playerIdRef.current);
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }
        
        const loaded = await loadAudio(true);
        if (loaded && sound) {
          await Promise.all([
            pauseAllExcept(playerIdRef.current),
            pauseAllMixers()
          ]);
          await new Promise(resolve => setTimeout(resolve, 50));
          setIsPlaying(true);
        }
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Pause all other players and mixers BEFORE playing
        // This ensures mutual exclusivity
        await Promise.all([
          pauseAllExcept(playerIdRef.current),
          pauseAllMixers()
        ]);
        
        // Small delay to ensure pause operations complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Now play this sound
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const seek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    if (sound) {
      await sound.setRateAsync(rate, true);
      setPlaybackRate(rate);
    }
  };

  const toggleLoop = async () => {
    const newLooping = !isLooping;
    setIsLooping(newLooping);
    if (sound) {
      await sound.setIsLoopingAsync(newLooping);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-[#FFFEF1] p-4 rounded-lg border border-[#E4E4E4]">
      <Text className="text-lg font-semibold text-[#062958] mb-3">
        {title} - {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
      
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          onPress={playPause}
          className="bg-[#062958] p-3 rounded-full mr-4"
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

        <View className="flex-1">
          <CustomSlider
            value={position}
            minimumValue={0}
            maximumValue={duration || 1}
            onSlidingComplete={seek}
            minimumTrackTintColor="#062958"
            maximumTrackTintColor="#E4E4E4"
            thumbTintColor="#062958"
            disabled={duration === 0}
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-sm text-[#062958]">{formatTime(position)}</Text>
            <Text className="text-sm text-[#062958]">{formatTime(duration)}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-[#062958]">Speed:</Text>
        <View className="flex-row gap-2">
          {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
            <TouchableOpacity
              key={rate}
              onPress={() => changePlaybackRate(rate)}
              className={`px-3 py-1 rounded ${
                playbackRate === rate ? 'bg-[#062958]' : 'bg-[#E4E4E4]'
              }`}
            >
              <Text
                className={`text-sm ${
                  playbackRate === rate ? 'text-white' : 'text-[#062958]'
                }`}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={toggleLoop}
          className={`flex-row items-center px-3 py-2 rounded ${
            isLooping ? 'bg-[#062958]' : 'bg-[#E4E4E4]'
          }`}
        >
          <ArrowPathIcon 
            size={18} 
            color={isLooping ? 'white' : '#062958'} 
            className="mr-2"
          />
          <Text
            className={`text-sm ${
              isLooping ? 'text-white' : 'text-[#062958]'
            }`}
          >
            Loop
          </Text>
        </TouchableOpacity>
        {isVocalPart && hymnId && (
          <TouchableOpacity
            onPress={() => {
              if (requirePremium(() => {})) {
                togglePart(hymnId, {
                  type: type as 'soprano' | 'alto' | 'tenor' | 'bass',
                  url: audioUrl,
                  title: title,
                });
              }
            }}
            className={`flex-row items-center px-3 py-2 rounded ${
              isInMix ? 'bg-[#062958]' : 'bg-[#E4E4E4]'
            }`}
          >
            <PlusIcon 
              size={18} 
              color={isInMix ? 'white' : '#062958'} 
            />
            <Text
              className={`text-sm ml-2 ${
                isInMix ? 'text-white' : 'text-[#062958]'
              }`}
            >
              {isInMix ? 'In Mix' : 'Add to Mix'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


