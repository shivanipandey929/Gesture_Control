import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { Landing } from './pages/Landing';
import { LiveStudio } from './pages/LiveStudio';
import { Onboarding } from './pages/Onboarding';
import { ControlModesHub } from './pages/ControlModesHub';
import { Practice } from './pages/Practice';
import { KitchenMode } from './pages/KitchenMode';
import { CustomTrainer } from './pages/CustomTrainer';
import { Analytics } from './pages/Analytics';
import { AuthPage } from './pages/AuthPage';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { Privacy } from './pages/Privacy';
import { OfflineFallback } from './pages/OfflineFallback';
import { NotFound } from './pages/NotFound';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/studio" element={<LiveStudio />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/modes" element={<ControlModesHub />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/kitchen" element={<KitchenMode />} />
          <Route path="/train" element={<CustomTrainer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/offline" element={<OfflineFallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-body selection:bg-cyan-500 selection:text-slate-950">
              <Navbar />
              <main className="flex-1 w-full" id="main-content">
                <AnimatedRoutes />
              </main>
              <PwaInstallPrompt />
            </div>
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
