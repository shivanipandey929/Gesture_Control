import i18n from '../i18n';

export type VoicePhraseKey =
  | 'slash'
  | 'pop'
  | 'next'
  | 'prev'
  | 'pause'
  | 'paused'
  | 'play'
  | 'gameover'
  | 'screenshot_saved'
  | 'volume_up'
  | 'volume_down';

const PHRASE_LOCALIZATIONS: Record<VoicePhraseKey, { en: string; hi: string; mr: string }> = {
  slash: { en: 'Slash', hi: 'स्लैश', mr: 'स्लॅश' },
  pop: { en: 'Pop', hi: 'पॉप', mr: 'पॉप' },
  next: { en: 'Next', hi: 'अगला', mr: 'पुढील' },
  prev: { en: 'Previous', hi: 'पिछला', mr: 'मागील' },
  pause: { en: 'Paused', hi: 'रुक गया', mr: 'थांबवले' },
  paused: { en: 'Paused', hi: 'रुक गया', mr: 'थांबवले' },
  play: { en: 'Play', hi: 'शुरू', mr: 'सुरू' },
  gameover: { en: 'Game over', hi: 'खेल समाप्त', mr: 'खेळ समाप्त' },
  screenshot_saved: { en: 'Screenshot saved', hi: 'स्क्रीनशॉट सहेजा गया', mr: 'स्क्रीनशॉट सेव्ह केला' },
  volume_up: { en: 'Volume up', hi: 'आवाज़ बढ़ाई', mr: 'आवाज वाढवला' },
  volume_down: { en: 'Volume down', hi: 'आवाज़ घटाई', mr: 'आवाज कमी केला' },
};

export class VoiceService {
  private enabled: boolean = true;
  private volume: number = 0.9;
  private isUnlocked: boolean = false;
  private lastSpokenTime: number = 0;
  private readonly rateLimitMs: number = 500;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private subscribers: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('aerotouch_voice_enabled');
      this.enabled = saved !== 'false'; // Default ON

      const savedVol = localStorage.getItem('aerotouch_voice_volume');
      if (savedVol !== null) {
        this.volume = Number(savedVol);
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 1. Chrome Quirk: Populate voices & handle asynchronous voiceschanged
      this.loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });

      // 2. Unlock audio synthesis after first click or touch
      const handleUnlock = () => {
        this.unlock();
        window.removeEventListener('click', handleUnlock);
        window.removeEventListener('keydown', handleUnlock);
        window.removeEventListener('touchstart', handleUnlock);
      };
      window.addEventListener('click', handleUnlock, { passive: true });
      window.addEventListener('keydown', handleUnlock, { passive: true });
      window.addEventListener('touchstart', handleUnlock, { passive: true });
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.voices = window.speechSynthesis.getVoices() || [];
      } catch {
        this.voices = [];
      }
    }
  }

  public get hasVoiceAvailable(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    return true;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public get unlocked(): boolean {
    return this.isUnlocked;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aerotouch_voice_enabled', String(val));
      localStorage.setItem('aerotouch_speech_feedback', String(val));
    }
    this.notifySubscribers();
  }

  public toggleEnabled(): boolean {
    const next = !this.enabled;
    this.setEnabled(next);
    if (next) {
      this.unlock();
      this.speakPhrase('play');
    }
    return next;
  }

  public unlock() {
    this.isUnlocked = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // Fallback
      }
    }
  }

  public subscribe(cb: (enabled: boolean) => void): () => void {
    this.subscribers.add(cb);
    cb(this.enabled);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => cb(this.enabled));
  }

  /**
   * Speak a pre-defined phrase mapped to the current application language
   */
  public speakPhrase(phraseKey: VoicePhraseKey) {
    const lang = i18n?.language?.startsWith('hi')
      ? 'hi'
      : i18n?.language?.startsWith('mr')
      ? 'mr'
      : 'en';

    const text = PHRASE_LOCALIZATIONS[phraseKey]?.[lang] || PHRASE_LOCALIZATIONS[phraseKey]?.en || phraseKey;
    this.speak(text, lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US');
  }

  /**
   * Central speech synthesis executor handling all browser/Chrome quirks
   */
  public speak(text: string, langCode?: string) {
    if (!this.enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    // Strict rate-limit: 1 phrase per 500 ms
    if (now - this.lastSpokenTime < this.rateLimitMs) {
      return;
    }
    this.lastSpokenTime = now;

    try {
      const synth = window.speechSynthesis;

      // Chrome Quirk: resume if stalled/paused
      if (synth.paused) {
        synth.resume();
      }

      // Chrome Quirk: cancel in-flight utterances before starting new one
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 1.05;

      const targetLang = langCode || (i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US');
      utterance.lang = targetLang;

      // Select voice matching language if available
      if (this.voices.length > 0) {
        const langPrefix = targetLang.split('-')[0].toLowerCase();
        const matchedVoice = this.voices.find(
          (v) => v.lang.toLowerCase().startsWith(langPrefix) || v.lang.toLowerCase().includes(langPrefix)
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      // Chrome Quirk: store reference to active utterance to prevent garbage collection mid-speech
      this.activeUtterance = utterance;
      utterance.onend = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
      };
      utterance.onerror = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
      };

      synth.speak(utterance);
    } catch (err) {
      console.warn('[VoiceService] Speech synthesis error:', err);
    }
  }

  /**
   * Handle incoming action from master action bus or gesture engine
   */
  public handleAction(action: string, _gesture?: string) {
    switch (action) {
      case 'NEXT':
        this.speakPhrase('next');
        break;
      case 'PREV':
        this.speakPhrase('prev');
        break;
      case 'PAUSE':
        this.speakPhrase('pause');
        break;
      case 'PLAY':
        this.speakPhrase('play');
        break;
      case 'VOLUME_UP':
        this.speakPhrase('volume_up');
        break;
      case 'VOLUME_DOWN':
        this.speakPhrase('volume_down');
        break;
      case 'SCREENSHOT':
        this.speakPhrase('screenshot_saved');
        break;
      default:
        break;
    }
  }
}

export const voiceService = new VoiceService();
