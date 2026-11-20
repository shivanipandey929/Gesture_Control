import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Check,
  Share2,
  Sparkles,
  Send,
  Download,
  Trash2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { HandOverlayCanvas } from '../../components/common/HandOverlayCanvas';
import {
  type CallChatMessage,
  type CallState,
  type ValidPhraseKey,
  generateCallCode,
  validateDataMessage,
  getLocalizedPhrase,
  GESTURE_TO_PHRASE_KEY,
  MessageRateLimiter,
  VALID_PHRASE_KEYS,
} from '../../utils/callProtocol';

export interface GestureCallTabProps {
  currentGesture: string;
}

export const GestureCallTab: React.FC<GestureCallTabProps> = ({
  currentGesture,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [callCode, setCallCode] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('call=')) {
      const match = window.location.hash.match(/call=([A-Za-z0-9]+)/);
      if (match && match[1]) return match[1].toUpperCase();
    }
    return generateCallCode();
  });

  const [inputCode, setInputCode] = useState<string>('');
  const [callStatus, setCallStatus] = useState<CallState>('idle');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isLoopback, setIsLoopback] = useState<boolean>(false);

  // Controls
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [phraseRecognitionEnabled, setPhraseRecognitionEnabled] = useState<boolean>(true);
  const [speakReceivedPhrases, setSpeakReceivedPhrases] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);

  // Live caption over remote video
  const [remoteCaption, setRemoteCaption] = useState<string | null>(null);
  const captionTimerRef = useRef<number | null>(null);

  // Chat
  const [messages, setMessages] = useState<CallChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const loopbackPcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const rateLimiterRef = useRef(new MessageRateLimiter(5));
  const myPeerIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const lastPhraseSentTimeRef = useRef<number>(0);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showRemoteCaption = useCallback((text: string) => {
    setRemoteCaption(text);
    if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    captionTimerRef.current = window.setTimeout(() => {
      setRemoteCaption(null);
    }, 2500);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!speakReceivedPhrases || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang.startsWith('hi') ? 'hi-IN' : currentLang.startsWith('mr') ? 'mr-IN' : 'en-US';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Silent fallback
      }
    },
    [currentLang, speakReceivedPhrases]
  );

  // Acquire local media (Video + Audio)
  const getLocalStream = async (withAudio: boolean = true): Promise<MediaStream> => {
    if (localMediaStreamRef.current && localMediaStreamRef.current.active) {
      return localMediaStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: withAudio,
      });
      localMediaStreamRef.current = stream;
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      // Audio might have been denied; fallback to video-only
      const videoOnly = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      localMediaStreamRef.current = videoOnly;
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = videoOnly;
      }
      setIsAudioMuted(true);
      return videoOnly;
    }
  };

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (loopbackPcRef.current) {
      loopbackPcRef.current.close();
      loopbackPcRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      localMediaStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (selfVideoRef.current) {
      selfVideoRef.current.srcObject = null;
    }
    setCallStatus('ended');
  }, []);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const handleIncomingData = useCallback(
    (rawPayload: unknown) => {
      if (!rateLimiterRef.current.canAcceptMessage()) {
        console.warn('[Call] Rate limit exceeded from peer, ignoring message.');
        return;
      }

      const valid = validateDataMessage(rawPayload);
      if (!valid) return;

      if (valid.type === 'phrase') {
        const localized = getLocalizedPhrase(valid.key, currentLang);
        showRemoteCaption(`${localized.icon} ${localized.text}`);
        speakText(localized.text);

        const newMsg: CallChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sender: 'them',
          text: localized.text,
          phraseKey: valid.key,
          gestureIcon: localized.icon,
          timestamp: valid.ts,
        };
        setMessages((prev) => [...prev, newMsg]);
      } else if (valid.type === 'text') {
        showRemoteCaption(valid.text);
        const newMsg: CallChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sender: 'them',
          text: valid.text,
          timestamp: valid.ts,
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    },
    [currentLang, showRemoteCaption, speakText]
  );

  // Setup WebRTC DataChannel
  const setupDataChannel = (dc: RTCDataChannel) => {
    dataChannelRef.current = dc;
    dc.onopen = () => {
      setCallStatus('connected');
      setStatusError(null);
    };
    dc.onclose = () => {
      setCallStatus('ended');
    };
    dc.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        handleIncomingData(parsed);
      } catch {
        // Malformed payload
      }
    };
  };

  // Start Peer-to-Peer Call or Loopback Call
  const startCall = async (targetCode: string, isInitiator: boolean = true) => {
    if (isLoopback) {
      // Loopback mode: test both sides locally with one camera
      setCallStatus('connecting');
      try {
        const stream = await getLocalStream(true);
        const pc1 = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        const pc2 = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        pcRef.current = pc1;
        loopbackPcRef.current = pc2;

        pc1.onicecandidate = (e) => e.candidate && pc2.addIceCandidate(e.candidate);
        pc2.onicecandidate = (e) => e.candidate && pc1.addIceCandidate(e.candidate);

        pc2.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        };

        const dc1 = pc1.createDataChannel('gestureChat');
        setupDataChannel(dc1);

        pc2.ondatachannel = (e) => {
          e.channel.onmessage = (evt) => {
            try {
              handleIncomingData(JSON.parse(evt.data));
            } catch {}
          };
        };

        stream.getTracks().forEach((track) => pc1.addTrack(track, stream));

        const offer = await pc1.createOffer();
        await pc1.setLocalDescription(offer);
        await pc2.setRemoteDescription(offer);

        const answer = await pc2.createAnswer();
        await pc2.setLocalDescription(answer);
        await pc1.setRemoteDescription(answer);

        setCallStatus('connected');
        return;
      } catch (err) {
        setCallStatus('error');
        setStatusError(String(err));
        return;
      }
    }

    // Real Supabase Broadcast Signalling
    if (!isSupabaseConfigured || !supabase) {
      setCallStatus('error');
      setStatusError(
        t('chat.call.offlineNotice', 'Live calls require an internet connection and Supabase connection. The rest of AeroTouch works offline.')
      );
      return;
    }

    setCallStatus(isInitiator ? 'waiting' : 'connecting');
    setStatusError(null);

    try {
      const stream = await getLocalStream(true);
      const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
      if (import.meta.env.VITE_TURN_URL) {
        iceServers.push({
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        });
      }

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setCallStatus('connected');
        }
      };

      if (isInitiator) {
        const dc = pc.createDataChannel('gestureChat');
        setupDataChannel(dc);
      } else {
        pc.ondatachannel = (e) => {
          setupDataChannel(e.channel);
        };
      }

      const channel = supabase.channel(`call:${targetCode}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'candidate',
              candidate: e.candidate,
              senderId: myPeerIdRef.current,
            },
          });
        }
      };

      channel
        .on('broadcast', { event: 'signal' }, async ({ payload }) => {
          if (!payload || payload.senderId === myPeerIdRef.current) return;

          if (payload.type === 'offer' && !isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'answer',
                sdp: answer,
                senderId: myPeerIdRef.current,
              },
            });
          } else if (payload.type === 'answer' && isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallStatus('connected');
          } else if (payload.type === 'candidate') {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {}
          } else if (payload.type === 'leave') {
            setCallStatus('ended');
            cleanupCall();
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'offer',
                sdp: offer,
                senderId: myPeerIdRef.current,
              },
            });
          }
        });
    } catch (err) {
      setCallStatus('error');
      setStatusError(err instanceof Error ? err.message : String(err));
    }
  };

  // Transmit gesture phrases over data channel
  useEffect(() => {
    if (!phraseRecognitionEnabled || callStatus !== 'connected' || !dataChannelRef.current) {
      return;
    }
    if (dataChannelRef.current.readyState !== 'open') return;

    const phraseKey = GESTURE_TO_PHRASE_KEY[currentGesture];
    if (!phraseKey) return;

    const now = Date.now();
    if (now - lastPhraseSentTimeRef.current < 1800) {
      return; // 1.8s debounce for phrase transmission
    }
    lastPhraseSentTimeRef.current = now;

    const payload = {
      type: 'phrase',
      key: phraseKey,
      ts: now,
    };

    try {
      dataChannelRef.current.send(JSON.stringify(payload));
      const localized = getLocalizedPhrase(phraseKey, currentLang);
      const newMsg: CallChatMessage = {
        id: `msg_me_${now}`,
        sender: 'me',
        text: localized.text,
        phraseKey,
        gestureIcon: localized.icon,
        timestamp: now,
      };
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('[Call] Failed to send phrase:', err);
    }
  }, [currentGesture, phraseRecognitionEnabled, callStatus, currentLang]);

  // Send typed text message
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !dataChannelRef.current || dataChannelRef.current.readyState !== 'open') return;

    const now = Date.now();
    const payload = {
      type: 'text',
      text: trimmed,
      ts: now,
    };

    try {
      dataChannelRef.current.send(JSON.stringify(payload));
      const newMsg: CallChatMessage = {
        id: `msg_me_${now}`,
        sender: 'me',
        text: trimmed,
        timestamp: now,
      };
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
    } catch (err) {
      console.warn('[Call] Failed to send text:', err);
    }
  };

  // Send quick phrase button
  const handleSendQuickPhrase = (key: ValidPhraseKey) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') return;
    const now = Date.now();
    const payload = { type: 'phrase', key, ts: now };
    try {
      dataChannelRef.current.send(JSON.stringify(payload));
      const localized = getLocalizedPhrase(key, currentLang);
      const newMsg: CallChatMessage = {
        id: `msg_me_${now}`,
        sender: 'me',
        text: localized.text,
        phraseKey: key,
        gestureIcon: localized.icon,
        timestamp: now,
      };
      setMessages((prev) => [...prev, newMsg]);
    } catch {}
  };

  // Toggle Mute Audio
  const toggleAudio = () => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle Mute Video
  const toggleVideo = () => {
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const copyCallCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(callCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/chat#call=${callCode}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const downloadTranscript = () => {
    const lines = messages.map(
      (m) =>
        `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'me' ? 'You' : 'They'}: ${m.text}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AeroTouch_Call_${callCode}_Transcript.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ------------------------------------------------------------- */}
      {/* LEFT COLUMN: Large Remote Video + PIP Self-View + Live Controls */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="relative aspect-video w-full rounded-3xl bg-slate-950 border border-border/80 overflow-hidden shadow-elevated flex items-center justify-center">
          {/* Main Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Placeholder when not connected */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-br from-slate-900 to-slate-950 text-white select-none">
              <Phone className="w-12 h-12 text-primary animate-pulse" />
              <h3 className="font-heading font-bold text-lg">
                {callStatus === 'idle'
                  ? t('chat.call.idleTitle', 'Ready to Call')
                  : callStatus === 'waiting'
                  ? t('chat.call.waitingTitle', 'Waiting for friend to join...')
                  : callStatus === 'connecting'
                  ? t('chat.call.connectingTitle', 'Connecting call...')
                  : callStatus === 'reconnecting'
                  ? t('chat.call.reconnectingTitle', 'Reconnecting...')
                  : t('chat.call.endedTitle', 'Call Ended')}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {callStatus === 'waiting'
                  ? t('chat.call.shareHint', 'Share your 8-letter call code or share link with the other person.')
                  : t('chat.call.peerHint', 'Direct peer-to-peer audio, video and gesture translation. Outside calls your video never leaves your device.')}
              </p>
            </div>
          )}

          {/* Picture-in-Picture Self View (Bottom-Right, Mirrored) */}
          <div className="absolute bottom-4 right-4 w-32 sm:w-40 aspect-video rounded-2xl bg-black/60 border border-white/20 overflow-hidden shadow-card">
            <video
              ref={selfVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            <HandOverlayCanvas />
            <span className="absolute top-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white z-20">
              {t('chat.call.you', 'You')}
            </span>
          </div>

          {/* Live Caption Over Remote Video */}
          {remoteCaption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-400/40 text-white font-heading font-bold text-sm shadow-elevated flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{remoteCaption}</span>
            </div>
          )}

          {/* Call Status Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                callStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : callStatus === 'connecting' || callStatus === 'waiting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize">{callStatus}</span>
          </div>
        </div>

        {/* Call Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isAudioMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
              }`}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isVideoMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
              }`}
              title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setPhraseRecognitionEnabled(!phraseRecognitionEnabled)}
              className={`px-3 py-2 rounded-xl border text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors ${
                phraseRecognitionEnabled
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-secondary border-border text-muted hover:text-foreground'
              }`}
              title={t('chat.call.togglePhraseDesc', 'Translate gestures into phrase messages')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('chat.call.gesturePhrases', 'Gesture Phrases')}: {phraseRecognitionEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setSpeakReceivedPhrases(!speakReceivedPhrases)}
              className={`p-2.5 rounded-xl border text-xs font-heading font-semibold flex items-center gap-1.5 transition-colors ${
                speakReceivedPhrases
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-secondary border-border text-muted hover:text-foreground'
              }`}
              title={t('chat.call.toggleSpeechDesc', 'Speak incoming phrases')}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {callStatus === 'connected' || callStatus === 'waiting' || callStatus === 'connecting' ? (
              <button
                onClick={cleanupCall}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs shadow-soft flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t('chat.call.endCall', 'End Call')}</span>
              </button>
            ) : (
              <button
                onClick={() => startCall(callCode, true)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-soft flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" />
                <span>{t('chat.call.startCall', 'Start Call')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Code Card + Join Card + Conversation Panel */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Code & Connect Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              {t('chat.call.yourCode', 'Your Call Code')}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLoopback}
                  onChange={(e) => setIsLoopback(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span>{t('chat.call.testLoopback', 'Test Loopback')}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
            <span className="font-mono font-black text-xl tracking-widest text-primary">
              {callCode}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCallCode(generateCallCode())}
                className="p-2 rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
                title={t('chat.call.regenerateCode', 'Regenerate code')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={copyCallCode}
                className="p-2 rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
                title={t('common.copy', 'Copy code')}
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={copyShareLink}
                className="p-2 rounded-lg hover:bg-surface-secondary text-muted hover:text-foreground transition-colors"
                title={t('chat.call.copyLink', 'Copy invite link')}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Join a Call input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('chat.call.enterCode', 'Enter 8-letter code')}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border font-mono text-sm tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={() => {
                if (inputCode.trim().length === 8) {
                  startCall(inputCode.trim(), false);
                }
              }}
              disabled={inputCode.trim().length !== 8 || callStatus === 'connected'}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-heading font-bold text-xs transition-colors shrink-0"
            >
              {t('chat.call.join', 'Join Call')}
            </button>
          </div>

          {statusError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusError}</span>
            </div>
          )}
        </div>

        {/* Conversation Panel (Two-sided Chat Bubbles) */}
        <div className="rounded-2xl bg-card border border-border shadow-sm flex flex-col h-[380px] overflow-hidden">
          <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-surface-secondary/40">
            <span className="text-xs font-bold font-heading text-foreground">
              {t('chat.call.conversation', 'Call Conversation')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className="p-1 rounded text-muted hover:text-foreground text-xs flex items-center gap-1"
                title="Phrase Cheat Sheet"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t('chat.call.cheatSheet', 'Phrases')}</span>
              </button>
              <button
                onClick={downloadTranscript}
                disabled={messages.length === 0}
                className="p-1 rounded text-muted hover:text-foreground disabled:opacity-40"
                title={t('chat.call.downloadTxt', 'Download transcript')}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
                className="p-1 rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
                title={t('common.clear', 'Clear')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Phrase Chips */}
          <div className="px-3 py-2 border-b border-border/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {VALID_PHRASE_KEYS.slice(0, 6).map((key) => {
              const info = getLocalizedPhrase(key, currentLang);
              return (
                <button
                  key={key}
                  onClick={() => handleSendQuickPhrase(key)}
                  className="px-2 py-0.5 rounded-lg bg-surface-secondary hover:bg-primary/10 hover:text-primary transition-colors shrink-0 border border-border/60 flex items-center gap-1"
                >
                  <span>{info.icon}</span>
                  <span>{info.text}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Messages Container */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted text-center p-4">
                {t('chat.call.noMessages', 'Phrases and typed messages during the call appear here.')}
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-body shadow-xs ${
                      m.sender === 'me'
                        ? 'bg-primary text-white rounded-br-xs'
                        : 'bg-surface-secondary border border-border/80 text-foreground rounded-bl-xs'
                    }`}
                  >
                    {m.gestureIcon && <span className="mr-1.5 text-sm">{m.gestureIcon}</span>}
                    <span>{m.text}</span>
                  </div>
                  <span className="text-[10px] text-muted font-mono mt-0.5 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Typing Bar Fallback */}
          <form onSubmit={handleSendText} className="p-3 border-t border-border flex items-center gap-2">
            <input
              type="text"
              placeholder={t('chat.call.typeMessage', 'Type message...')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Phrase Cheat Sheet Modal */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-heading font-bold text-base text-foreground">
                {t('chat.call.cheatSheetTitle', 'Gesture Phrases Cheat Sheet')}
              </h3>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="p-1 rounded-lg hover:bg-surface-secondary text-muted"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted">
              {t('chat.call.cheatSheetDesc', 'These natural air gestures are automatically translated into phrases and spoken in the recipient’s chosen language:')}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(GESTURE_TO_PHRASE_KEY).map(([gesture, phraseKey]) => {
                const info = getLocalizedPhrase(phraseKey, currentLang);
                return (
                  <div key={gesture} className="p-2.5 rounded-xl bg-surface-secondary border border-border/80 flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <div>
                      <div className="font-semibold text-foreground">{info.text}</div>
                      <div className="text-[10px] text-muted">{gesture.replace('_', ' ')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
