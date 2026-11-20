export interface CallDataPhraseMessage {
  type: 'phrase';
  key: string;
  ts: number;
}

export interface CallDataTextMessage {
  type: 'text';
  text: string;
  ts: number;
}

export type CallDataMessage = CallDataPhraseMessage | CallDataTextMessage;

export interface CallChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  phraseKey?: string;
  gestureIcon?: string;
  timestamp: number;
}

export const VALID_PHRASE_KEYS = [
  'hello',
  'yes',
  'no',
  'thanks',
  'sorry',
  'help',
  'please',
  'love',
  'ok',
  'wait',
  'stop',
] as const;

export type ValidPhraseKey = (typeof VALID_PHRASE_KEYS)[number];

export const PHRASE_KEY_MAP: Record<string, { en: string; hi: string; mr: string; icon: string }> = {
  hello: { en: 'Hello', hi: 'नमस्ते', mr: 'नमस्कार', icon: '👋' },
  yes: { en: 'Yes', hi: 'हाँ', mr: 'हो', icon: '👍' },
  no: { en: 'No', hi: 'नहीं', mr: 'नाही', icon: '👎' },
  thanks: { en: 'Thank you', hi: 'धन्यवाद', mr: 'धन्यवाद', icon: '🙏' },
  sorry: { en: 'Sorry', hi: 'माफ़ कीजिए', mr: 'माफ करा', icon: '🙇' },
  help: { en: 'Help', hi: 'मदद', mr: 'मदत', icon: '🆘' },
  please: { en: 'Please', hi: 'कृपया', mr: 'कृपया', icon: '✋' },
  love: { en: 'I love you', hi: 'मैं तुमसे प्यार करता हूँ', mr: 'माझे तुझ्यावर प्रेम आहे', icon: '🤟' },
  ok: { en: 'OK', hi: 'ठीक है', mr: 'ठीक आहे', icon: '👌' },
  wait: { en: 'Wait', hi: 'रुकिए', mr: 'थांबा', icon: '☝️' },
  stop: { en: 'Stop', hi: 'रुको', mr: 'थांबवा', icon: '✊' },
};

export const GESTURE_TO_PHRASE_KEY: Record<string, ValidPhraseKey> = {
  Wave: 'hello',
  Thumb_Up: 'yes',
  Thumb_Down: 'no',
  Victory: 'thanks',
  Pointing_Up: 'wait',
  Closed_Fist: 'stop',
  Open_Palm: 'please',
  ILoveYou: 'love',
};

/**
 * Message rate limiter: maximum 5 messages per second per peer
 */
export class MessageRateLimiter {
  private messageTimestamps: number[] = [];
  private readonly maxPerSecond: number;

  constructor(maxPerSecond: number = 5) {
    this.maxPerSecond = maxPerSecond;
  }

  canAcceptMessage(now: number = Date.now()): boolean {
    this.messageTimestamps = this.messageTimestamps.filter((t) => now - t <= 1000);
    if (this.messageTimestamps.length >= this.maxPerSecond) {
      return false;
    }
    this.messageTimestamps.push(now);
    return true;
  }

  reset(): void {
    this.messageTimestamps = [];
  }
}

/**
 * Validates untrusted incoming data-channel payload:
 * - Checks type discriminant
 * - Bounds string lengths (max 200 chars for text)
 * - Sanitizes plain text (strips control characters)
 * - Validates phrase keys against known dictionary
 */
export function validateDataMessage(raw: unknown): CallDataMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  const ts = typeof obj.ts === 'number' ? obj.ts : Date.now();

  if (obj.type === 'phrase') {
    if (typeof obj.key !== 'string') return null;
    const cleanKey = obj.key.toLowerCase().trim();
    if (!VALID_PHRASE_KEYS.includes(cleanKey as ValidPhraseKey)) {
      return null;
    }
    return {
      type: 'phrase',
      key: cleanKey,
      ts,
    };
  }

  if (obj.type === 'text') {
    if (typeof obj.text !== 'string') return null;
    // Bound to 200 chars max
    const trimmed = obj.text.slice(0, 200).trim();
    if (!trimmed) return null;
    // Strip control characters to ensure safe plain-text rendering
    const sanitized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return {
      type: 'text',
      text: sanitized,
      ts,
    };
  }

  return null;
}

/**
 * Translates a phrase key into the user's localized text
 */
export function getLocalizedPhrase(
  key: string,
  lang: string = 'en'
): { text: string; icon: string } {
  const info = PHRASE_KEY_MAP[key] || {
    en: key,
    hi: key,
    mr: key,
    icon: '💬',
  };

  const cleanLang = lang.startsWith('hi') ? 'hi' : lang.startsWith('mr') ? 'mr' : 'en';
  return {
    text: info[cleanLang] || info.en,
    icon: info.icon,
  };
}

/**
 * Generates an 8-character random alphanumeric call code from crypto.getRandomValues
 */
export function generateCallCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

export type CallState =
  | 'idle'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'error';

export interface CallStateMachineState {
  status: CallState;
  code: string | null;
  error: string | null;
  isInitiator: boolean;
  hasRemoteVideo: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  phraseRecognitionEnabled: boolean;
}
