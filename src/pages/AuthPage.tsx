import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCircle2
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

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password, displayName);
        if (error) setErrorMessage(error.message);
        else {
          setSuccessNotice('Account created successfully! Check your email if confirmation is required.');
          setTimeout(() => navigate('/studio'), 1500);
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) setErrorMessage(error.message);
        else {
          navigate('/studio');
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
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel-glow border border-cyan-500/30 bg-[#0B1020]/90 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted Cloud Sync</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white mb-1">
            {user ? 'My AeroTouch Account' : isSignUp ? 'Create an Account' : 'Welcome to AeroTouch'}
          </h1>
          <p className="text-xs text-slate-400">
            {user
              ? `Signed in as ${user.email}`
              : 'Sync custom trained gestures and usage analytics across all your devices.'}
          </p>
        </div>

        {/* If already logged in */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>User ID:</span>
                <span className="font-mono text-cyan-300 truncate max-w-[180px]">{user.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Email:</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-300 font-heading text-xs font-semibold hover:bg-rose-950/40"
            >
              Sign Out
            </button>
            <button
              onClick={() => navigate('/studio')}
              className="w-full py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-heading text-xs font-bold hover:bg-cyan-300"
            >
              Continue to Studio
            </button>
          </div>
        ) : (
          <>
            {/* Notices */}
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/50 text-amber-300 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Supabase keys are not set in <code>.env</code> yet. You can click <strong>"Continue as Guest"</strong> to test all features with offline IndexedDB storage!
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {successNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Display Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-heading font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-glow-cyan flex items-center justify-center gap-2"
              >
                <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Google OAuth Button */}
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
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 text-xs font-mono font-medium transition-colors"
              >
                ⚡ Continue as Guest (Offline Storage Only)
              </button>
            </div>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center text-xs text-slate-400 pt-1">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-cyan-400 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-cyan-400 font-semibold hover:underline"
                  >
                    Create Free Account
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
