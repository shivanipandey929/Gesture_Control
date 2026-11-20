import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Calendar,
  Download,
  Trash2,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Database
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest, signOut, exportUserData, deleteAccountAndData } = useAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Protected route check
  if (isGuest || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl panel-card border border-border text-center flex flex-col items-center gap-4 shadow-card">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-xl text-foreground">{t('profile.signInRequired', 'Sign In Required')}</h2>
            <p className="text-xs text-muted leading-relaxed">
              {t('profile.signInRequiredDesc', 'Your profile, personal cloud sync, and account exports require an authenticated session.')}
            </p>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-xs transition-colors shadow-soft"
          >
            {t('profile.goToSignIn', 'Go to Sign In')}
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'AeroTouch User';
  const email = user.email || 'N/A';
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Recent Member';

  // Compute initials for Avatar
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const json = await exportUserData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aerotouch-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionNotice('Telemetry and session data exported successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountAndData();
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      {/* Action Notification */}
      {actionNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-heading text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-medium mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('profile.verifiedAccount', 'Verified Account')}</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground">
          {t('profile.title', 'User Profile & Data')}
        </h1>
        <p className="text-muted text-sm mt-1">
          {t('profile.subtitle', 'Manage your credentials, offline IndexedDB telemetry, and data privacy.')}
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl panel-card border border-border flex flex-col gap-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white font-heading font-extrabold text-xl flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground">{displayName}</h2>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-muted" />
              <span>{email}</span>
            </div>
            <div className="text-[11px] font-mono text-muted flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('profile.memberSince', 'Member since')} {createdAt}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <span className="text-muted block text-[10px] uppercase">{t('profile.storageMode', 'Storage Mode')}</span>
            <span className="text-primary font-bold">{t('profile.storageModeVal', 'Local IndexedDB + Supabase')}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border">
            <span className="text-muted block text-[10px] uppercase">{t('profile.cloudSync', 'Cloud Sync')}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('profile.cloudSyncVal', 'Active & Encrypted')}</span>
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="p-6 sm:p-8 rounded-2xl panel-card border border-border flex flex-col gap-4 shadow-card">
        <h3 className="font-heading font-bold text-base text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span>{t('profile.privacyControls', 'Privacy & Data Controls')}</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
          <div>
            <h4 className="font-heading font-bold text-sm text-foreground">{t('profile.exportTelemetry', 'Export Local Telemetry')}</h4>
            <p className="text-xs text-muted max-w-md mt-0.5">
              {t('profile.exportTelemetryDesc', 'Download all saved gesture events, active sessions, and personal mappings as a JSON file.')}
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground font-heading text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-soft"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>{isExporting ? 'Exporting...' : t('profile.exportData', 'Export My Data (JSON)')}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2 border-t border-border">
          <div>
            <h4 className="font-heading font-bold text-sm text-error">{t('profile.deleteAccountHeader', 'Delete Account & Data')}</h4>
            <p className="text-xs text-muted max-w-md mt-0.5">
              {t('profile.deleteAccountDesc', 'Permanently clears all local IndexedDB records, cached camera preferences, and signs out.')}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-heading text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('profile.deleteAccount', 'Delete Account & Data')}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-foreground font-heading text-xs font-semibold flex items-center gap-2 transition-colors shadow-soft"
          >
            <LogOut className="w-4 h-4 text-muted" />
            <span>{t('profile.signOut', 'Sign Out')}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl panel-card border border-rose-500/30 shadow-elevated flex flex-col gap-4 animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-error mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-lg text-foreground">{t('profile.deleteAccountModalTitle', 'Delete Account and Data?')}</h3>
              <p className="text-xs text-muted leading-relaxed">
                {t('profile.deleteConfirm', 'Are you sure you want to permanently delete your account and all local IndexedDB records? This action cannot be undone.')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-foreground font-heading text-xs font-semibold transition-colors"
              >
                {t('profile.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-error hover:opacity-90 text-white font-heading text-xs font-bold transition-colors disabled:opacity-50 shadow-soft"
              >
                {isDeleting ? 'Deleting...' : t('profile.confirmDelete', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
