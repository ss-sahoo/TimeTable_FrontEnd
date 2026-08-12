import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import type { OnboardingStep } from './tourSteps';
import { getProgressPercentage } from './tourSteps';

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

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

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

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 20; // More retries

  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = getProgressPercentage(currentStepIndex);

  // Find the target element
  const findTarget = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return false;
    }

    const element = document.querySelector(currentStep.selector) as HTMLElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
        retryCountRef.current = 0;
        return true;
      }
    }
    return false;
  }, [currentStep]);

  // Find target on step change with multiple retries
  useEffect(() => {
    if (!isActive || !currentStep) return;

    setTargetRect(null);
    retryCountRef.current = 0;

    // Try immediately
    if (findTarget()) return;

    // Set up interval for retries
    const interval = setInterval(() => {
      retryCountRef.current++;
      if (findTarget() || retryCountRef.current >= maxRetries) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isActive, currentStep, currentStepIndex, findTarget]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isActive || !targetRect) return;

    const handleUpdate = () => {
      if (currentStep) {
        const element = document.querySelector(currentStep.selector) as HTMLElement;
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
          });
        }
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isActive, targetRect, currentStep]);

  // Calculate tooltip position
  const tooltipPosition = useMemo(() => {
    const tooltipWidth = 340;
    const tooltipHeight = 220;
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If no target, center the tooltip
    if (!targetRect) {
      return {
        top: Math.max(padding, (viewportHeight - tooltipHeight) / 2),
        left: Math.max(padding, (viewportWidth - tooltipWidth) / 2),
      };
    }

    const placement = currentStep?.placement || 'bottom';
    let top: number;
    let left: number;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    }

    // Keep within viewport
    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    if (top < padding) {
      top = targetRect.bottom + padding;
    }
    if (top + tooltipHeight > viewportHeight - padding) {
      top = targetRect.top - tooltipHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    return { top, left };
  }, [targetRect, currentStep?.placement]);

  if (!isActive) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={skipTour}
      />

      {/* Spotlight on target element */}
      {targetRect && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            border: '3px solid #3b82f6',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: 340,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <button
              onClick={skipTour}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {currentStep?.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {currentStep?.description}
          </p>

          {/* Status indicator when searching */}
          {!targetRect && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Looking for element...</span>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? 'w-5 bg-blue-600'
                    : i < currentStepIndex
                    ? 'w-1.5 bg-blue-400'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex gap-2">
              <button
                onClick={skipTour}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Skip
              </button>
              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep?.nextButtonText || (isLastStep ? 'Finish' : 'Next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
