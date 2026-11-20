import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sliders,
  Wifi,
  WifiOff,
  Camera,
  CameraOff,
  User,
  Menu,
  X,
  Home,
  Video,
  Gamepad2,
  Target,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../context/AuthContext';
import { useCamera } from '../../context/CameraContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { GestureCheatSheetModal } from './GestureCheatSheetModal';
import { GuidedTourModal } from './GuidedTourModal';
import { LanguagePicker } from './LanguagePicker';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { user, isGuest, signOut } = useAuth();
  const { isStreaming, toggleCamera } = useCamera();
  const { settings, updateSettings } = useAccessibility();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Monitor scroll for subtle shadow elevation
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean Main Links
  const navLinks = [
    { name: t('nav.home', 'Home'), path: '/', icon: Home },
    { name: t('nav.studio', 'Studio'), path: '/studio', icon: Video },
    { name: t('nav.chat', 'Talk'), path: '/chat', icon: MessageSquare },
    { name: t('nav.modes', 'Modes'), path: '/modes', icon: Gamepad2 },
    { name: t('nav.practice', 'Practice'), path: '/practice', icon: Target },
    { name: t('nav.analytics', 'Analytics'), path: '/analytics', icon: BarChart2 },
  ];

  const handleThemeToggle = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: nextTheme });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b border-border transition-all duration-200 ${hasScrolled
          ? 'bg-surface shadow-card border-border/90'
          : 'bg-surface shadow-sm border-border'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 focus-visible:outline-primary">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-foreground">
              {t('common.brand', 'AeroTouch')}
            </span>
          </Link>

          {/* Desktop Nav Links (5 links) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-surface-secondary'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Picker Dropdown */}
            <LanguagePicker variant="navbar" />

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={handleThemeToggle}
              className="p-1.5 rounded-lg border border-border bg-surface-secondary text-muted hover:text-foreground transition-colors"
              title={settings.theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle theme"
            >
              {settings.theme === 'light' ? <Moon className="w-4 h-4 text-muted" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Camera Toggle Button */}
            <button
              onClick={() => toggleCamera()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${isStreaming
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-primary hover:bg-primary-hover text-white'
                }`}
              title={isStreaming ? 'Stop Camera' : 'Start Camera'}
            >
              {isStreaming ? (
                <>
                  <CameraOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Stop Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Camera</span>
                </>
              )}
            </button>

            {/* Online / Offline status badge */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border ${isOnline
                ? 'bg-surface-secondary border-border text-muted'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('nav.online', 'Online')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400 animate-pulse" />
                  <span>{t('nav.offline', 'Offline')}</span>
                </>
              )}
            </div>

            {/* Auth Dropdown (Signed In or Guest) or Sign In Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-secondary transition-colors"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-elevated py-1.5 z-50 text-xs font-medium">
                    <div className="px-3 py-2 border-b border-border text-[11px] text-muted truncate">
                      Signed in as <strong className="text-foreground block truncate">{user.email}</strong>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-surface-secondary transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{t('nav.profile', 'Profile')}</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-surface-secondary transition-colors"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-muted" />
                      <span>{t('nav.settings', 'Settings')}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.signOut', 'Sign out')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : isGuest ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-secondary transition-colors"
                  aria-expanded={profileDropdownOpen}
                  aria-label="Guest menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-secondary border border-border text-foreground font-bold text-xs flex items-center justify-center">
                    G
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Guest
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-elevated py-1.5 z-50 text-xs font-medium">
                    <div className="px-3 py-2 border-b border-border text-[11px] text-muted">
                      Browsing in <strong className="text-foreground block">Guest Mode</strong>
                    </div>

                    <Link
                      to="/auth"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-surface-secondary transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In / Create Account</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit guest mode</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {t('nav.signIn', 'Sign in')}
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted hover:bg-surface-secondary"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-2 shadow-card">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted hover:bg-surface-secondary'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-muted hover:text-primary flex items-center gap-1.5"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setCheatSheetOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-muted hover:text-primary"
              >
                Cheat Sheet
              </button>
              <button
                onClick={() => {
                  setTourOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-muted hover:text-primary"
              >
                Tour
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <GestureCheatSheetModal isOpen={cheatSheetOpen} onClose={() => setCheatSheetOpen(false)} />
      <GuidedTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
};
