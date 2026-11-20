import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Calendar, BarChart2 } from 'lucide-react';

// Specific colors matching the reference design
export const GESTURE_COLORS: Record<string, string> = {
  'Closed Fist': '#6366F1',
  'Open Palm': '#06B6D4',
  'Pointing Up': '#F43F5E',
  'Victory': '#3B82F6',
  'Thumb Up': '#10B981',
  'Thumb Down': '#F59E0B',
};

const FALLBACK_COLORS = ['#6366F1', '#06B6D4', '#F43F5E', '#3B82F6', '#10B981', '#F59E0B'];

interface WeeklyPoint {
  day: string;
  count: number;
}

interface DistributionItem {
  name: string;
  count: number;
}

interface AnalyticsChartsProps {
  weeklyData: WeeklyPoint[];
  gestureData: DistributionItem[];
  totalCount: number;
}

// Custom tooltip for Weekly Usage Trajectory Area Chart
const CustomWeeklyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#1E293B]/95 border border-blue-200/60 dark:border-blue-800 shadow-card text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#1D63E8]" />
        <span>{label}:</span>
        <span className="text-primary font-black">{payload[0].value} actions</span>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Frequency Bar Chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#1E293B]/95 border border-blue-200/60 dark:border-blue-800 shadow-card text-xs font-heading font-semibold text-foreground flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: GESTURE_COLORS[label] || '#1D63E8' }}
        />
        <span>{label}:</span>
        <span className="font-mono font-black text-primary">{payload[0].value} events</span>
      </div>
    );
  }
  return null;
};

// Customized Label to render exact counts above each bar
const renderCustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="currentColor"
      textAnchor="middle"
      className="text-[11px] font-mono font-bold fill-slate-700 dark:fill-slate-200"
    >
      {value}
    </text>
  );
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  weeklyData,
  gestureData,
  totalCount,
}) => {
  // Compute percentage breakdown for donut chart
  const pieData = gestureData.map((g, idx) => ({
    name: g.name,
    value: g.count,
    color: GESTURE_COLORS[g.name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    pct: totalCount > 0 ? Math.round((g.count / totalCount) * 100) : 0,
  }));

  // Reorder weekly data to start Monday (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const orderedWeekly = React.useMemo(() => {
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map = new Map(weeklyData.map((d) => [d.day, d.count]));
    return daysOrder.map((day) => ({ day, count: map.get(day) || 0 }));
  }, [weeklyData]);

  // Max value for YAxis domain
  const maxWeekly = Math.max(...orderedWeekly.map((d) => d.count), 60);
  const yMax = Math.ceil(maxWeekly / 20) * 20;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 1. Weekly Usage Trajectory (Area Chart) - 6 or 5 cols */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_15px_35px_rgba(29,99,232,0.06)] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/30">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Weekly Usage Trajectory</span>
          </div>
          {totalCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-primary font-mono text-[11px] font-bold">
              {totalCount} actions
            </span>
          )}
        </div>

        <div className="h-64 w-full pt-4 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={orderedWeekly} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D63E8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1D63E8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <YAxis
                domain={[0, yMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomWeeklyTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1D63E8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#usageGradient)"
                activeDot={{ r: 6, fill: '#1D63E8', stroke: '#FFFFFF', strokeWidth: 2 }}
                dot={{ r: 3, fill: '#1D63E8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Gesture Frequency Breakdown (Bar Chart + Donut Split) - 7 cols */}
      <div className="lg:col-span-7 p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_15px_35px_rgba(29,99,232,0.06)] flex flex-col justify-between min-w-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/30">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span>Gesture Frequency Breakdown</span>
          </div>
          <span className="text-xs font-mono text-muted">Real telemetry counts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 min-w-0">
          {/* Vertical Bars Column (Left 7 cols) */}
          <div className="md:col-span-7 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gestureData} margin={{ top: 22, right: 10, left: -25, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fontSize: 9.5, fill: '#64748B', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  label={renderCustomBarLabel}
                >
                  {gestureData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={GESTURE_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart & Legend Column (Right 5 cols) - Matches Mockup */}
          <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col items-center justify-center gap-3 py-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-blue-900/30 pl-0 md:pl-4">
            {/* Donut Chart with Total in Center */}
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-heading font-black text-base text-foreground leading-none">{totalCount}</span>
                <span className="text-[10px] uppercase font-bold text-muted">Total</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1 w-full max-w-[180px] text-[11px] font-heading">
              {pieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-muted">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground shrink-0">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
