import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Hand, Sparkles, X } from 'lucide-react';
import type { OnboardingStep } from './tourSteps';

interface OnboardingOverlayProps {
  controller: {
    isActive: boolean;
    currentStep: OnboardingStep | null;
    currentStepIndex: number;
    totalSteps: number;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
  };
}

interface TargetGeometry {
  rect: DOMRect;
  element: HTMLElement;
}

const highlightPadding = 12;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useEffect : () => {};

export default function OnboardingOverlay({ controller }: OnboardingOverlayProps) {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = controller;
  const [target, setTarget] = useState<TargetGeometry | null>(null);
  const [pendingScroll, setPendingScroll] = useState(false);
  const scrollTimeoutRef = useRef<number>();
  const lastStepIdRef = useRef<string | null>(null);

  const isLastStep = currentStepIndex === totalSteps - 1;
  const hasWindow = typeof window !== 'undefined';
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  const locateTarget = useCallback(() => {
    if (!currentStep || typeof document === 'undefined') {
      setTarget(null);
      return;
    }
    const element = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (!element) {
      setTarget(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTarget({ rect, element });
  }, [currentStep]);

  // Keep track of DOM geometry changes
  useIsomorphicLayoutEffect(() => {
    if (!isActive) {
      setTarget(null);
      return;
    }

    locateTarget();

    const handleResize = () => locateTarget();
    const handleScroll = () => {
      locateTarget();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isActive, locateTarget]);

  // Auto-scroll to new targets
useEffect(() => {
  if (!isActive || !currentStep || typeof document === 'undefined' || typeof window === 'undefined')
    return;

    if (lastStepIdRef.current !== currentStep.id) {
      const element = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (element) {
        setPendingScroll(true);
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        window.clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => {
          setPendingScroll(false);
          locateTarget();
        }, 420);
      } else {
        setTarget(null);
      }
      lastStepIdRef.current = currentStep.id;
    }

    return () => {
      window.clearTimeout(scrollTimeoutRef.current);
    };
}, [currentStep, isActive, locateTarget]);

  // Disable document scroll while the overlay is visible
  useEffect(() => {
    if (!isActive || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isActive]);

  const highlightStyle = useMemo(() => {
    if (!target || !hasWindow) return undefined;
    const { rect } = target;
    return {
      top: Math.max(rect.top - highlightPadding, 8),
      left: Math.max(rect.left - highlightPadding, 8),
      width: rect.width + highlightPadding * 2,
      height: rect.height + highlightPadding * 2,
    };
  }, [target, hasWindow]);

  const tooltipStyle = useMemo(() => {
    if (!target || !currentStep || !hasWindow) return undefined;
    const { rect } = target;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    switch (currentStep.placement) {
      case 'top':
        return {
          top: clamp(rect.top - 24, 16, viewportHeight - 16),
          left: clamp(rect.left + rect.width / 2, 16, viewportWidth - 16),
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: clamp(rect.bottom + 24, 16, viewportHeight - 16),
          left: clamp(rect.left + rect.width / 2, 16, viewportWidth - 16),
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: clamp(rect.top + rect.height / 2, 16, viewportHeight - 16),
          left: clamp(rect.left - 24, 16, viewportWidth - 16),
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: clamp(rect.top + rect.height / 2, 16, viewportHeight - 16),
          left: clamp(rect.right + 24, 16, viewportWidth - 16),
          transform: 'translate(0, -50%)',
        };
      case 'center':
      default:
        return {
          top: clamp(rect.top + rect.height / 2, 16, viewportHeight - 16),
          left: clamp(rect.left + rect.width / 2, 16, viewportWidth - 16),
          transform: 'translate(-50%, -50%)',
        };
    }
  }, [target, currentStep, hasWindow]);

  const pointerStyle = useMemo(() => {
    if (!target || !currentStep || !hasWindow) return undefined;
    const { rect } = target;
    const offsetX = currentStep.handOffset?.x ?? 0.5;
    const offsetY = currentStep.handOffset?.y ?? 0.5;
    const pointerSize = 48;
    return {
      top: rect.top + rect.height * offsetY - pointerSize / 2,
      left: rect.left + rect.width * offsetX - pointerSize / 2,
    };
  }, [target, currentStep, hasWindow]);

  if (!isActive || !portalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm pointer-events-auto" />

      {highlightStyle && (
        <div
          className="absolute border-2 border-blue-400/90 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.7)] transition-all duration-200 pointer-events-none"
          style={highlightStyle}
        />
      )}

      {pointerStyle && (
        <div
          className="absolute text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-bounce pointer-events-none"
          style={pointerStyle}
        >
          <Hand className="w-10 h-10" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!target && (
          <div className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/30 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {pendingScroll ? 'Bringing the step into view...' : 'Preparing this step'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {pendingScroll
                ? 'Scroll is in progress so we can highlight the right control.'
                : currentStep?.actionHint ||
                  'We could not locate the UI for this step. Make sure the relevant panel is visible.'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={skipTour}
              >
                Skip tour
              </button>
              <button
                className="px-4 py-2 text-sm rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                onClick={locateTarget}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      {target && tooltipStyle && (
        <div
          className="absolute w-[360px] max-w-[85vw] rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-white/20 shadow-[0_25px_60px_rgba(15,23,42,0.45)] p-6 pointer-events-auto"
          style={tooltipStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <span>{`Step ${currentStepIndex + 1}/${totalSteps}`}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">
                <Sparkles className="w-3 h-3" />
                Guided
              </span>
            </div>
            <button
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              onClick={skipTour}
              aria-label="Skip onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {currentStep?.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep?.description}
          </p>

          {currentStep?.actionHint && (
            <div className="mt-4 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>{currentStep.actionHint}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={skipTour}
              >
                Skip
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={isLastStep ? completeTour : nextStep}
              >
                {isLastStep ? 'Finish tour' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    portalRoot,
  );
}

