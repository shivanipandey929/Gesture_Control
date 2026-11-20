import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ArrowRight, Hand, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '../context/CameraContext';
import { useGestureEngine } from '../engine';
import { HandOverlayCanvas } from '../components/common/HandOverlayCanvas';
import { LanguagePicker } from '../components/common/LanguagePicker';

export const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isStreaming, grantConsentAndStart } = useCamera();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [palmDetected, setPalmDetected] = useState(false);
  const [swipeDetected, setSwipeDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { state } = useGestureEngine(videoRef, undefined, {
    drawSkeleton: true,
  });

  // Step 1: Advance when camera starts streaming
  useEffect(() => {
    if (isStreaming && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [isStreaming, currentStep]);

  // Step 2: Detect Open Palm
  useEffect(() => {
    if (currentStep === 2 && state.filteredGesture === 'Open_Palm') {
      setPalmDetected(true);
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
    }
  }, [currentStep, state.filteredGesture]);

  // Step 3: Detect Swipe
  useEffect(() => {
    if (
      currentStep === 3 &&
      (state.filteredGesture === 'Swipe_Right' || state.filteredGesture === 'Swipe_Left')
    ) {
      setSwipeDetected(true);
    }
  }, [currentStep, state.filteredGesture]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Top Language Select Shortcut */}
      <div className="w-full flex justify-end mb-4">
        <LanguagePicker variant="navbar" />
      </div>

      {/* Step Progress Dots */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-xs transition-colors ${currentStep === step
                  ? 'bg-primary text-white'
                  : currentStep > step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-secondary border border-border text-muted'
                }`}
            >
              {currentStep > step ? '✓' : step}
            </div>
            {step < 3 && <div className="w-8 h-0.5 bg-border" />}
          </div>
        ))}
      </div>

      <div className="text-center max-w-md mb-8">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground mb-2">
          {t('onboardingPage.title', 'Welcome to AeroTouch')}
        </h1>
        <p className="text-muted text-xs sm:text-sm">
          {t(
            'onboardingPage.subtitle',
            'Follow this 30-second interactive calibration to test your webcam and spatial air gestures.'
          )}
        </p>
      </div>

      {/* Interactive Step Card */}
      <div className="w-full p-6 sm:p-8 rounded-3xl panel-card border border-border flex flex-col items-center shadow-card">
        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">
                {t('onboardingPage.step1Title', 'Camera Setup')}
              </h2>
              <p className="text-xs text-muted max-w-sm mt-1">
                {t('onboardingPage.step1Desc', 'Grant local webcam access to begin.')}
              </p>
            </div>
            <button
              onClick={() => grantConsentAndStart()}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-xs transition-colors shadow-soft flex items-center gap-2 mt-2"
            >
              <Camera className="w-4 h-4" />
              <span>{t('onboardingPage.step1Action', 'Start Webcam')}</span>
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col items-center text-center gap-4 py-4 w-full">
            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-border shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <HandOverlayCanvas />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center justify-center gap-2">
                <Hand className="w-5 h-5 text-primary" />
                <span>{t('onboardingPage.step2Title', 'Test Open Palm')}</span>
              </h2>
              <p className="text-xs text-muted max-w-sm mt-1">
                {t('onboardingPage.step2Desc', 'Hold your open palm steady in front of the camera.')}
              </p>
            </div>
            {palmDetected && (
              <div className="flex items-center gap-2 text-emerald-500 font-heading font-bold text-xs animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                <span>Detected Open Palm!</span>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center text-center gap-4 py-4 w-full">
            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-border shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <HandOverlayCanvas />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center justify-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                <span>{t('onboardingPage.step3Title', 'Test Swipe Action')}</span>
              </h2>
              <p className="text-xs text-muted max-w-sm mt-1">
                {t('onboardingPage.step3Desc', 'Swipe your hand swiftly across the frame.')}
              </p>
            </div>
            {swipeDetected ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-500 font-heading font-bold text-xs animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Swipe Detected! Ready to launch.</span>
                </div>
                <button
                  onClick={() => navigate('/studio')}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs shadow-card flex items-center gap-2"
                >
                  <span>{t('onboardingPage.finishAction', 'Finish Calibration')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/studio')}
                className="text-xs text-muted hover:text-foreground mt-2"
              >
                Skip to Studio &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
