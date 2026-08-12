/**
 * Get the frontend base URL for generating shareable links.
 * Uses environment variable if set, otherwise uses production domain.
 */
const PRODUCTION_DOMAIN = 'https://exams.dashoapp.com';

export function getFrontendUrl(): string {
  // Check for environment variable first
  const envUrl = import.meta.env.VITE_FRONTEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Always use production domain for shareable links (never localhost)
  return PRODUCTION_DOMAIN;
}

/**
 * Generate a shareable public exam link
 */
export function getPublicExamLink(token: string): string {
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/public-exam/${token}`;
}

/**
 * Generate a shareable exam view link
 */
export function getExamViewLink(examId: number | string): string {
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/exam-view/${examId}`;
}

/**
 * Normalize a URL by replacing localhost with production domain
 * This ensures backend URLs with localhost are converted to production domain
 */
export function normalizeShareUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Replace any localhost URL with production domain
  const localhostPattern = /https?:\/\/localhost(:\d+)?/gi;
  const productionDomain = getFrontendUrl();
  
  return url.replace(localhostPattern, productionDomain);
}

