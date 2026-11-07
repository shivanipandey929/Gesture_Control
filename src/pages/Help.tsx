import React from 'react';
import { 
  ShieldCheck, 
  HelpCircle
} from 'lucide-react';

export const Help: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Documentation & Architecture</span>
        </div>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-2">
          Help, Privacy & Guide
        </h1>
        <p className="text-slate-400 text-sm">
          Everything you need to know about AeroTouch, offline gesture models, and user privacy.
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-cyan-500/40 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-white">
              Zero Video Uploads • 100% Client-Side Privacy
            </h2>
            <p className="text-xs text-cyan-300 font-mono">Guaranteed Offline Operation</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          AeroTouch utilizes a locally hosted Google MediaPipe Gesture Recognizer compiled into WebAssembly (`.wasm`) alongside the quantized `gesture_recognizer.task` model stored directly in this application's `/public` folder.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs font-heading font-bold text-cyan-300 mb-1">Local Processing</div>
            <div className="text-[11px] text-slate-400">
              Webcam video frames never leave your browser sandbox or memory buffer.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs font-heading font-bold text-violet-300 mb-1">Zero Cloud APIs</div>
            <div className="text-[11px] text-slate-400">
              No cloud AI calls, external trackers, or telemetry payloads.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs font-heading font-bold text-emerald-300 mb-1">Airplane Mode</div>
            <div className="text-[11px] text-slate-400">
              Disconnect your Wi-Fi or unplug Ethernet and the entire app continues running flawlessly.
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Handbook */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-6 shadow-2xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="font-heading font-bold text-lg text-white">Gesture Recognition Handbook</h2>
          <p className="text-xs text-slate-400">Tips for achieving maximum detection accuracy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            {
              title: 'Open Palm',
              action: 'Pause (Media / Slides / Reader)',
              tip: 'Hold fingers flat and separated facing the camera directly.',
            },
            {
              title: 'Closed Fist',
              action: 'Play / Virtual Click',
              tip: 'Clench all fingers tightly into a ball with knuckles facing forward.',
            },
            {
              title: 'Swipe Right / Left',
              action: 'Next / Previous Navigation',
              tip: 'Flick your hand horizontally across the camera view in a swift 200ms motion.',
            },
            {
              title: 'Thumb Up / Down',
              action: 'Volume Adjust (+ / - 10%)',
              tip: 'Extend thumb clearly perpendicular to a curled fist.',
            },
            {
              title: 'Pointing Up',
              action: 'Virtual Cursor / Auto-Scroll',
              tip: 'Extend only index finger vertically with remaining fingers curled.',
            },
            {
              title: 'Victory (✌)',
              action: 'Screenshot Snapshot / Reset',
              tip: 'Extend index and middle fingers in a clear V shape.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-heading font-bold text-slate-200">{item.title}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  {item.action}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ & Troubleshooting */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col gap-4 shadow-2xl">
        <h2 className="font-heading font-bold text-lg text-white mb-2">Frequently Asked Questions</h2>

        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <div className="font-heading font-bold text-sm text-cyan-400 mb-1">
              Why does the app warn about Low Light?
            </div>
            <p className="text-slate-400 leading-relaxed">
              Monocular computer vision requires sufficient pixel contrast to detect 21 hand landmarks accurately. If your room is dim, the lighting checker alerts you so you can illuminate your workspace for 60 FPS accuracy.
            </p>
          </div>

          <div>
            <div className="font-heading font-bold text-sm text-cyan-400 mb-1">
              What is the 350ms stability hold and 600ms cooldown?
            </div>
            <p className="text-slate-400 leading-relaxed">
              To prevent accidental false-positive triggers when your hand is transitioning into position, the gesture engine requires 350ms of consistent classification before an action is fired. The 600ms cooldown lockout prevents repeat accidental double-clicks.
            </p>
          </div>

          <div>
            <div className="font-heading font-bold text-sm text-cyan-400 mb-1">
              Can I customize the mapping?
            </div>
            <p className="text-slate-400 leading-relaxed">
              Yes! Visit the <strong className="text-slate-200">Settings</strong> page to remap any gesture to your preferred action and adjust sensitivity sliders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

