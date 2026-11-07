import React from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Video, ArrowRight, ShieldCheck } from 'lucide-react';

export const OfflineFallback: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-amber-950/60 border border-amber-600/70 flex items-center justify-center text-amber-400 mb-6 shadow-lg animate-pulse">
        <WifiOff className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>100% Offline Architecture Active</span>
      </div>

      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-3">
        You're Currently Offline
      </h1>
      <p className="text-slate-400 text-sm leading-relaxed mb-8">
        No internet connection detected, but don't worry: AeroTouch's MediaPipe AI vision models, WebAssembly runtimes, and local gesture workspaces are cached and run entirely on your device!
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          to="/studio"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-sm shadow-glow-cyan"
        >
          <Video className="w-4 h-4 text-slate-950" />
          Open Live Studio (Offline)
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/modes"
          className="w-full sm:w-auto px-6 py-3 rounded-xl glass-panel border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800"
        >
          Explore Workspaces
        </Link>
      </div>
    </div>
  );
};

