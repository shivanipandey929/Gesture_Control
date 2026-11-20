import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/syncService';
import { BarChart2, Trash2, Cloud } from 'lucide-react';
import { AnalyticsHeroVisual } from './analytics/AnalyticsHeroVisual';
import { AnalyticsKpiCards } from './analytics/AnalyticsKpiCards';
import { RecentActionsTable } from './analytics/RecentActionsTable';
import { FeedbackForm } from './analytics/FeedbackForm';
import { ClearHistoryModal } from './analytics/ClearHistoryModal';

// Lazy-load recharts and chart visualizers only when Analytics is rendered
const AnalyticsCharts = lazy(() =>
  import('./analytics/AnalyticsCharts').then((m) => ({ default: m.AnalyticsCharts }))
);

// Track app session start time
const SESSION_START_TIME = Date.now();

export const Analytics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Formatter helpers
  const formatNumber = (num: number) => {
    try {
      return new Intl.NumberFormat(i18n.language).format(num);
    } catch {
      return String(num);
    }
  };

  const formatTime = (ts: number) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleTimeString();
    }
  };

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('General');
  const [comments, setComments] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Live query on real Dexie database events (ONLY real telemetry from IndexedDB)
  const liveEvents = useLiveQuery(
    () => db.gestureEvents.orderBy('timestamp').reverse().toArray(),
    []
  );

  // Compute live metrics dynamically from real IndexedDB events
  const {
    totalCount,
    sessionCount,
    avgConfidence,
    mostUsed,
    gestureDistribution,
    weeklyActivity,
    recentActions,
  } = useMemo(() => {
    const events = liveEvents ?? [];
    if (!events || events.length === 0) {
      return {
        totalCount: 0,
        sessionCount: 0,
        avgConfidence: 0,
        mostUsed: 'None',
        gestureDistribution: [],
        weeklyActivity: [
          { day: 'Mon', count: 0 },
          { day: 'Tue', count: 0 },
          { day: 'Wed', count: 0 },
          { day: 'Thu', count: 0 },
          { day: 'Fri', count: 0 },
          { day: 'Sat', count: 0 },
          { day: 'Sun', count: 0 },
        ],
        recentActions: [],
      };
    }

    const total = events.length;
    const sessionEvents = events.filter((e) => e.timestamp >= SESSION_START_TIME);
    const confSum = events.reduce((acc, curr) => acc + (curr.confidence || 0.85), 0);
    const avgConf = Math.round((confSum / total) * 100);

    // Distribution by gesture
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const name = e.gesture.replace('_', ' ');
      counts[name] = (counts[name] || 0) + 1;
    });

    const dist = Object.entries(counts).map(([name, count]) => ({ name, count }));
    dist.sort((a, b) => b.count - a.count);
    const topGesture = dist.length > 0 ? dist[0].name : 'None';

    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    events.forEach((e) => {
      const d = new Date(e.timestamp).getDay();
      dayCounts[d]++;
    });

    const weekly = days.map((day, i) => ({ day, count: dayCounts[i] }));

    return {
      totalCount: total,
      sessionCount: sessionEvents.length,
      avgConfidence: avgConf,
      mostUsed: topGesture,
      gestureDistribution: dist,
      weeklyActivity: weekly,
      recentActions: events.slice(0, 8),
    };
  }, [liveEvents]);

  // Handle Clear Data (User action only)
  const handleClearData = async () => {
    await db.gestureEvents.clear();
  };

  // Handle Supabase Cloud Sync
  const handleSyncNow = async () => {
    if (!user) {
      alert('Please sign in to sync records with Supabase Cloud.');
      return;
    }
    setIsSyncing(true);
    await syncService.syncAll(user.id);
    setIsSyncing(false);
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    if (supabase) {
      try {
        await supabase.from('feedback').insert({
          user_id: user?.id || null,
          rating,
          category,
          comments: comments.trim(),
        });
      } catch (err) {
        console.warn('Feedback send error:', err);
      }
    }

    setFeedbackSent(true);
    setComments('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F0F6FF] via-[#F8FAFC] to-[#EEF5FF] dark:from-[#0B152B] dark:via-[#0F172A] dark:to-[#0B1324] select-none font-body transition-colors duration-300">
      {/* Decorative Wave Ambient Lines in Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-blue-300/15 dark:bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-40 left-10 w-[450px] h-[300px] bg-indigo-300/15 dark:bg-blue-600/10 rounded-full blur-[90px]" />
        <svg
          className="absolute top-10 inset-x-0 w-full h-44 text-blue-200/25 dark:text-blue-900/15"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M 0,80 C 320,160 540,20 860,110 C 1180,200 1360,50 1440,80" />
          <path d="M 0,110 C 280,30 620,170 940,60 C 1220,-20 1380,120 1440,90" opacity="0.6" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* ======================================================== */}
        {/* 1. HEADER SECTION (Title, Captions & Cyber Tablet Visual) */}
        {/* ======================================================== */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
          {/* Left: Titles & Subtitles */}
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-heading font-semibold text-primary">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{t('analyticsPage.badge', 'Telemetry & Usage Metrics')}</span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-foreground tracking-tight">
              {t('analyticsPage.titlePrefix', 'Gesture')}{' '}
              <span className="text-[#1D63E8]">{t('analyticsPage.titleSuffix', 'Analytics & Insights')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {t('analyticsPage.desc', 'Real measured telemetry stored locally in IndexedDB with optional Supabase cloud sync.')}
            </p>
          </div>

          {/* Center/Right: Holographic Cyber Hand & 3D Glass Tablet Visual + Clear History */}
          <div className="flex items-center gap-4 self-end lg:self-auto w-full lg:w-auto justify-between lg:justify-end">
            <div className="hidden md:block">
              <AnalyticsHeroVisual />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-blue-900/40 text-xs font-heading font-bold text-slate-700 dark:text-slate-200 shadow-soft hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                title={t('analyticsPage.clearHistory', 'Clear History')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('analyticsPage.clearHistory', 'Clear History')}</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1D63E8] hover:bg-[#1554c9] text-white font-heading text-xs font-bold transition-all shadow-[0_6px_16px_rgba(29,99,232,0.3)] disabled:opacity-50"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. KPI SUMMARY CARDS (4 Columns)                          */}
        {/* ======================================================== */}
        <AnalyticsKpiCards
          sessionCount={sessionCount}
          totalCount={totalCount}
          avgConfidence={avgConfidence}
          topGesture={mostUsed}
          formatNumber={formatNumber}
        />

        {/* ======================================================== */}
        {/* 3. ANALYTICS CHARTS (Weekly Usage & Frequency Breakdown)  */}
        {/* ======================================================== */}
        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center p-8 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 text-xs text-muted font-mono">
              Loading analytics visualization...
            </div>
          }
        >
          <AnalyticsCharts
            weeklyData={weeklyActivity}
            gestureData={gestureDistribution}
            totalCount={totalCount}
          />
        </Suspense>

        {/* ======================================================== */}
        {/* 4. RECENT ACTIONS TABLE & DEVELOPER FEEDBACK             */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
          {/* Left Column: Recent Fired Actions (7 cols) */}
          <div className="lg:col-span-7">
            <RecentActionsTable
              recentActions={recentActions}
              formatTime={formatTime}
            />
          </div>

          {/* Right Column: Send Developer Feedback (5 cols) */}
          <div className="lg:col-span-5">
            <FeedbackForm
              rating={rating}
              setRating={setRating}
              category={category}
              setCategory={setCategory}
              comments={comments}
              setComments={setComments}
              feedbackSent={feedbackSent}
              onSubmit={handleFeedbackSubmit}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear History */}
      <ClearHistoryModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearData}
      />
    </div>
  );
};

export default Analytics;
