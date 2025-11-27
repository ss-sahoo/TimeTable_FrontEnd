import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import OnboardingOverlay from '@/react-app/components/onboarding/OnboardingOverlay';
import { onboardingTourSteps, OnboardingStep } from '@/react-app/components/onboarding/tourSteps';

interface OnboardingTourContextValue {
  steps: OnboardingStep[];
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  isActive: boolean;
  hasCompleted: boolean;
  isPaused: boolean;
  ctaLabel: string;
  ctaTone: 'primary' | 'outline' | 'success';
  startTour: () => void;
  resumeTour: () => void;
  restartTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  totalSteps: number;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | undefined>(undefined);

const STORAGE_KEY = 'dashoexams:onboarding-tour';

interface StoredTourState {
  hasCompleted: boolean;
  lastStepIndex: number;
  isPaused: boolean;
}

const defaultStoredState: StoredTourState = {
  hasCompleted: false,
  lastStepIndex: 0,
  isPaused: false,
};

const safeWindow = typeof window !== 'undefined' ? window : undefined;

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pendingRouteRef = useRef<string | null>(null);

  const steps = onboardingTourSteps;
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] ?? null;

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!safeWindow) return;
    try {
      const stored = safeWindow.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredTourState = JSON.parse(stored);
        setHasCompleted(parsed.hasCompleted);
        setCurrentStepIndex(parsed.lastStepIndex ?? 0);
        setIsPaused(parsed.isPaused ?? false);
      }
    } catch (error) {
      console.warn('Failed to hydrate onboarding tour state', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist state
  useEffect(() => {
    if (!hydrated || !safeWindow) return;
    const derivedPaused =
      !isActive && !hasCompleted && (currentStepIndex > 0 || isPaused) ? true : isPaused;
    const payload: StoredTourState = {
      hasCompleted,
      lastStepIndex: currentStepIndex,
      isPaused: derivedPaused,
    };
    safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hydrated, hasCompleted, currentStepIndex, isActive, isPaused]);

  // Automatically mark as paused if the user leaves mid-way
  useEffect(() => {
    if (!isActive && !hasCompleted && currentStepIndex > 0) {
      setIsPaused(true);
    }
  }, [isActive, hasCompleted, currentStepIndex]);

  // Ensure we land on the route that the step expects
  useEffect(() => {
    if (!isActive || !currentStep) return;
    const desired = currentStep.route.replace(/\/$/, '');
    const currentPath = location.pathname.replace(/\/$/, '');

    if (!currentPath.startsWith(desired)) {
      if (pendingRouteRef.current === desired) return;
      pendingRouteRef.current = desired;
      navigate(currentStep.route);
    }
  }, [isActive, currentStep, location.pathname, navigate]);

  // Clear pending flag once navigation is complete
  useEffect(() => {
    if (!pendingRouteRef.current) return;
    if (location.pathname.replace(/\/$/, '').startsWith(pendingRouteRef.current)) {
      pendingRouteRef.current = null;
    }
  }, [location.pathname]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setHasCompleted(false);
    setIsPaused(false);
    setIsActive(true);
  }, []);

  const resumeTour = useCallback(() => {
    setIsPaused(false);
    setIsActive(true);
  }, []);

  const restartTour = useCallback(() => {
    setCurrentStepIndex(0);
    setHasCompleted(false);
    setIsPaused(false);
    setIsActive(true);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    setIsPaused(false);
    setCurrentStepIndex(totalSteps - 1);
  }, [totalSteps]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsPaused(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= totalSteps - 1) {
        completeTour();
        return totalSteps - 1;
      }
      return prev + 1;
    });
  }, [totalSteps, completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const status = useMemo(() => {
    if (isActive) return 'active';
    if (hasCompleted) return 'completed';
    if (isPaused || currentStepIndex > 0) return 'paused';
    return 'idle';
  }, [isActive, hasCompleted, currentStepIndex, isPaused]);

  const ctaLabel = useMemo(() => {
    switch (status) {
      case 'active':
        return 'Tour running';
      case 'completed':
        return 'Restart onboarding';
      case 'paused':
        return 'Resume onboarding';
      default:
        return 'Start onboarding';
    }
  }, [status]);

  const ctaTone: OnboardingTourContextValue['ctaTone'] = useMemo(() => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'paused':
        return 'outline';
      case 'active':
      default:
        return 'primary';
    }
  }, [status]);

  const contextValue = useMemo<OnboardingTourContextValue>(
    () => ({
      steps,
      currentStepIndex,
      currentStep,
      isActive,
      hasCompleted,
      isPaused: status === 'paused',
      ctaLabel,
      ctaTone,
      startTour,
      resumeTour,
      restartTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      totalSteps,
    }),
    [
      steps,
      currentStepIndex,
      currentStep,
      isActive,
      hasCompleted,
      status,
      ctaLabel,
      ctaTone,
      startTour,
      resumeTour,
      restartTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      totalSteps,
    ],
  );

  return (
    <OnboardingTourContext.Provider value={contextValue}>
      {children}
      <OnboardingOverlay
        controller={{
          isActive,
          currentStep,
          currentStepIndex,
          totalSteps,
          nextStep,
          prevStep,
          skipTour,
          completeTour,
        }}
      />
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider');
  }
  return context;
}

