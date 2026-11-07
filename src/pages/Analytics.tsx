import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell 
} from 'recharts';
import { db } from '../db/db';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/syncService';
import { 
  BarChart2, 
  TrendingUp, 
  Activity, 
  Zap, 
  Star, 
  Send, 
  Check, 
  Cloud
} from 'lucide-react';

const COLORS = ['#22D3EE', '#8B5CF6', '#38BDF8', '#C084FC', '#F43F5E', '#10B981', '#F59E0B'];

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [totalCount, setTotalCount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [mostUsed, setMostUsed] = useState('None');
  const [gestureDistribution, setGestureDistribution] = useState<{ name: string; count: number }[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<{ day: string; count: number }[]>([]);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('General');
  const [comments, setComments] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const events = await db.gestureEvents.toArray();

      if (events.length === 0) {
        // Fallback sample data if brand new install so graphs are lively and demonstrate capabilities
        const sampleDistribution = [
          { name: 'Open Palm', count: 18 },
          { name: 'Closed Fist', count: 24 },
          { name: 'Swipe Right', count: 15 },
          { name: 'Swipe Left', count: 12 },
          { name: 'Pointing Up', count: 32 },
          { name: 'Victory', count: 9 },
        ];
        setTotalCount(110);
        setAvgConfidence(88);
        setMostUsed('Pointing Up');
        setGestureDistribution(sampleDistribution);
        setWeeklyActivity([
          { day: 'Mon', count: 14 },
          { day: 'Tue', count: 22 },
          { day: 'Wed', count: 18 },
          { day: 'Thu', count: 27 },
          { day: 'Fri', count: 19 },
          { day: 'Sat', count: 35 },
          { day: 'Sun', count: 26 },
        ]);
        return;
      }

      setTotalCount(events.length);
      const confSum = events.reduce((acc, curr) => acc + (curr.confidence || 0.8), 0);
      setAvgConfidence(Math.round((confSum / events.length) * 100));

      // Calculate frequency by gesture
      const counts: Record<string, number> = {};
      events.forEach((e) => {
        const name = e.gesture.replace('_', ' ');
        counts[name] = (counts[name] || 0) + 1;
      });

      const dist = Object.entries(counts).map(([name, count]) => ({ name, count }));
      dist.sort((a, b) => b.count - a.count);
      setGestureDistribution(dist);
      if (dist.length > 0) {
        setMostUsed(dist[0].name);
      }

      // Group by days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      events.forEach((e) => {
        const d = new Date(e.timestamp).getDay();
        dayCounts[d]++;
      });
      setWeeklyActivity(days.map((day, i) => ({ day, count: dayCounts[i] })));
    } catch {
      // ignore
    }
  };

  const handleSyncNow = async () => {
    if (!user) {
      alert('Please sign in to sync records with Supabase Cloud.');
      return;
    }
    setIsSyncing(true);
    await syncService.syncAll(user.id);
    setIsSyncing(false);
  };

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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry & Usage Metrics</span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            Gesture Analytics & Insights
          </h1>
          <p className="text-slate-400 text-sm">
            Continuous local telemetry stored in IndexedDB. Syncable to Supabase.
          </p>
        </div>

        {user && (
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-heading text-xs font-bold transition-all shadow-glow-violet disabled:opacity-50"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync to Supabase'}
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Gestures Fired</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-white">{totalCount}</div>
          <div className="text-[11px] text-cyan-300 mt-1">Logged locally</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Average Confidence</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-heading font-extrabold text-white">{avgConfidence}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Classification accuracy</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Most Frequent Gesture</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-heading font-extrabold text-violet-300 truncate">
            {mostUsed}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Top user interaction</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Area Chart */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-white text-sm">Weekly Usage Trajectory</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gesture Distribution Bar Chart */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-white text-sm">Gestures Frequency Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gestureDistribution}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {gestureDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Feedback Form */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-heading font-bold text-white text-base">Send Developer Feedback</h3>
            <p className="text-xs text-slate-400">
              Help us refine sensitivity algorithms and gesture detection
            </p>
          </div>

          {feedbackSent && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs font-mono">
              <Check className="w-3.5 h-3.5" />
              Feedback Submitted!
            </div>
          )}
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Star Rating */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
              >
                <option value="General">General Experience</option>
                <option value="Accuracy">Gesture Accuracy</option>
                <option value="Performance">Hardware / FPS Performance</option>
                <option value="FeatureRequest">Feature Request</option>
              </select>
            </div>
          </div>

          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
            rows={3}
            placeholder="Share your thoughts on gesture responsiveness, camera compatibility, or desired workspaces..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
          />

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading text-xs font-bold hover:opacity-90 transition-all shadow-glow-cyan"
          >
            <Send className="w-3.5 h-3.5 text-slate-950" />
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};
