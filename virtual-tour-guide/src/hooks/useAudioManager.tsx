import { useRef, useCallback } from 'react';

interface AudioManager {
  registerAudioPlayer: (id: string, stopFunction: () => void) => void;
  unregisterAudioPlayer: (id: string) => void;
  stopAllAudio: () => void;
  stopAudioById: (id: string) => void;
}

export const useAudioManager = (): AudioManager => {
  const audioPlayersRef = useRef<Map<string, () => void>>(new Map());

  const registerAudioPlayer = useCallback((id: string, stopFunction: () => void) => {
    audioPlayersRef.current.set(id, stopFunction);
  }, []);

  const unregisterAudioPlayer = useCallback((id: string) => {
    audioPlayersRef.current.delete(id);
  }, []);

  const stopAllAudio = useCallback(() => {
    audioPlayersRef.current.forEach((stopFunction) => {
      try {
        stopFunction();
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
    });
  }, []);

  const stopAudioById = useCallback((id: string) => {
    const stopFunction = audioPlayersRef.current.get(id);
    if (stopFunction) {
      try {
        stopFunction();
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
    }
  }, []);

  return {
    registerAudioPlayer,
    unregisterAudioPlayer,
    stopAllAudio,
    stopAudioById
  };
};
