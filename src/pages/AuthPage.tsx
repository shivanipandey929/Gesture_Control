import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Compass
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isConfigured,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    continueAsGuest,
    signOut
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, displayName);
        if (error) {
          setErrorMessage(error.message);
        } else if (needsEmailConfirmation) {
          setInfoMessage('Check your email to confirm your account.');
        } else {
          setInfoMessage('Account created and signed in! Redirecting to Studio...');
          setTimeout(() => navigate('/studio'), 1000);
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          // Provide friendly real message
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Invalid login credentials. Please check your email and password.');
          } else {
            setErrorMessage(error.message);
          }
        } else {
          setInfoMessage('Signed in successfully! Redirecting...');
          setTimeout(() => navigate('/studio'), 600);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/studio');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel-glow border border-cyan-500/30 bg-[#0B1020]/95 shadow-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Secure Cloud Sync</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white mb-1">
            {user ? 'Signed In' : authMode === 'signup' ? 'Create an Account' : 'Welcome to AeroTouch'}
          </h1>
          <p className="text-xs text-slate-400">
            {user
              ? `Currently authenticated as ${user.email}`
              : 'Sync custom trained gestures, workspaces, and telemetry across your devices.'}
          </p>
        </div>

        {/* If user is already signed in */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Account Email:</span>
                <span className="font-heading font-bold text-white text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Authenticated
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/studio')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading text-xs font-bold hover:opacity-90 shadow-glow-cyan flex items-center justify-center gap-2"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-300 font-heading text-xs font-semibold hover:bg-rose-950/40 flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <>
            {/* Prominent Segmented Toggle between Sign In and Sign Up */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${authMode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-heading font-bold transition-all ${authMode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign Up
              </button>
            </div>

            {/* Supabase unconfigured warning if .env is missing */}
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/60 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Supabase credentials are not set in <code>.env</code>. You can click <strong>"Continue as Guest"</strong> below to use all features with local IndexedDB storage.
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <span className="text-[10px] text-slate-500 font-mono">Min 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-cyan flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Processing...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Real error messages under the form */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success / Email confirm message */}
              {infoMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{infoMessage}</span>
                </div>
              )}
            </form>

            {/* Social OAuth & Guest Continue */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => signInWithGoogle()}
                type="button"
                className="w-full py-2.5 rounded-xl glass-panel border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-heading font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleGuest}
                type="button"
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Continue as Guest (IndexedDB Only)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
