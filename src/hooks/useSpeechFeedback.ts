import { useState, useEffect, useRef, useCallback } from 'react';
import i18n from '../i18n';

export function useSpeechFeedback() {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aerotouch_voice_enabled') === 'true';
  });

  const [voiceVolume, setVoiceVolume] = useState<number>(() => {
    const saved = localStorage.getItem('aerotouch_voice_volume');
    return saved !== null ? Number(saved) : 0.9;
  });

  const lastSpeechTimeRef = useRef<number>(0);
  const voiceVolumeRef = useRef<number>(voiceVolume);
  voiceVolumeRef.current = voiceVolume;

  const voiceEnabledRef = useRef<boolean>(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const updateVoiceEnabled = (val: boolean) => {
    setVoiceEnabled(val);
    voiceEnabledRef.current = val;
    localStorage.setItem('aerotouch_voice_enabled', String(val));
  };

  const updateVoiceVolume = (val: number) => {
    setVoiceVolume(val);
    voiceVolumeRef.current = val;
    localStorage.setItem('aerotouch_voice_volume', String(val));
  };

  // Called when camera starts to auto-enable voice if not explicitly disabled
  const activateVoiceOnCameraStart = useCallback(() => {
    const explicitlyDisabled = localStorage.getItem('aerotouch_voice_enabled') === 'false';
    if (!explicitlyDisabled) {
      updateVoiceEnabled(true);
    }
  }, []);

  const speak = useCallback((text: string, overrideLang?: string) => {
    if (!voiceEnabledRef.current || !text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    // Rate-limit: one phrase per 700ms
    if (now - lastSpeechTimeRef.current < 700) {
      return;
    }
    lastSpeechTimeRef.current = now;

    try {
      window.speechSynthesis.cancel(); // Cancel any speech in progress

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = voiceVolumeRef.current;
      utterance.rate = 1.0;

      const targetLang = overrideLang || i18n.language || 'en';
      const voices = window.speechSynthesis.getVoices();

      // Find matching voice for target language
      let selectedVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(targetLang.toLowerCase())
      );

      // Silent fallback to English if not found
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = selectedVoice ? selectedVoice.lang : 'en-US';

      utterance.onerror = () => {};
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis is progressive enhancement
    }
  }, []);

  // Pre-load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
    }
  }, []);

  return {
    voiceEnabled,
    setVoiceEnabled: updateVoiceEnabled,
    voiceVolume,
    setVoiceVolume: updateVoiceVolume,
    speak,
    activateVoiceOnCameraStart,
  };
}
