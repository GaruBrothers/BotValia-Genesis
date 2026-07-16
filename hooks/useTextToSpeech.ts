'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeakOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  
  // Settings
  const [rate, setRate] = useState<number>(1.0); // 0.5 to 2
  const [pitch, setPitch] = useState<number>(1.0); // 0.5 to 2
  const [volume, setVolume] = useState<number>(1.0); // 0 to 1
  const [autoplay, setAutoplay] = useState<boolean>(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize and check support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (!synthRef.current) return;
        const availableVoices = synthRef.current.getVoices();
        setVoices(availableVoices);
        
        // Prefer Spanish voices (es-ES, es-MX, etc.) since the app context is Spanish
        const spanishVoice = availableVoices.find(v => v.lang.startsWith('es')) || 
                             availableVoices.find(v => v.lang.startsWith('en')) || 
                             availableVoices[0];
        
        setSelectedVoice(prev => prev || spanishVoice || null);
      };

      updateVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  // Utility to strip markdown characters so TTS sounds perfectly clean
  const cleanMarkdownForTTS = useCallback((text: string): string => {
    return text
      // Remove Bold/Italic stars and underscores
      .replace(/[\*_]{1,3}([^*_]+)[\*_]{1,3}/g, '$1')
      // Remove Code blocks and inline code
      .replace(/```[\s\S]*?```/g, ' [código omitido] ')
      .replace(/`([^`]+)`/g, '$1')
      // Remove Markdown links [text](url) -> keep text only
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove Headers markdown
      .replace(/#+\s+(.+)/g, '$1. ')
      // Remove bullet lists dashes/numbers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove raw HTML tags
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Clean duplicate spacing
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const stop = useCallback(() => {
    if (!isSupported || !synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveMessageId(null);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !synthRef.current) return;
    synthRef.current.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported || !synthRef.current) return;
    synthRef.current.resume();
    setIsPaused(false);
  }, [isSupported]);

  const speak = useCallback((text: string, messageId: string, options: SpeakOptions = {}) => {
    if (!isSupported || !synthRef.current) return;

    // Stop any active utterance first
    stop();

    const cleanText = cleanMarkdownForTTS(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    setActiveMessageId(messageId);

    // Apply voice and parameters
    const voiceToUse = options.voice || selectedVoice;
    if (voiceToUse) utterance.voice = voiceToUse;
    
    utterance.rate = options.rate ?? rate;
    utterance.pitch = options.pitch ?? pitch;
    utterance.volume = options.volume ?? volume;
    utterance.lang = options.lang ?? (voiceToUse ? voiceToUse.lang : 'es-ES');

    // Setup event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveMessageId(null);
    };

    utterance.onerror = (event) => {
      // Filter out benign lifecycle status changes like 'interrupted' or 'canceled'
      // which occur normally when we stop/reset speech playback.
      const errorCode = event.error as string;
      if (errorCode !== 'interrupted' && errorCode !== 'canceled' && errorCode !== 'interposed') {
        console.warn('SpeechSynthesisUtterance info:', event.error || event);
      }
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveMessageId(null);
    };

    synthRef.current.speak(utterance);
  }, [isSupported, selectedVoice, rate, pitch, volume, cleanMarkdownForTTS, stop]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    isSpeaking,
    isPaused,
    activeMessageId,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    autoplay,
    setAutoplay,
    speak,
    stop,
    pause,
    resume
  };
}
