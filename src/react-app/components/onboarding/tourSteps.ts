export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface OnboardingStep {
  id: TourStepId;
  title: string;
  description: string;
  /**
   * CSS selector used by the overlay to find and highlight the target element.
   * Prefer data attributes (e.g. [data-tour-id=\"nav-patterns\"]) to keep it resilient.
   */
  selector: string;
  /**
   * Route the user should be on before we attempt to highlight the step.
   * The controller will auto-navigate when needed.
   */
  route: string;
  /**
   * Visual hint for where the tooltip should sit relative to the highlighted element.
   */
  placement?: TourStepPlacement;
  /**
   * Optional fine-tuning for the hand icon so we can match the Zoho-inspired pointer look.
   */
  handOffset?: { x: number; y: number };
  /**
   * Some steps require a prep action (e.g. auto-opening a modal). The controller can hook into it later.
   */
  actionHint?: string;
}

export type TourStepId =
  | 'patterns-nav'
  | 'pattern-cta'
  | 'exam-creation'
  | 'scheduling'
  | 'live-monitoring'
  | 'analytics';

export const onboardingTourSteps: OnboardingStep[] = [
  {
    id: 'patterns-nav',
    title: 'Blueprint every exam',
    description:
      'Start with the Pattern Builder to define sections, scoring rules, and the exact structure your institute expects.',
    selector: '[data-tour-id=\"nav-patterns\"]',
    route: '/patterns',
    placement: 'bottom',
    handOffset: { x: 0.8, y: 1.4 },
  },
  {
    id: 'pattern-cta',
    title: 'Spin up a new pattern',
    description:
      'Use the “Create Pattern” action to capture subject-wise sections, adaptive scoring, and reusable templates.',
    selector: '[data-tour-id=\"cta-create-pattern\"]',
    route: '/patterns',
    placement: 'left',
    handOffset: { x: -1.2, y: 0.8 },
  },
  {
    id: 'exam-creation',
    title: 'Build the live exam experience',
    description:
      'Move into Exam Creation to pull questions, attach proctoring rules, and preview what candidates will see.',
    selector: '[data-tour-id=\"cta-create-exam\"]',
    route: '/exams',
    placement: 'left',
    handOffset: { x: -1, y: 1 },
  },
  {
    id: 'scheduling',
    title: 'Schedule & invite effortlessly',
    description:
      'The scheduling workspace lets you lock slots, send branded invites, and automate reminders with one click.',
    selector: '[data-tour-id=\"panel-scheduling\"]',
    route: '/exams',
    placement: 'top',
    handOffset: { x: 0.5, y: -1.2 },
    actionHint: 'Ensure scheduling drawer is expanded',
  },
  {
    id: 'live-monitoring',
    title: 'Monitor in real time',
    description:
      'AI-powered proctoring dashboards flag anomalies instantly so your invigilators can intervene proactively.',
    selector: '[data-tour-id=\"panel-proctoring\"]',
    route: '/violation-dashboard',
    placement: 'top',
    handOffset: { x: 0.2, y: -1 },
  },
  {
    id: 'analytics',
    title: 'Debrief with deep analytics',
    description:
      'Results & analytics surfaces cohort trends, topic mastery, and predictive insights for the next exam cycle.',
    selector: '[data-tour-id=\"panel-analytics\"]',
    route: '/results',
    placement: 'top',
    handOffset: { x: 0.6, y: -1.1 },
  },
];

