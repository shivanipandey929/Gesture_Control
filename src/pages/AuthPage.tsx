import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Sun,
  Moon,
  Camera,
  Zap,
  Settings as SettingsIcon,
} from 'lucide-react';
import { LanguagePicker } from '../components/common/LanguagePicker';
import { AuthBackgroundWaves } from '../components/auth/AuthBackgroundWaves';
import { AuthHandVisual } from '../components/auth/AuthHandVisual';

export const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';

  const returnToParam = searchParams.get('returnTo');
  const stateFrom = (location.state as any)?.from?.pathname;
  const returnTo = returnToParam || stateFrom || '/';

  const {
    user,
    isGuest,
    signInWithEmail,
    signUpWithEmail,
    verifyOtp,
    resendOtp,
    resetPasswordForEmail,
    updateUserPassword,
    signInWithGoogle,
    continueAsGuest,
  } = useAuth();

  const { settings, updateSettings } = useAccessibility();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify' | 'forgot' | 'reset-new'>(
    isResetMode ? 'reset-new' : 'signin'
  );

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP 6 Boxes
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback & Timers
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resend countdown for OTP verification
  useEffect(() => {
    if (authMode !== 'verify') return;
    setResendCountdown(30);
    setCanResend(false);

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authMode]);

  // Auto-check if email got confirmed via link in another tab / app
  useEffect(() => {
    if (authMode !== 'verify' || !email || !password) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || loading) return;
      try {
        const { error } = await signInWithEmail(email, password);
        if (!error && !cancelled) {
          triggerToast('Email verified successfully! Welcome to AeroTouch.');
          setTimeout(() => navigate(returnTo, { replace: true }), 600);
        }
      } catch {
        // silent background check
      }
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authMode, email, password, loading, signInWithEmail, navigate, returnTo]);

  // Password Strength Calculation
  const passwordStrength = React.useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-muted/30' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: t('auth.weak', 'Weak'), color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: t('auth.medium', 'Medium'), color: 'bg-amber-400' };
    return { score: 3, label: t('auth.strong', 'Strong'), color: 'bg-emerald-500' };
  }, [password, t]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleThemeToggle = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: nextTheme });
  };

  // Submit Handler for Sign In / Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage(t('auth.enterAllFields', 'Please enter your email and password.'));
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 8) {
        setErrorMessage(t('auth.passMinLength', 'Password must be at least 8 characters.'));
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('auth.passwordsMismatch', 'Passwords do not match.'));
        return;
      }

      setLoading(true);
      try {
        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, displayName);
        if (error) {
          setErrorMessage(formatAuthError(error.message));
        } else if (needsEmailConfirmation) {
          triggerToast('Account created! Please verify your email.');
          setAuthMode('verify');
        } else {
          triggerToast('Account created and signed in!');
          setTimeout(() => navigate(returnTo, { replace: true }), 800);
        }
      } finally {
        setLoading(false);
      }
    } else if (authMode === 'signin') {
      setLoading(true);
      try {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(formatAuthError(error.message));
        } else {
          triggerToast('Signed in successfully!');
          setTimeout(() => navigate(returnTo, { replace: true }), 600);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 6-digit OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otp];
    if (cleaned.length > 1) return;
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length > 0) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyOtp(email, code);
      if (error) {
        setErrorMessage(
          error.message.toLowerCase().includes('expired')
            ? 'This verification code has expired. Please request a new code.'
            : 'Invalid verification code. Please check your email inbox or click the confirmation link.'
        );
      } else {
        triggerToast('Email verified successfully! Welcome to AeroTouch.');
        setTimeout(() => navigate(returnTo, { replace: true }), 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLinkVerification = async () => {
    if (!password) {
      setAuthMode('signin');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMessage(
          'Email confirmation not detected yet. Please click the confirmation link in your email and try again.'
        );
      } else {
        triggerToast('Email verified successfully! Welcome to AeroTouch.');
        setTimeout(() => navigate(returnTo, { replace: true }), 600);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await resendOtp(email);
      if (error) {
        setErrorMessage(formatAuthError(error.message));
      } else {
        triggerToast('A fresh verification email has been sent.');
        setResendCountdown(30);
        setCanResend(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email) {
      setErrorMessage('Please enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        setErrorMessage(formatAuthError(error.message));
      } else {
        triggerToast('Password reset link sent! Check your inbox.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update Password
  const handleUpdateNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateUserPassword(password);
      if (error) {
        setErrorMessage(formatAuthError(error.message));
      } else {
        triggerToast('Password updated successfully! Redirecting...');
        setTimeout(() => navigate(returnTo, { replace: true }), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    if (!isOnline) {
      setErrorMessage('No internet connection. Please connect to internet to sign in with Google.');
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage('Google sign-in is not configured yet in Supabase settings.');
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate(returnTo, { replace: true });
  };

  const formatAuthError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Incorrect email or password. Please verify your details.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    if (lower.includes('rate limit')) {
      return 'Too many attempts. Please wait a few moments before trying again.';
    }
    return msg;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative overflow-x-hidden overflow-y-auto font-body select-none">
      {/* 1. FULL-VIEWPORT ANIMATED BACKGROUND LAYER */}
      <AuthBackgroundWaves />

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-heading text-xs font-semibold shadow-elevated backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. SLIM TOP BAR (No dividing border line) */}
      <header className="w-full h-14 sm:h-16 bg-transparent flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-20">
        {/* Left: Non-clickable brand logo & wordmark ("Aero" in dark text, "Touch" in primary blue) */}
        <div className="flex items-center gap-2.5 cursor-default" aria-label="AeroTouch">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <svg
              className="w-4.5 h-4.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-foreground">
            Aero<span className="text-primary">Touch</span>
          </span>
        </div>

        {/* Right: Language Picker & Theme Toggle */}
        <div className="flex items-center gap-3">
          <LanguagePicker variant="navbar" />

          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-muted hover:text-foreground transition-all duration-150 hover:-translate-y-[1px] shadow-soft"
            title={settings.theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            aria-label="Toggle theme"
          >
            {settings.theme === 'light' ? (
              <Moon className="w-4 h-4 text-muted" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* 3. MAIN COMPOSITION: DESKTOP 3-ZONE LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-2 sm:pt-4 lg:pt-6 pb-4 sm:pb-8 flex flex-col xl:flex-row items-center justify-between gap-6 sm:gap-10 xl:gap-12 relative z-10">
        {/* LEFT + MIDDLE ZONE (Brand, Hand Scan Frame, Tiles) */}
        <div className="w-full xl:w-auto flex-1 flex flex-col md:flex-row items-center justify-center xl:justify-start gap-4 sm:gap-8 lg:gap-10 text-center md:text-left">
          {/* Left Zone: Glowing Hand Scan Frame */}
          <div className="shrink-0 flex items-center justify-center">
            <AuthHandVisual size="normal" className="hidden sm:flex scale-95 sm:scale-100" />
            <AuthHandVisual size="mini" className="flex sm:hidden -mb-4 opacity-85" />
          </div>

          {/* Middle Zone: Brand Headline with Underline Swoosh, Tagline & 3 Glass Tiles */}
          <div className="flex flex-col items-center md:items-start max-w-md lg:max-w-lg space-y-3 sm:space-y-4">
            {/* Headline + Swoosh */}
            <div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-[46px] tracking-tight text-[#0F172A] dark:text-white">
                Aero<span className="text-[#1D63E8]">Touch</span>
              </h1>
              {/* Short curved underline swoosh */}
              <svg
                className="w-28 sm:w-36 h-2 sm:h-2.5 text-[#1D63E8] mt-1 mx-auto md:mx-0"
                viewBox="0 0 140 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7 C 35 1, 95 1, 138 8 C 95 3, 40 4, 2 7 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* One-Line Tagline */}
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
              AI-Powered Hand Gesture Recognition for Smart and Touchless Control.
            </p>

            {/* 3 Small Glass Tiles in a Row (Matching Reference) */}
            <div className="hidden sm:grid grid-cols-3 gap-3 w-full pt-1">
              {/* Tile 1: Real-time Detection */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-[#152342] backdrop-blur-md border border-blue-100/80 dark:border-blue-900/50 shadow-soft flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/50 group cursor-default">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D63E8] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-4.5 h-4.5 text-[#1D63E8] dark:text-[#38BDF8] stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  Real-time<br />Detection
                </span>
              </div>

              {/* Tile 2: High Accuracy */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-[#152342] backdrop-blur-md border border-blue-100/80 dark:border-blue-900/50 shadow-soft flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/50 group cursor-default">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D63E8] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-4.5 h-4.5 text-[#1D63E8] dark:text-[#38BDF8] stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  High<br />Accuracy
                </span>
              </div>

              {/* Tile 3: Easy Integration */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-[#152342] backdrop-blur-md border border-blue-100/80 dark:border-blue-900/50 shadow-soft flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/50 group cursor-default">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1D63E8] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <SettingsIcon className="w-4.5 h-4.5 text-[#1D63E8] dark:text-[#38BDF8] stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  Easy<br />Integration
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT ZONE: FORM CARD */}
        <div className="w-full max-w-[430px] shrink-0 select-text flex flex-col items-center">
          <div className="w-full rounded-[32px] bg-white dark:bg-[#111C35] backdrop-blur-xl border border-blue-100/80 dark:border-blue-900/40 shadow-[0_20px_50px_rgba(29,99,232,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-4">
            {/* Card Header: Heading + Subtitle */}
            <div className="text-center space-y-1">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                {authMode === 'signup'
                  ? 'Create Account'
                  : authMode === 'verify'
                    ? 'Verify Email'
                    : authMode === 'forgot'
                      ? 'Reset Password'
                      : authMode === 'reset-new'
                        ? 'Set Password'
                        : 'Sign In'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {authMode === 'signup'
                  ? 'Get started with touchless control'
                  : authMode === 'verify'
                    ? 'Check your inbox for instructions'
                    : authMode === 'forgot'
                      ? 'Enter your email to receive reset link'
                      : authMode === 'reset-new'
                        ? 'Enter and confirm your new password'
                        : 'Access your AeroTouch account'}
              </p>
            </div>

            {/* Active Session Banner (compact, unobtrusive) */}
            {(user || isGuest) && (
              <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs">
                <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                  {user ? `Signed in as ${user.user_metadata?.full_name || user.email}` : 'Active Guest Session'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(returnTo, { replace: true })}
                  className="text-xs font-semibold text-[#1D63E8] hover:underline ml-2 shrink-0"
                >
                  Continue &rarr;
                </button>
              </div>
            )}

            {/* FORM MODES */}
            {authMode === 'verify' ? (
              /* DUAL EMAIL CONFIRMATION FLOW */
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-2xl bg-surface-secondary dark:bg-card/70 border border-border space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-heading font-semibold text-foreground">
                        Step 1: Check your inbox
                      </div>
                      <p className="text-muted leading-relaxed">
                        We sent a verification link to <strong className="text-foreground">{email}</strong>. Click the link to activate your account.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckLinkVerification}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-xs transition-all duration-150 hover:-translate-y-[1px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking status...</span>
                      </>
                    ) : (
                      <>
                        <span>I clicked the email link &rarr; Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="w-full border-t border-border" />
                  <span className="relative bg-surface dark:bg-card px-2.5 text-[10px] uppercase tracking-wider text-muted font-mono">
                    OR Enter 6-digit code
                  </span>
                </div>

                {/* 6-Digit Code */}
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 text-center text-base font-mono font-bold bg-surface-secondary dark:bg-card/60 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full h-11 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground font-heading font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <span>Verify 6-Digit Code</span>
                  </button>
                </form>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 text-xs pt-1">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-primary hover:underline font-medium"
                    >
                      Resend confirmation email
                    </button>
                  ) : (
                    <span className="text-muted font-mono text-[11px]">
                      Resend email in {resendCountdown}s
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage(null);
                    }}
                    className="text-muted hover:text-foreground transition-colors text-[11px]"
                  >
                    Wrong email? Change it
                  </button>
                </div>
              </div>
            ) : authMode === 'forgot' ? (
              /* FORGOT PASSWORD SCREEN */
              <form onSubmit={handleForgotPassword} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label htmlFor="auth-forgot-email" className="text-xs font-medium text-muted">
                    {t('auth.email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full h-12 bg-surface-secondary dark:bg-card/60 border border-border rounded-xl pl-11 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-sm shadow-md transition-all duration-150 hover:-translate-y-[1px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            ) : authMode === 'reset-new' ? (
              /* RESET NEW PASSWORD SCREEN */
              <form onSubmit={handleUpdateNewPassword} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label htmlFor="auth-new-pass" className="text-xs font-medium text-muted">
                    New Password
                  </label>
                  <input
                    id="auth-new-pass"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full h-12 bg-surface-secondary dark:bg-card/60 border border-border rounded-xl px-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-confirm-new-pass" className="text-xs font-medium text-muted">
                    Confirm New Password
                  </label>
                  <input
                    id="auth-confirm-new-pass"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-12 bg-surface-secondary dark:bg-card/60 border border-border rounded-xl px-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-sm shadow-md transition-all duration-150 hover:-translate-y-[1px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            ) : (
              /* SIGN IN / CREATE ACCOUNT FORM */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name Field (Create Account mode only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label htmlFor="auth-name" className="text-xs font-medium text-muted">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full h-12 bg-surface-secondary dark:bg-card/60 border border-border rounded-xl pl-11 pr-3.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address Field */}
                <div className="space-y-1">
                  <label htmlFor="auth-email-input" className="sr-only">
                    {t('auth.email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full h-12 bg-[#F8FAFC] dark:bg-[#152342] border border-slate-200 dark:border-blue-900/60 rounded-2xl pl-11 pr-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/70"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="auth-password-input" className="sr-only">
                    {t('auth.password', 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-12 bg-[#F8FAFC] dark:bg-[#152342] border border-slate-200 dark:border-blue-900/60 rounded-2xl pl-11 pr-11 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {authMode === 'signin' && (
                    <div className="text-right pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage(null);
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {t('auth.forgotPassword', 'Forgot Password?')}
                      </button>
                    </div>
                  )}

                  {/* Password Strength Indicator (Signup mode) */}
                  {authMode === 'signup' && password && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1 bg-surface-secondary dark:bg-card/70 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 ${passwordStrength.color}`} />
                        <div
                          className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'
                            }`}
                        />
                        <div
                          className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'
                            }`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field (Create Account mode only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label htmlFor="auth-confirm-pass" className="text-xs font-medium text-muted">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-confirm-pass"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 bg-surface-secondary dark:bg-card/60 border border-border rounded-xl pl-11 pr-11 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Full-width Primary Sign In / Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-[#1D63E8] hover:bg-[#1554c9] text-white font-heading font-semibold text-sm shadow-[0_10px_25px_-5px_rgba(29,99,232,0.4)] transition-all duration-150 hover:-translate-y-[1px] flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('auth.processing', 'Processing...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? t('auth.signIn', 'Sign In') : t('auth.signUp', 'Create Account')}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="w-full border-t border-slate-200 dark:border-border" />
                  <span className="relative bg-white dark:bg-card px-3 text-[11px] font-mono text-muted uppercase tracking-wider">
                    OR
                  </span>
                </div>

                {/* Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 rounded-2xl border border-slate-200 dark:border-blue-900/60 bg-white hover:bg-slate-50 dark:bg-[#152342] dark:hover:bg-[#1a2c54] text-slate-700 dark:text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-150 hover:-translate-y-[1px] shadow-sm"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="text-slate-700 dark:text-white">Continue with Google</span>
                </button>

                {/* Bottom Mode Switch Link */}
                <div className="text-center pt-2 text-xs text-muted space-y-2">
                  <div>
                    {authMode === 'signin' ? (
                      <>
                        <span>Don&apos;t have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signup');
                            setErrorMessage(null);
                          }}
                          className="text-[#1D63E8] hover:underline font-semibold"
                        >
                          Create Account
                        </button>
                      </>
                    ) : (
                      <>
                        <span>Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin');
                            setErrorMessage(null);
                          }}
                          className="text-[#1D63E8] hover:underline font-semibold"
                        >
                          Sign In
                        </button>
                      </>
                    )}
                  </div>

                  {/* Clean unobtrusive guest access preserved */}
                  <div>
                    <button
                      type="button"
                      onClick={handleGuest}
                      className="text-[11px] text-muted hover:text-[#1D63E8] transition-colors"
                    >
                      or Continue as Guest (offline mode)
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Tiny Footer spacer if needed */}
      <div className="h-2 shrink-0 pointer-events-none" />
    </div>
  );
};

export default AuthPage;
