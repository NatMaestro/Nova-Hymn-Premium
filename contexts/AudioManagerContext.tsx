import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { Audio } from "expo-av";

interface AudioManagerContextType {
  currentlyPlaying: string | null;
  registerPlayer: (id: string, sound: Audio.Sound) => void;
  unregisterPlayer: (id: string) => void;
  pauseAllExcept: (id: string) => Promise<void>;
  pauseAll: () => Promise<void>;
  registerMixer: (id: string, pauseCallback: () => Promise<void>) => void;
  unregisterMixer: (id: string) => void;
  pauseAllMixers: () => Promise<void>;
  getPlayer: (id: string) => Audio.Sound | undefined;
  getAllPlayers: () => Map<string, Audio.Sound>;
}

const AudioManagerContext = createContext<AudioManagerContextType | undefined>(
  undefined
);

export const AudioManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const playersRef = useRef<Map<string, Audio.Sound>>(new Map());
  const mixersRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const registerPlayer = useCallback((id: string, sound: Audio.Sound) => {
    playersRef.current.set(id, sound);
  }, []);

  const unregisterPlayer = useCallback(
    (id: string) => {
      playersRef.current.delete(id);
      if (currentlyPlaying === id) {
        setCurrentlyPlaying(null);
      }
    },
    [currentlyPlaying]
  );

  const pauseAllExcept = useCallback(async (id: string) => {
    const promises: Promise<void>[] = [];

    playersRef.current.forEach((sound, playerId) => {
      if (playerId !== id) {
        promises.push(
          sound
            .getStatusAsync()
            .then(async (status) => {
              if (status.isLoaded) {
                // Try to pause regardless of isPlaying status
                // Sometimes the status might not be updated yet
                try {
                  if (status.isPlaying) {
                    await sound.pauseAsync();
                  }
                } catch (error) {
                  // If pause fails, try to get status again and pause if playing
                  try {
                    const currentStatus = await sound.getStatusAsync();
                    if (currentStatus.isLoaded && currentStatus.isPlaying) {
                      await sound.pauseAsync();
                    }
                  } catch (retryError) {
                    console.error(
                      `Error pausing player ${playerId}:`,
                      retryError
                    );
                  }
                }
              }
            })
            .catch((error) => {
              console.error(
                `Error getting status for player ${playerId}:`,
                error
              );
            })
        );
      }
    });

    await Promise.all(promises);
    setCurrentlyPlaying(id);
  }, []);

  const pauseAll = useCallback(async () => {
    const promises: Promise<void>[] = [];

    playersRef.current.forEach((sound, playerId) => {
      promises.push(
        sound
          .getStatusAsync()
          .then(async (status) => {
            if (status.isLoaded && status.isPlaying) {
              try {
                await sound.pauseAsync();
              } catch (error) {
                console.error(`Error pausing player ${playerId}:`, error);
              }
            }
          })
          .catch((error) => {
            console.error(
              `Error getting status for player ${playerId}:`,
              error
            );
          })
      );
    });

    // Also pause all mixers
    mixersRef.current.forEach((pauseCallback) => {
      promises.push(
        pauseCallback().catch((error) => {
          console.error("Error pausing mixer:", error);
        })
      );
    });

    await Promise.all(promises);
    setCurrentlyPlaying(null);
  }, []);

  const registerMixer = useCallback(
    (id: string, pauseCallback: () => Promise<void>) => {
      mixersRef.current.set(id, pauseCallback);
    },
    []
  );

  const unregisterMixer = useCallback((id: string) => {
    mixersRef.current.delete(id);
  }, []);

  const pauseAllMixers = useCallback(async () => {
    const promises: Promise<void>[] = [];
    mixersRef.current.forEach((pauseCallback) => {
      promises.push(
        pauseCallback().catch((error) => {
          console.error("Error pausing mixer:", error);
        })
      );
    });
    await Promise.all(promises);
  }, []);

  const getPlayer = useCallback((id: string): Audio.Sound | undefined => {
    return playersRef.current.get(id);
  }, []);

  const getAllPlayers = useCallback((): Map<string, Audio.Sound> => {
    return playersRef.current;
  }, []);

  return (
    <AudioManagerContext.Provider
      value={{
        currentlyPlaying,
        registerPlayer,
        unregisterPlayer,
        pauseAllExcept,
        pauseAll,
        registerMixer,
        unregisterMixer,
        pauseAllMixers,
        getPlayer,
        getAllPlayers,
      }}
    >
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = () => {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error("useAudioManager must be used within AudioManagerProvider");
  }
  return context;
};
