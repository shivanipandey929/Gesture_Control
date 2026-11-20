import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import {
  LANGUAGES,
  POPULAR_LANGUAGES,
  OTHER_LANGUAGES,
  getLanguage,
  type LanguageMeta,
} from '../../i18n/languages';
import { changeAppLanguage } from '../../i18n';

interface LanguagePickerProps {
  variant?: 'navbar' | 'inline' | 'compact';
  onSelect?: (code: string) => void;
  className?: string;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  variant = 'navbar',
  onSelect,
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const currentLang: LanguageMeta = useMemo(() => {
    return getLanguage(i18n.language);
  }, [i18n.language]);

  // Filter languages by search query (matching code, English name, or native name)
  const { popularFiltered, otherFiltered, totalCount } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        popularFiltered: POPULAR_LANGUAGES,
        otherFiltered: OTHER_LANGUAGES,
        totalCount: LANGUAGES.length,
      };
    }

    const matches = (l: LanguageMeta) =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.script.toLowerCase().includes(q);

    const popular = POPULAR_LANGUAGES.filter(matches);
    const others = OTHER_LANGUAGES.filter(matches);

    return {
      popularFiltered: popular,
      otherFiltered: others,
      totalCount: popular.length + others.length,
    };
  }, [searchQuery]);

  const flatFilteredList = useMemo(() => {
    return [...popularFiltered, ...otherFiltered];
  }, [popularFiltered, otherFiltered]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < flatFilteredList.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatFilteredList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatFilteredList.length) {
        handleSelectLanguage(flatFilteredList[activeIndex].code);
      }
    }
  };

  const handleSelectLanguage = async (code: string) => {
    await changeAppLanguage(code);
    setIsOpen(false);
    if (onSelect) onSelect(code);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-start ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm focus-visible:outline-indigo-500"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t('languagePicker.selectLanguage', 'Select Language')}
          title={t('languagePicker.selectLanguage', 'Select Language')}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-semibold">{currentLang.nativeName}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {variant === 'inline' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div className="text-start">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {currentLang.nativeName}{' '}
                <span className="text-slate-500 font-normal">({currentLang.name})</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {t('languagePicker.selectLanguage', 'Select interface language (23 supported)')}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{currentLang.code.toUpperCase()}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-elevated overflow-hidden animate-fade-in right-0"
          role="listbox"
          aria-label="Languages"
        >
          {/* Search Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'languagePicker.searchPlaceholder',
                  'Search language or script...'
                )}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                aria-label="Search languages"
              />
            </div>
          </div>

          {/* Languages List Scroll Area */}
          <div
            ref={listRef}
            className="max-h-72 sm:max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40"
          >
            {totalCount === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No languages found matching "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Popular Group */}
                {popularFiltered.length > 0 && (
                  <div className="pb-2">
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-500 dark:text-cyan-400 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>{t('languagePicker.popular', 'Popular')}</span>
                    </div>
                    {popularFiltered.map((lang) => {
                      const isSelected = i18n.language === lang.code;
                      const isFull = ['en', 'hi', 'mr'].includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-start transition-colors group ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          aria-selected={isSelected}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium leading-tight">
                                {lang.nativeName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  isFull
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {isFull ? 'Full' : 'Beta'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-body">
                              {lang.name}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* All Languages Alphabetical */}
                {otherFiltered.length > 0 && (
                  <div className="pt-2">
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      {t('languagePicker.allLanguages', 'All Languages')}
                    </div>
                    {otherFiltered.map((lang) => {
                      const isSelected = i18n.language === lang.code;
                      const isFull = ['en', 'hi', 'mr'].includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-start transition-colors group ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          aria-selected={isSelected}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium leading-tight">
                                {lang.nativeName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  isFull
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {isFull ? 'Full' : 'Beta'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-body">
                              {lang.name}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Explanatory Note for Beta Languages */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Language Coverage:</span> Beta languages are machine-translated and partly covered. English, Hindi, and Marathi provide full human-verified coverage.
          </div>
        </div>
      )}
    </div>
  );
};
