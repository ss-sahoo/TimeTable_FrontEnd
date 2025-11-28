export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  route: string;
  placement?: TourStepPlacement;
  nextButtonText?: string;
}

export type TourStepId = string;

// Simple 5-step tour that follows the natural workflow
export const onboardingTourSteps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: '👋 Welcome to DashoExams!',
    description: 'This quick tour will show you how to create exams. The workflow is: Patterns → Exams → Results. Let\'s start!',
    selector: '[data-tour-id="nav-patterns"]',
    route: '/dashboard',
    placement: 'right',
    nextButtonText: 'Next',
  },
  {
    id: 'step-2',
    title: '📐 Step 1: Patterns',
    description: 'First, create a Pattern. Patterns define your exam structure - subjects, sections, question types, and marking schemes.',
    selector: '[data-tour-id="cta-create-pattern"]',
    route: '/patterns',
    placement: 'bottom',
    nextButtonText: 'Next',
  },
  {
    id: 'step-3',
    title: '📝 Step 2: Exams',
    description: 'After creating a pattern, create Exams using it. Each exam uses a pattern but can have different questions.',
    selector: '[data-tour-id="cta-create-exam"]',
    route: '/exams',
    placement: 'bottom',
    nextButtonText: 'Next',
  },
  {
    id: 'step-4',
    title: '📅 Scheduling',
    description: 'Schedule your exams and send invitations to students. Set time windows and configure access settings.',
    selector: '[data-tour-id="panel-scheduling"]',
    route: '/exams',
    placement: 'bottom',
    nextButtonText: 'Next',
  },
  {
    id: 'step-5',
    title: '🎉 You\'re Ready!',
    description: 'That\'s it! Create Pattern → Create Exam → Add Questions → Schedule → View Results. Start by creating your first pattern!',
    selector: '[data-tour-id="nav-patterns"]',
    route: '/exams',
    placement: 'right',
    nextButtonText: 'Finish',
  },
];

export const getTotalSteps = () => onboardingTourSteps.length;

export const getProgressPercentage = (currentIndex: number) => {
  return Math.round(((currentIndex + 1) / onboardingTourSteps.length) * 100);
};
