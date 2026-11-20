import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Copy,
  Trash2,
  Sliders,
  Send,
  HelpCircle,
  X,
  Camera,
  CameraOff,
  Check,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useCamera } from '../context/CameraContext';
import { useGestureEngine } from '../engine';
import { db } from '../db/db';
import { GestureCallTab } from './chat/GestureCallTab';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';

export interface ChatMessage {
  id: string;
  sender: 'user';
  text: string;
  gesture: string;
  timestamp: number;
}

interface PhraseMapping {
  [gesture: string]: { en: string; hi: string };
}

const DEFAULT_PHRASE_MAP: PhraseMapping = {
  Wave: { en: 'Hello', hi: 'नमस्ते' },
  Thumb_Up: { en: 'Yes / OK', hi: 'हाँ / ठीक है' },
  Thumb_Down: { en: 'No', hi: 'नहीं' },
  ILoveYou: { en: 'I love you', hi: 'मैं तुमसे प्यार करता हूँ' },
  Victory: { en: 'Peace', hi: 'शांति' },
  Pointing_Up: { en: 'One moment', hi: 'एक पल' },
  Closed_Fist: { en: 'Stop', hi: 'रुकिए' },
  Open_Palm: { en: 'Please', hi: 'कृपया' },
};

const GESTURE_ICONS: Record<string, string> = {
  Wave: '👋',
  Thumb_Up: '👍',
  Thumb_Down: '👎',
  ILoveYou: '🤟',
  Victory: '✌️',
  Pointing_Up: '☝️',
  Closed_Fist: '✊',
  Open_Palm: '✋',
  Swipe_Right: '➡️',
  Swipe_Left: '⬅️',
};

export const GestureChat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const { isStreaming, toggleCamera, startCamera } = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Messages & Transcript
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Phrase Map
  const [phraseMap, setPhraseMap] = useState<PhraseMapping>(() => {
    try {
      const saved = localStorage.getItem('aerotouch_phrase_map');
      return saved ? JSON.parse(saved) : DEFAULT_PHRASE_MAP;
    } catch {
      return DEFAULT_PHRASE_MAP;
    }
  });

  // Settings & Toggles
  const [talkTab, setTalkTab] = useState<'recognize' | 'call'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('call=')) {
      return 'call';
    }
    return 'recognize';
  });
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [showToOthers, setShowToOthers] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [typeInput, setTypeInput] = useState('');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastAddedMessageTimeRef = useRef<number>(0);
  const openPalmHoldTimerRef = useRef<number | null>(null);

  // Load saved transcript & phrase map from IndexedDB
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const transRecord = await db.settings.get('chat_transcript');
        if (transRecord && Array.isArray(transRecord.value)) {
          setMessages(transRecord.value as ChatMessage[]);
        }
        const phraseRecord = await db.settings.get('gesture_phrase_map');
        if (phraseRecord && phraseRecord.value) {
          setPhraseMap(phraseRecord.value as PhraseMapping);
        }
      } catch { }
    };
    loadFromDB();
  }, []);

  // Save transcript
  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem('aerotouch_chat_messages', JSON.stringify(newMessages));
    } catch { }
    db.settings
      .put({
        key: 'chat_transcript',
        value: newMessages,
        synced: false,
        updatedAt: Date.now(),
      })
      .catch(() => { });
  }, []);

  // Save phrase map
  const savePhraseMap = (newMap: PhraseMapping) => {
    setPhraseMap(newMap);
    try {
      localStorage.setItem('aerotouch_phrase_map', JSON.stringify(newMap));
    } catch { }
    db.settings
      .put({
        key: 'gesture_phrase_map',
        value: newMap,
        synced: false,
        updatedAt: Date.now(),
      })
      .catch(() => { });
  };

  // Auto-scroll chat container only
  const scrollToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  // Speech synthesis with 800ms rate-limit and language support
  const speakText = useCallback(
    (text: string) => {
      if (!speakEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const now = Date.now();
      if (now - lastSpokenTimeRef.current < 800) return;
      lastSpokenTimeRef.current = now;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch { }
    },
    [speakEnabled, currentLang]
  );

  // Add message helper
  const addMessage = useCallback(
    (gesture: string, customText?: string) => {
      const now = Date.now();
      if (now - lastAddedMessageTimeRef.current < 900 && !customText) return;
      lastAddedMessageTimeRef.current = now;

      let phraseText = customText;
      if (!phraseText) {
        const mapping = phraseMap[gesture] || DEFAULT_PHRASE_MAP[gesture];
        if (mapping) {
          phraseText = currentLang === 'hi' ? mapping.hi : mapping.en;
        } else {
          phraseText = gesture.replace('_', ' ');
        }
      }

      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'user',
        text: phraseText,
        gesture,
        timestamp: now,
      };

      saveMessages([...messages, newMsg]);
      speakText(phraseText);
      setTimeout(scrollToBottom, 50);
    },
    [phraseMap, currentLang, messages, saveMessages, speakText, scrollToBottom]
  );

  // Shared Gesture Engine
  const { state } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: true,
    onAction: (_action, gesture) => {
      // Open Palm requires 1.2s hold for "Please"
      if (gesture === 'Open_Palm') {
        if (!openPalmHoldTimerRef.current) {
          openPalmHoldTimerRef.current = window.setTimeout(() => {
            addMessage('Open_Palm');
            openPalmHoldTimerRef.current = null;
          }, 1200);
        }
        return;
      }

      if (openPalmHoldTimerRef.current) {
        clearTimeout(openPalmHoldTimerRef.current);
        openPalmHoldTimerRef.current = null;
      }

      if (gesture !== 'None') {
        addMessage(gesture);
      }
    },
  });

  // Clear palm timer if gesture leaves Open_Palm
  useEffect(() => {
    if (state.filteredGesture !== 'Open_Palm' && openPalmHoldTimerRef.current) {
      clearTimeout(openPalmHoldTimerRef.current);
      openPalmHoldTimerRef.current = null;
    }
  }, [state.filteredGesture]);

  // Handle typing submission
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeInput.trim()) return;
    addMessage('Text', typeInput.trim());
    setTypeInput('');
  };

  // Copy transcript
  const handleCopyTranscript = () => {
    const formatted = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] (${m.gesture}): ${m.text}`
      )
      .join('\n');
    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    });
  };

  // Download transcript
  const handleDownloadTranscript = () => {
    const formatted = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] (${m.gesture}): ${m.text}`
      )
      .join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerotouch_gesture_phrases_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear transcript
  const handleClearTranscript = () => {
    if (confirm('Clear all conversation history?')) {
      saveMessages([]);
    }
  };

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-heading font-semibold text-primary mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('gestureChat.badge', 'Gesture Phrases (Assistive Talk)')}</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
            {t('gestureChat.title', 'Gesture Chat: Speak with Hands')}
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            {t('gestureChat.desc', 'Turn intuitive air gestures into real-time written phrases and spoken speech.')}
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main Tab Switcher: Recognize vs Call */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-secondary border border-border shadow-soft">
            <button
              onClick={() => setTalkTab('recognize')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all ${talkTab === 'recognize'
                  ? 'bg-primary text-white shadow-soft font-bold'
                  : 'text-muted hover:text-foreground'
                }`}
            >
              {t('chat.tabs.recognize', 'Recognize')}
            </button>
            <button
              onClick={() => setTalkTab('call')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-1.5 ${talkTab === 'call'
                  ? 'bg-primary text-white shadow-soft font-bold'
                  : 'text-muted hover:text-foreground'
                }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t('chat.tabs.call', 'Gesture Call')}</span>
            </button>
          </div>

          {talkTab === 'recognize' && (
            <>
              <button
                onClick={() => setSpeakEnabled(!speakEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${speakEnabled
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-secondary border-border text-muted hover:text-foreground'
                  }`}
                title="Toggle Spoken Voice"
              >
                {speakEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{t('gestureChat.voice', 'Voice')}: {speakEnabled ? t('gestureChat.on', 'ON') : t('gestureChat.off', 'OFF')}</span>
              </button>

              <button
                onClick={() => setShowToOthers(true)}
                disabled={!latestMessage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-secondary hover:bg-surface text-foreground text-xs font-semibold transition-colors disabled:opacity-40"
                title="Display latest phrase in full screen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-accent" />
                <span>{t('gestureChat.showToOthers', 'Show to Others')}</span>
              </button>

              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-secondary hover:bg-surface text-foreground text-xs font-semibold transition-colors"
                title="Customize phrase dictionary"
              >
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span>{t('gestureChat.phraseMap', 'Phrase Map')}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface text-muted hover:text-foreground transition-colors"
            title="Gesture Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conditionally Render: Call Tab vs Recognize Tab */}
      {talkTab === 'call' ? (
        <GestureCallTab
          currentGesture={state.filteredGesture}
        />
      ) : (
        /* Main Two-Column Layout (Solo Recognize) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Camera Feed (Sticky, Fixed 4/3 Aspect Ratio) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-border shadow-card select-none">
              {isStreaming ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                  <HandOverlayCanvas />

                  {/* Gesture Live Tag */}
                  <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs font-mono font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      {state.filteredGesture !== 'None'
                        ? `${GESTURE_ICONS[state.filteredGesture] || '✨'} ${state.filteredGesture.replace('_', ' ')}`
                        : t('gestureChat.waiting', 'Waiting for gesture...')}
                    </span>
                  </div>

                  {/* Camera Toggle */}
                  <button
                    onClick={() => toggleCamera()}
                    className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-slate-900/80 border border-white/10 text-white hover:bg-slate-800 transition-colors"
                    title="Stop Camera"
                  >
                    <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm">{t('gestureChat.cameraOffline', 'Camera Offline')}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {t('gestureChat.cameraOfflineDesc', 'Start camera to begin translating your gestures to speech.')}
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-card flex items-center gap-2 transition-transform hover:scale-105"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('gestureChat.startCamera', 'Start Camera')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Explanation Card */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-soft text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-heading font-bold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{t('gestureChat.howItWorks', 'How Gesture Phrases Works')}</span>
              </div>
              <p className="text-muted leading-relaxed">
                {t('gestureChat.howItWorksDesc', 'Hold gestures in front of the lens. Waves, peace, thumbs up/down, and open palms are translated and spoken immediately.')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-mono">
                  {t('gestureChat.waveEq', 'Wave = "Hello"')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-mono">
                  {t('gestureChat.peaceEq', '✌️ = "Peace"')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-mono">
                  {t('gestureChat.yesEq', '👍 = "Yes / OK"')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-mono">
                  {t('gestureChat.stopEq', '✊ = "Stop"')}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Chat Panel & Transcript */}
          <div className="lg:col-span-7 flex flex-col h-[600px] rounded-2xl bg-surface border border-border shadow-card overflow-hidden">
            {/* Chat Header Bar */}
            <div className="px-4 py-3 bg-surface-secondary border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-heading font-bold text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>{t('gestureChat.conversationTranscript', 'Conversation Transcript')}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary">
                  {messages.length} {t('gestureChat.phrasesCount', 'phrases')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyTranscript}
                  disabled={messages.length === 0}
                  className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-40"
                  title="Copy Transcript"
                >
                  {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleDownloadTranscript}
                  disabled={messages.length === 0}
                  className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-40"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleClearTranscript}
                  disabled={messages.length === 0}
                  className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-rose-500 transition-colors disabled:opacity-40"
                  title="Clear All"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Message List (Auto-scrolls only this container) */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3.5 scroll-smooth overscroll-contain"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted space-y-2">
                  <MessageSquare className="w-8 h-8 opacity-30 text-primary" />
                  <p className="text-xs">{t('gestureChat.noPhrases', 'No phrases recorded yet.')}</p>
                  <p className="text-[11px] text-muted/70 max-w-xs">
                    {t('gestureChat.noPhrasesDesc', 'Wave your hand 👋 or show a gesture to speak your first phrase!')}
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-white p-3.5 shadow-soft flex items-start gap-2.5">
                      <span className="text-lg leading-none shrink-0 mt-0.5">
                        {GESTURE_ICONS[msg.gesture] || '💬'}
                      </span>
                      <div>
                        <p className="text-sm font-body font-medium leading-relaxed">{msg.text}</p>
                        <div className="flex items-center justify-end gap-2 text-[10px] text-white/70 mt-1 font-mono">
                          <span>{msg.gesture}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick-Phrase Chips */}
            <div className="px-4 py-2 border-t border-border/60 bg-surface-secondary/40 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[10px] uppercase font-bold text-muted shrink-0 mr-1">{t('gestureChat.quick', 'Quick:')}</span>
              {['Hello', 'Yes / OK', 'No', 'Please', 'Thank you', 'Stop'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => addMessage('QuickChip', chip)}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary/40 text-foreground text-[11px] font-medium shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Typing Bar Fallback */}
            <form onSubmit={handleTypeSubmit} className="p-3 border-t border-border bg-surface flex items-center gap-2">
              <input
                type="text"
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                placeholder={t('gestureChat.chatPlaceholder', 'Type phrase fallback...')}
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface-secondary border border-border text-foreground text-xs placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!typeInput.trim()}
                className="p-2 rounded-xl bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-40"
                title={t('gestureChat.send', 'Send')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* "SHOW TO OTHERS" FULLSCREEN OVERLAY */}
      {showToOthers && latestMessage && (
        <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between p-8 sm:p-16 select-none animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{GESTURE_ICONS[latestMessage.gesture] || '💬'}</span>
              <span className="text-sm uppercase tracking-widest text-slate-400 font-mono">
                {latestMessage.gesture} Phrase
              </span>
            </div>
            <button
              onClick={() => setShowToOthers(false)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center my-auto px-4">
            <p className="font-heading font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-tight text-white drop-shadow-md">
              &quot;{latestMessage.text}&quot;
            </p>
          </div>

          <div className="text-center text-slate-400 text-xs sm:text-sm font-mono">
            {t('gestureChat.tapAnywhere', 'Tap anywhere or click close to return')}
          </div>
        </div>
      )}

      {/* PHRASE MAP DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-base text-foreground">{t('gestureChat.phraseDictionary', 'Phrase Dictionary')}</h3>
                </div>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close" className="p-1 rounded-lg hover:bg-surface-secondary text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                {t('gestureChat.phraseDictDesc', 'Map each recognized gesture to custom spoken English and Hindi phrases.')}
              </p>

              <div className="space-y-4">
                {Object.entries(phraseMap).map(([gesture, phrases]) => (
                  <div key={gesture} className="p-3.5 rounded-xl bg-surface-secondary border border-border space-y-2">
                    <div className="flex items-center gap-2 text-xs font-heading font-bold text-foreground">
                      <span>{GESTURE_ICONS[gesture] || '✨'}</span>
                      <span>{gesture.replace('_', ' ')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-muted block mb-0.5">{t('gestureChat.english', 'English')}</label>
                        <input
                          type="text"
                          value={phrases.en}
                          onChange={(e) =>
                            savePhraseMap({
                              ...phraseMap,
                              [gesture]: { ...phrases, en: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-0.5">{t('gestureChat.hindi', 'Hindi (हिंदी)')}</label>
                        <input
                          type="text"
                          value={phrases.hi}
                          onChange={(e) =>
                            savePhraseMap({
                              ...phraseMap,
                              [gesture]: { ...phrases, hi: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                savePhraseMap(DEFAULT_PHRASE_MAP);
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-surface-secondary border border-border hover:bg-surface text-muted hover:text-foreground text-xs font-semibold"
            >
              {t('gestureChat.resetDefaults', 'Reset to Defaults')}
            </button>
          </div>
        </div>
      )}

      {/* HELP GUIDE MODAL */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-heading font-bold text-base text-foreground">
                {t('gestureChat.guideTitle', 'Gesture Phrases Guide')}
              </h3>
              <button onClick={() => setHelpOpen(false)} aria-label="Close" className="p-1 rounded-lg hover:bg-surface-secondary text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              <strong>{t('gestureChat.honestyLabel', 'Honesty note:')}</strong> {t('gestureChat.honestyNote', 'This assistive tool translates predefined hand gestures into spoken and written phrases. It is designed for hands-free expression and touchless communication.')}
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="font-bold text-foreground">{t('gestureChat.guideWave', '👋 Wave:')}</span>
                <p className="text-muted text-[11px] mt-0.5">{t('gestureChat.guideWaveDesc', '3 direction swings within 1.4s speaks "Hello"')}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="font-bold text-foreground">{t('gestureChat.guideThumbUp', '👍 Thumb Up:')}</span>
                <p className="text-muted text-[11px] mt-0.5">{t('gestureChat.guideThumbUpDesc', 'Confirms with "Yes / OK"')}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="font-bold text-foreground">{t('gestureChat.guideVictory', '✌️ Victory:')}</span>
                <p className="text-muted text-[11px] mt-0.5">{t('gestureChat.guideVictoryDesc', 'Speaks "Peace"')}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="font-bold text-foreground">{t('gestureChat.guideOpenPalm', '✋ Open Palm:')}</span>
                <p className="text-muted text-[11px] mt-0.5">{t('gestureChat.guideOpenPalmDesc', 'Hold still for 1.2s to speak "Please"')}</p>
              </div>
            </div>

            <button
              onClick={() => setHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-heading font-semibold text-xs mt-2"
            >
              {t('gestureChat.gotIt', 'Got it')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureChat;
