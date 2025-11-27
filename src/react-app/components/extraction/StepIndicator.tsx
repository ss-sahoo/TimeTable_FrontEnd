import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: number;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <li
              key={step.id}
              className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 -ml-px">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div className="relative flex flex-col items-center group">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isComplete
                      ? '#4F46E5'
                      : isCurrent
                      ? '#6366F1'
                      : '#E5E7EB',
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isComplete || isCurrent ? 'text-white' : 'text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-indigo-100' : ''}
                    transition-all duration-300
                  `}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-indigo-600'
                        : isComplete
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                    {step.description}
                  </p>
                </div>

                {/* Current Step Indicator */}
                {isCurrent && (
                  <motion.div
                    layoutId="currentStep"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  </motion.div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
