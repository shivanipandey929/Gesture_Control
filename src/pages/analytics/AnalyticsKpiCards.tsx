import React from 'react';
import { Clock, Database, TrendingUp, Trophy } from 'lucide-react';

interface AnalyticsKpiCardsProps {
  sessionCount: number;
  totalCount: number;
  avgConfidence: number;
  topGesture: string;
  formatNumber: (n: number) => string;
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({
  sessionCount,
  totalCount,
  avgConfidence,
  topGesture,
  formatNumber,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. This Session */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_10px_30px_rgba(29,99,232,0.05)] hover:shadow-[0_15px_35px_rgba(29,99,232,0.1)] transition-all duration-300 hover:-translate-y-0.5 group">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#1D63E8] dark:text-sky-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-xs font-heading font-bold text-slate-600 dark:text-slate-300">This Session</span>
            </div>
            <div className="pt-2">
              <span className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight block">
                {formatNumber(sessionCount)}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Actions fired now</span>
            </div>
          </div>

          {/* Right Visual: Holographic Audio Frequency Waveform */}
          <div className="pt-3 pr-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <svg className="w-16 h-10 text-primary/70 dark:text-sky-400" viewBox="0 0 64 36" fill="currentColor">
              <rect x="2" y="14" width="3" height="8" rx="1.5" className="animate-pulse" />
              <rect x="9" y="10" width="3" height="16" rx="1.5" />
              <rect x="16" y="6" width="3" height="24" rx="1.5" className="animate-pulse" />
              <rect x="23" y="12" width="3" height="12" rx="1.5" />
              <rect x="30" y="2" width="3" height="32" rx="1.5" className="text-blue-500" />
              <rect x="37" y="8" width="3" height="20" rx="1.5" />
              <rect x="44" y="13" width="3" height="10" rx="1.5" className="animate-pulse" />
              <rect x="51" y="7" width="3" height="22" rx="1.5" />
              <rect x="58" y="15" width="3" height="6" rx="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Total Gestures */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_10px_30px_rgba(29,99,232,0.05)] hover:shadow-[0_15px_35px_rgba(29,99,232,0.1)] transition-all duration-300 hover:-translate-y-0.5 group">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#0D9488] dark:text-teal-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </span>
              <span className="text-xs font-heading font-bold text-slate-600 dark:text-slate-300">Total Gestures</span>
            </div>
            <div className="pt-2">
              <span className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight block">
                {formatNumber(totalCount)}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">IndexedDB events</span>
            </div>
          </div>

          {/* Right Visual: Neon Hand Scan Brackets */}
          <div className="pt-2 pr-1 opacity-75 group-hover:opacity-100 transition-opacity">
            <div className="relative w-12 h-12 rounded-xl border border-teal-400/40 dark:border-teal-400/60 flex items-center justify-center bg-teal-50/50 dark:bg-teal-950/30">
              <span className="text-xl">✋</span>
              {/* Corner scan marks */}
              <span className="absolute top-0.5 left-0.5 w-2 h-2 border-t-2 border-l-2 border-teal-500" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 border-t-2 border-r-2 border-teal-500" />
              <span className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b-2 border-l-2 border-teal-500" />
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b-2 border-r-2 border-teal-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Avg Confidence */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_10px_30px_rgba(29,99,232,0.05)] hover:shadow-[0_15px_35px_rgba(29,99,232,0.1)] transition-all duration-300 hover:-translate-y-0.5 group">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-[#EC4899] dark:text-pink-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs font-heading font-bold text-slate-600 dark:text-slate-300">Avg Confidence</span>
            </div>
            <div className="pt-2">
              <span className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight block">
                {formatNumber(avgConfidence)}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Measured confidence</span>
            </div>
          </div>

          {/* Right Visual: Rising Green Sparkline with upward arrow */}
          <div className="pt-2 pr-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-16 h-10 overflow-visible" viewBox="0 0 60 36" fill="none">
              <path
                d="M 2,28 C 15,28 25,18 35,22 C 45,26 50,8 56,4"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 50,4 L 56,4 L 56,10"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Top Gesture */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_10px_30px_rgba(29,99,232,0.05)] hover:shadow-[0_15px_35px_rgba(29,99,232,0.1)] transition-all duration-300 hover:-translate-y-0.5 group">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </span>
              <span className="text-xs font-heading font-bold text-slate-600 dark:text-slate-300">Top Gesture</span>
            </div>
            <div className="pt-2">
              <span className="font-heading font-black text-xl sm:text-2xl text-primary tracking-tight block truncate">
                {topGesture}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Most frequent pose</span>
            </div>
          </div>

          {/* Right Visual: Blue Circle with Hand Pose Icon */}
          <div className="pt-1 pr-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] shadow-[0_8px_18px_rgba(37,99,235,0.35)] flex items-center justify-center text-white text-xl">
              {topGesture.toLowerCase().includes('fist') ? '✊' :
                topGesture.toLowerCase().includes('palm') ? '✋' :
                  topGesture.toLowerCase().includes('point') ? '☝️' :
                    topGesture.toLowerCase().includes('thumb') ? '👍' :
                      topGesture.toLowerCase().includes('victory') ? '✌️' : '🖐️'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
