import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, MessageSquare, AlertCircle } from 'lucide-react';

export interface BoardPhrase {
  id: string;
  category: 'needs' | 'feelings' | 'questions';
  icon: string;
  textEn: string;
  textHi: string;
  textMr: string;
}

const BOARD_PHRASES: BoardPhrase[] = [
  // Needs
  { id: 'water', category: 'needs', icon: '💧', textEn: 'I need water', textHi: 'मुझे पानी चाहिए', textMr: 'मला पाणी हवे आहे' },
  { id: 'food', category: 'needs', icon: '🍲', textEn: 'I am hungry / food', textHi: 'मुझे भूख लगी है / खाना', textMr: 'मला भूक लागली आहे' },
  { id: 'help', category: 'needs', icon: '🆘', textEn: 'Please help me', textHi: 'कृपया मेरी मदद करें', textMr: 'कृपया मला मदत करा' },
  { id: 'rest', category: 'needs', icon: '🛏️', textEn: 'I need to rest', textHi: 'मुझे आराम करना है', textMr: 'मला विश्रांती हवी आहे' },
  { id: 'washroom', category: 'needs', icon: '🚻', textEn: 'Washroom / Restroom', textHi: 'शौचालय जाना है', textMr: 'शौचालय' },
  { id: 'medicine', category: 'needs', icon: '💊', textEn: 'Medicine time', textHi: 'दवाई का समय', textMr: 'औषध हवे आहे' },

  // Feelings
  { id: 'happy', category: 'feelings', icon: '😊', textEn: 'I feel good / happy', textHi: 'मुझे अच्छा लग रहा है', textMr: 'मला बरे वाटत आहे' },
  { id: 'tired', category: 'feelings', icon: '🥱', textEn: 'I am very tired', textHi: 'मैं बहुत थक गया हूँ', textMr: 'मी खूप थकलो आहे' },
  { id: 'pain', category: 'feelings', icon: '🤕', textEn: 'I am in pain', textHi: 'मुझे दर्द हो रहा है', textMr: 'मला त्रास होत आहे' },
  { id: 'cold', category: 'feelings', icon: '🥶', textEn: 'I feel cold', textHi: 'मुझे ठंड लग रही है', textMr: 'मला थंडी वाजत आहे' },
  { id: 'warm', category: 'feelings', icon: '🥵', textEn: 'I feel hot / warm', textHi: 'मुझे गर्मी लग रही है', textMr: 'मला गरम होत आहे' },
  { id: 'thankyou', category: 'feelings', icon: '🙏', textEn: 'Thank you very much', textHi: 'आपका बहुत-बहुत धन्यवाद', textMr: 'खूप खूप धन्यवाद' },

  // Questions
  { id: 'time', category: 'questions', icon: '⏰', textEn: 'What time is it?', textHi: 'कितने बजे हैं?', textMr: 'किती वाजले आहेत?' },
  { id: 'who', category: 'questions', icon: '👤', textEn: 'Who is there?', textHi: 'वहाँ कौन है?', textMr: 'तिथे कोण आहे?' },
  { id: 'where', category: 'questions', icon: '📍', textEn: 'Where are we going?', textHi: 'हम कहाँ जा रहे हैं?', textMr: 'आपण कुठे जात आहोत?' },
  { id: 'yes', category: 'questions', icon: '👍', textEn: 'Yes, absolutely', textHi: 'हाँ, बिल्कुल', textMr: 'हो, नक्कीच' },
  { id: 'no', category: 'questions', icon: '👎', textEn: 'No, thank you', textHi: 'नहीं, धन्यवाद', textMr: 'नाही, धन्यवाद' },
  { id: 'ok', category: 'questions', icon: '👌', textEn: 'Everything is OK', textHi: 'सब ठीक है', textMr: 'सर्व ठीक आहे' },
];

export const PhraseBoardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [activeCategory, setActiveCategory] = useState<'needs' | 'feelings' | 'questions'>('needs');
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [dwellItem, setDwellItem] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const dwellTimerRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const speakPhrase = (phrase: BoardPhrase) => {
    const text = currentLang.startsWith('hi')
      ? phrase.textHi
      : currentLang.startsWith('mr')
      ? phrase.textMr
      : phrase.textEn;

    setLastSpoken(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang.startsWith('hi') ? 'hi-IN' : currentLang.startsWith('mr') ? 'mr-IN' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  const handleMouseEnter = (phrase: BoardPhrase) => {
    setDwellItem(phrase.id);
    let progress = 0;
    const interval = 50;
    const duration = 1200; // 1.2s dwell auto-speak

    const timer = window.setInterval(() => {
      progress += interval / duration;
      setDwellProgress(Math.min(1, progress));
      if (progress >= 1) {
        clearInterval(timer);
        speakPhrase(phrase);
      }
    }, interval);

    dwellTimerRef.current = timer;
  };

  const handleMouseLeave = () => {
    setDwellItem(null);
    setDwellProgress(0);
    if (dwellTimerRef.current) {
      clearInterval(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  };

  const filtered = BOARD_PHRASES.filter((p) => p.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-elevated space-y-5 animate-in zoom-in-95 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                {t('phraseBoard.title', 'Assistive Phrase Board')}
              </h3>
              <p className="text-xs text-muted">
                {t('phraseBoard.subtitle', 'Tap, click, or dwell for 1.2s with pointer to speak aloud offline')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-secondary text-muted">
            ✕
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-surface-secondary border border-border">
          {(['needs', 'feelings', 'questions'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2 rounded-xl text-xs font-heading font-semibold capitalize transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-soft font-bold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {cat === 'needs' ? 'Needs 💧' : cat === 'feelings' ? 'Feelings 😊' : 'Questions ❓'}
            </button>
          ))}
        </div>

        {/* Phrases Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((phrase) => {
            const isHovered = dwellItem === phrase.id;
            const text = currentLang.startsWith('hi')
              ? phrase.textHi
              : currentLang.startsWith('mr')
              ? phrase.textMr
              : phrase.textEn;

            return (
              <button
                key={phrase.id}
                onClick={() => speakPhrase(phrase)}
                onMouseEnter={() => handleMouseEnter(phrase)}
                onMouseLeave={handleMouseLeave}
                className="relative p-4 rounded-2xl bg-surface-secondary/70 hover:bg-surface border border-border hover:border-primary/50 text-left transition-all flex flex-col justify-between min-h-[90px] shadow-xs active:scale-95 overflow-hidden"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{phrase.icon}</span>
                  <Volume2 className="w-3.5 h-3.5 text-muted opacity-60" />
                </div>
                <div className="font-heading font-bold text-xs text-foreground mt-2 leading-snug">
                  {text}
                </div>

                {/* Dwell Progress Bar */}
                {isHovered && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/20">
                    <div
                      style={{ width: `${dwellProgress * 100}%` }}
                      className="h-full bg-primary transition-all duration-75"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Last Spoken Caption */}
        {lastSpoken && (
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-2.5 text-primary text-xs font-heading font-bold animate-in fade-in">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Spoken: &quot;{lastSpoken}&quot;</span>
          </div>
        )}

        {/* Honest Medical Disclaimer */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {t(
              'phraseBoard.disclaimer',
              'Accessibility Communication Aid: AeroTouch Phrase Board is an assistive communication utility designed to aid daily touchless interactions. It is not a certified medical device and should not be used as a replacement for emergency healthcare systems.'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
