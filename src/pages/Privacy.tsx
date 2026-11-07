import React from 'react';
import { ShieldCheck, EyeOff, Cpu, ServerOff, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-xs font-mono text-emerald-300 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Cloud Privacy Policy</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white mb-3">
          Privacy Policy & Video Architecture
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          At AeroTouch, our core principle is mathematical: <strong>Your camera stream never leaves your device memory buffer.</strong>
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl glass-panel-glow border border-cyan-500/30 flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700 flex items-center justify-center text-cyan-400">
            <ServerOff className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-white">Zero Video Uploads</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No video frames, still images, or camera recordings are ever uploaded to any server, cloud provider, or third party. Video frames exist only temporarily in volatile client RAM during HTML5 canvas rendering.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel-glow border border-violet-500/30 flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-950/80 border border-violet-700 flex items-center justify-center text-violet-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-white">Local WebAssembly Inference</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The neural vision model (`gesture_recognizer.task`) and Google MediaPipe runtime are compiled into WebAssembly (`.wasm`) binaries stored directly in your browser's CacheStorage and executed by your local CPU/GPU.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel-glow border border-emerald-500/30 flex flex-col gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400">
            <EyeOff className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-white">Local Storage by Default</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By default, all custom gestures, sessions, and settings reside strictly in your browser's private IndexedDB database. Optional Supabase cloud synchronization transmits only coordinate metadata (never video) and requires explicit account creation.
          </p>
        </div>
      </div>

      {/* Detailed Technical Statement */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
        <h2 className="font-heading font-bold text-xl text-white">Technical Privacy Guarantee</h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm mb-1">1. Monocular WebRTC Permissions</h4>
            <p className="text-slate-400">
              When you grant browser camera access, standard browser security policies isolate the media stream within the page's sandbox. The browser displays a hardware indicator (e.g. green dot on macOS/Windows) whenever the sensor is active.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm mb-1">2. Offline Operational Mode</h4>
            <p className="text-slate-400">
              You can verify our privacy claims at any moment: disconnect your computer from Wi-Fi or unplug your Ethernet cable, refresh the page, and observe that 100% of the hand tracking and gesture recognition continues to function flawlessly offline.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm mb-1">3. What is Synced to the Cloud?</h4>
            <p className="text-slate-400">
              If (and only if) you choose to create a Supabase account and enable Cloud Sync, the app synchronizes numeric settings (e.g. cooldown duration, custom gesture names, and normalized 21-point float coordinates). Visual imagery is never serialized or transmitted.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Questions about our privacy architecture?</span>
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-heading text-xs font-bold"
          >
            Read Help & FAQ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
