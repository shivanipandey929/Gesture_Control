import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { CameraProvider } from './context/CameraContext';
import { GestureProvider } from './context/GestureContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { LanguageSuggestionPrompt } from './components/common/LanguageSuggestionPrompt';
import { DevDebugPanel } from './components/common/DevDebugPanel';
import { SimulatedHandController } from './components/common/SimulatedHandController';
import { AuthGuard } from './components/auth/AuthGuard';
import { getGestureRecognizer } from './services/mediapipe';

// Route-Level Code Splitting (React.lazy)
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const LiveStudio = lazy(() => import('./pages/LiveStudio').then((m) => ({ default: m.LiveStudio })));
const GestureChat = lazy(() => import('./pages/GestureChat'));
const ControlModesHub = lazy(() => import('./pages/ControlModesHub').then((m) => ({ default: m.ControlModesHub })));
const Practice = lazy(() => import('./pages/Practice').then((m) => ({ default: m.Practice })));
const KitchenMode = lazy(() => import('./pages/KitchenMode').then((m) => ({ default: m.KitchenMode })));
const CustomTrainer = lazy(() => import('./pages/CustomTrainer').then((m) => ({ default: m.CustomTrainer })));
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const Help = lazy(() => import('./pages/Help').then((m) => ({ default: m.Help })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const OfflineFallback = lazy(() => import('./pages/OfflineFallback').then((m) => ({ default: m.OfflineFallback })));
const I18nDiagnostics = lazy(() => import('./pages/I18nDiagnostics').then((m) => ({ default: m.I18nDiagnostics })));
const AboutHealth = lazy(() => import('./pages/AboutHealth').then((m) => ({ default: m.AboutHealth })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

const SuspenseLoader: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono text-muted">Loading module...</span>
  </div>
);

const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes location={location}>
        {/* Protected Core App Routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Landing />
            </AuthGuard>
          }
        />
        <Route
          path="/studio"
          element={
            <AuthGuard>
              <LiveStudio />
            </AuthGuard>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <GestureChat />
            </AuthGuard>
          }
        />
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <Onboarding />
            </AuthGuard>
          }
        />
        <Route
          path="/modes"
          element={
            <AuthGuard>
              <ControlModesHub />
            </AuthGuard>
          }
        />
        <Route
          path="/practice"
          element={
            <AuthGuard>
              <Practice />
            </AuthGuard>
          }
        />
        <Route
          path="/kitchen"
          element={
            <AuthGuard>
              <KitchenMode />
            </AuthGuard>
          }
        />
        <Route
          path="/train"
          element={
            <AuthGuard>
              <CustomTrainer />
            </AuthGuard>
          }
        />
        <Route
          path="/analytics"
          element={
            <AuthGuard>
              <Analytics />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />

        {/* Public Routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/offline" element={<OfflineFallback />} />
        <Route path="/i18n-check" element={<I18nDiagnostics />} />
        <Route path="/about" element={<AboutHealth />} />
        <Route path="/health" element={<AboutHealth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  // Preload MediaPipe model & WASM after initial paint in idle time
  useEffect(() => {
    const preloadModel = () => {
      getGestureRecognizer().catch(() => { });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadModel, { timeout: 3000 });
    } else {
      setTimeout(preloadModel, 1500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary selection:text-white transition-colors duration-150">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <LanguageSuggestionPrompt />}
      <main className="flex-1 w-full" id="main-content">
        <AppRoutes />
      </main>
      <PwaInstallPrompt />
      <DevDebugPanel />
      <SimulatedHandController />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <CameraProvider>
            <GestureProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </GestureProvider>
          </CameraProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
