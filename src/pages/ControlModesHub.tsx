import React, { useState } from 'react';
import { PresentationWorkspace } from './workspaces/PresentationWorkspace';
import { MediaWorkspace } from './workspaces/MediaWorkspace';
import { ScrollWorkspace } from './workspaces/ScrollWorkspace';
import { CursorWorkspace } from './workspaces/CursorWorkspace';
import { Presentation, Film, BookOpen, MousePointer, Gamepad2 } from 'lucide-react';

export const ControlModesHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'presentation' | 'media' | 'scroll' | 'cursor'>('presentation');

  const tabs = [
    {
      id: 'presentation' as const,
      name: 'Presentation',
      desc: 'Slide viewer with next/prev flicks',
      icon: Presentation,
    },
    {
      id: 'media' as const,
      name: 'Media Player',
      desc: 'Video controls with volume and screenshot',
      icon: Film,
    },
    {
      id: 'scroll' as const,
      name: 'Long-form Reader',
      desc: 'Article reading with auto-scroll gestures',
      icon: BookOpen,
    },
    {
      id: 'cursor' as const,
      name: 'Virtual Pointer',
      desc: 'Touchless cursor target practice',
      icon: MousePointer,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-5 h-5 text-violet-400" />
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
              Gesture Control Workspaces
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Select a live demo mode to test touchless spatial navigation.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workspace Container */}
      <div className="flex-1">
        {activeTab === 'presentation' && <PresentationWorkspace />}
        {activeTab === 'media' && <MediaWorkspace />}
        {activeTab === 'scroll' && <ScrollWorkspace />}
        {activeTab === 'cursor' && <CursorWorkspace />}
      </div>
    </div>
  );
};

