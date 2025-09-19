import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Download } from 'lucide-react';
import { useSpeechSynthesis } from 'react-speech-kit';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAudioManager } from '../hooks/useAudioManager';

interface AudioPlayerProps {
  audioScript: string;
  audioUrl?: string;
  stopName?: string;
  onGenerateAudio?: (audioScript: string) => Promise<string | null>;
  autoPlay?: boolean;
  playerId?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioScript, 
  audioUrl, 
  stopName, 
  onGenerateAudio, 
  autoPlay = false,
  playerId = 'default'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { registerAudioPlayer, unregisterAudioPlayer } = useAudioManager();
  
  const { speak, cancel, speaking, supported } = useSpeechSynthesis();

  // Use audio file if available, otherwise use text-to-speech
  const effectiveAudioUrl = audioUrl || generatedAudioUrl;
  const useTextToSpeech = !effectiveAudioUrl;

  // Stop function to be called from parent
  const stopAudio = () => {
    if (useTextToSpeech) {
      cancel();
      setIsPlaying(false);
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setProgress(0);
    setCurrentTime(0);
  };

  // Register audio player with manager
  useEffect(() => {
    registerAudioPlayer(playerId, stopAudio);
    return () => {
      unregisterAudioPlayer(playerId);
    };
  }, [playerId, registerAudioPlayer, unregisterAudioPlayer]);

  // Auto-play when component mounts or audio changes
  useEffect(() => {
    if (autoPlay && audioScript) {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        togglePlayPause();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioScript]);

  // Stop audio when component unmounts or audio changes
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [audioScript]);
  
  const generateAudioFile = async () => {
    if (!onGenerateAudio || isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    try {
      const generatedUrl = await onGenerateAudio(audioScript);
      if (generatedUrl) {
        setGeneratedAudioUrl(generatedUrl);
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    if (useTextToSpeech) {
      setDuration(audioScript.length / 10); // Rough estimate based on text length
    }
  }, [audioScript, useTextToSpeech]);

  useEffect(() => {
    if (audioRef.current && !useTextToSpeech) {
      const audio = audioRef.current;
      audio.src = effectiveAudioUrl || '';
      
      const updateProgress = () => {
        const current = audio.currentTime;
        const total = audio.duration;
        setCurrentTime(current);
        setProgress((current / total) * 100);
      };

      const onLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [useTextToSpeech]);

  const togglePlayPause = () => {
    if (useTextToSpeech) {
      if (speaking) {
        cancel();
        setIsPlaying(false);
      } else {
        speak({ 
          text: audioScript,
          voice: window.speechSynthesis.getVoices().find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Google')
          ) || window.speechSynthesis.getVoices()[0],
          rate: 0.9,
          pitch: 1
        });
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current && !useTextToSpeech) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const restart = () => {
    if (useTextToSpeech) {
      cancel();
      setIsPlaying(false);
      setProgress(0);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update progress for text-to-speech (approximate)
  useEffect(() => {
    if (useTextToSpeech && speaking) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 1, 100);
          setCurrentTime((newProgress / 100) * duration);
          return newProgress;
        });
      }, duration * 10);

      return () => clearInterval(interval);
    }
  }, [speaking, useTextToSpeech, duration]);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Volume2 className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Audio Guide</h3>
        {useTextToSpeech && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Text-to-Speech
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{stopName}</p>

      {/* Audio Element (for actual audio files) */}
      {!useTextToSpeech && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            className="bg-orange-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              disabled={(useTextToSpeech && !supported) || isGeneratingAudio}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2 rounded-full transition-colors"
            >
              {isPlaying || speaking ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button
              onClick={restart}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            {!useTextToSpeech && (
              <button
                onClick={toggleMute}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          
          {/* Generate High-Quality Audio Button */}
          {useTextToSpeech && onGenerateAudio && (
            <button
              onClick={generateAudioFile}
              disabled={isGeneratingAudio}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {isGeneratingAudio ? (
                <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              {isGeneratingAudio ? 'Generating...' : 'HQ Audio'}
            </button>
          )}
        </div>
      </div>

      {/* Audio Script Preview */}
      <div className="mt-4 p-3 bg-white rounded border">
        <p className="text-sm text-gray-700 leading-relaxed">
          {audioScript.slice(0, 150)}...
        </p>
      </div>
    </div>
  );
};

export default AudioPlayer;