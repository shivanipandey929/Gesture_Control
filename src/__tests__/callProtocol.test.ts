import { describe, it, expect } from 'vitest';
import {
  validateDataMessage,
  MessageRateLimiter,
  getLocalizedPhrase,
  generateCallCode,
  VALID_PHRASE_KEYS,
} from '../utils/callProtocol';

describe('Gesture Call Protocol & State Machine', () => {
  describe('Message Validation & Security', () => {
    it('accepts valid phrase messages with known keys', () => {
      const msg = validateDataMessage({ type: 'phrase', key: 'hello', ts: 1700000000000 });
      expect(msg).not.toBeNull();
      expect(msg?.type).toBe('phrase');
      if (msg?.type === 'phrase') {
        expect(msg.key).toBe('hello');
      }
    });

    it('rejects unknown or malicious phrase keys', () => {
      expect(validateDataMessage({ type: 'phrase', key: '<script>alert(1)</script>' })).toBeNull();
      expect(validateDataMessage({ type: 'phrase', key: 'eval_injection' })).toBeNull();
      expect(validateDataMessage({ type: 'phrase', key: '' })).toBeNull();
    });

    it('sanitizes and truncates text messages over 200 characters', () => {
      const longText = 'A'.repeat(250);
      const res = validateDataMessage({ type: 'text', text: longText, ts: Date.now() });
      expect(res).not.toBeNull();
      expect(res?.type).toBe('text');
      if (res?.type === 'text') {
        expect(res.text.length).toBe(200);
      }
    });

    it('rejects non-object or malformed messages', () => {
      expect(validateDataMessage(null)).toBeNull();
      expect(validateDataMessage(undefined)).toBeNull();
      expect(validateDataMessage('hello')).toBeNull();
      expect(validateDataMessage(123)).toBeNull();
      expect(validateDataMessage({ type: 'invalid' })).toBeNull();
    });
  });

  describe('Rate Limiter', () => {
    it('allows up to 5 messages per second and throttles excess', () => {
      const limiter = new MessageRateLimiter(5);
      const now = 10000;

      // First 5 messages succeed
      for (let i = 0; i < 5; i++) {
        expect(limiter.canAcceptMessage(now)).toBe(true);
      }
      // 6th message within the same second is throttled
      expect(limiter.canAcceptMessage(now)).toBe(false);

      // 1.1s later, messages are allowed again
      expect(limiter.canAcceptMessage(now + 1100)).toBe(true);
    });
  });

  describe('Localized Phrase Translation', () => {
    it('translates known keys accurately to English, Hindi, and Marathi', () => {
      const helloEn = getLocalizedPhrase('hello', 'en');
      expect(helloEn.text).toBe('Hello');
      expect(helloEn.icon).toBe('👋');

      const helloHi = getLocalizedPhrase('hello', 'hi');
      expect(helloHi.text).toBe('नमस्ते');

      const helloMr = getLocalizedPhrase('hello', 'mr');
      expect(helloMr.text).toBe('नमस्कार');

      const thanksHi = getLocalizedPhrase('thanks', 'hi');
      expect(thanksHi.text).toBe('धन्यवाद');

      const yesMr = getLocalizedPhrase('yes', 'mr');
      expect(yesMr.text).toBe('हो');
    });

    it('covers all standard phrase keys', () => {
      for (const key of VALID_PHRASE_KEYS) {
        const transEn = getLocalizedPhrase(key, 'en');
        const transHi = getLocalizedPhrase(key, 'hi');
        const transMr = getLocalizedPhrase(key, 'mr');
        expect(transEn.text).toBeTruthy();
        expect(transHi.text).toBeTruthy();
        expect(transMr.text).toBeTruthy();
      }
    });
  });

  describe('Call Code Generation', () => {
    it('generates an 8-character uppercase alphanumeric code', () => {
      const code = generateCallCode();
      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
      // Ensures no ambiguous characters like 0 or O
      expect(code.includes('0')).toBe(false);
      expect(code.includes('O')).toBe(false);
    });
  });
});
