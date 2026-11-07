import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Zap, 
  Gamepad2, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-6 shadow-glow-cyan/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Local MediaPipe Vision AI • 100% Offline • Zero CDN</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight max-w-4xl text-white mb-6"
        >
          Control Your Web Apps With{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            Air Gestures
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          Transform any webcam into a touchless control pad. Powered by sub-millisecond One-Euro smoothed landmark tracking, velocity swipes, and offline AI execution.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            to="/studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-heading font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-glow-cyan text-base"
          >
            <Video className="w-5 h-5 text-slate-950" />
            Launch Live Studio
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            to="/modes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-heading font-semibold text-slate-200 glass-panel border border-slate-700/80 hover:bg-slate-800/80 hover:text-white transition-all text-base"
          >
            <Gamepad2 className="w-5 h-5 text-violet-400" />
            Explore Workspaces
          </Link>
        </motion.div>

        {/* Quick Tech Specs Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 w-full max-w-4xl"
        >
          {[
            { label: 'Landmark Points', val: '21 Points' },
            { label: 'Smoothing', val: '1€ Adaptive Filter' },
            { label: 'Execution', val: 'Client WASM Only' },
            { label: 'Latency', val: '< 16 ms' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl glass-panel border border-slate-800/80 text-center">
              <div className="font-heading font-bold text-lg text-cyan-300">{stat.val}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white mb-3">
            Engineered for Precision & Absolute Privacy
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Everything runs in your browser tab. Your camera stream never leaves your device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-700/60 flex items-center justify-center mb-4 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-white mb-2">
              100% Offline & Private
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No cloud inferences, no external video transmission, and zero CDN dependencies. The neural model runs directly via WebAssembly in browser memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 hover:border-violet-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-950/60 border border-violet-700/60 flex items-center justify-center mb-4 text-violet-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-white mb-2">
              Jitter-Free One-Euro Filtering
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Adaptive low-pass frequency filtering eliminates micro-jitter while preserving razor-sharp responsiveness for rapid flick swipes and precision pointing.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-700/60 flex items-center justify-center mb-4 text-cyan-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-white mb-2">
              4 Dynamic Workspaces
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ready-to-use gesture experiences: slide presentation deck, interactive media player, long-form document reader, and virtual hover pointer pad.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

