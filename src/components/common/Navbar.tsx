import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Video,
  Gamepad2,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Compass,
  Sliders,
  Brain,
  Utensils,
  Target,
  BarChart2,
  User,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Sparkles },
    { name: 'Live Studio', path: '/studio', icon: Video },
    { name: 'Workspaces', path: '/modes', icon: Gamepad2 },
    { name: 'Practice', path: '/practice', icon: Target },
    { name: 'Kitchen', path: '/kitchen', icon: Utensils },
    { name: 'AI Trainer', path: '/train', icon: Brain },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Calibration', path: '/onboarding', icon: Compass },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Privacy', path: '/privacy', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-[#0B1020]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-[2px] shadow-glow-cyan transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
              <Sliders className="w-5 h-5 text-cyan-400 group-hover:text-violet-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                AEROTOUCH
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
                AI v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block -mt-1">
              Zero-latency Gesture Interface
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side status indicators & Auth */}
        <div className="flex items-center gap-2.5">
          {/* Offline/Online Badge driven by useOnlineStatus */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${isOnline
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                : 'bg-amber-950/50 text-amber-400 border-amber-800/60 animate-pulse'
              }`}
            title={
              isOnline
                ? 'App is running online. Offline MediaPipe models are cached locally.'
                : 'Offline mode active! App works 100% offline with zero CDN dependencies.'
            }
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* User Email & Sign Out Button or Sign In Button */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border bg-violet-950/60 border-violet-800/60 text-violet-300 max-w-[150px] sm:max-w-[200px] truncate"
                title={`Signed in as ${user.email}`}
              >
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-heading font-semibold border border-rose-500/40 text-rose-300 hover:bg-rose-950/50 transition-colors"
                title="Sign out of Supabase"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-medium border bg-slate-900 border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Quick Studio Action */}
          <Link
            to="/studio"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-heading bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-slate-950" />
            Studio
          </Link>
        </div>
      </div>
    </header>
  );
};
