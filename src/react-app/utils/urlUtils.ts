/**
 * Get the frontend base URL for generating shareable links.
 * Uses environment variable if set, otherwise uses current domain (excluding localhost).
 */
export function getFrontendUrl(): string {
  // Check for environment variable first
  const envUrl = import.meta.env.VITE_FRONTEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // In production, use the current domain (but not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // If not localhost, use the current domain
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    }
  }

  // Fallback: return empty string or a default (you can set your production domain here)
  // For development, you might want to return your actual domain
  return '';
}

/**
 * Generate a shareable public exam link
 */
export function getPublicExamLink(token: string): string {
  const baseUrl = getFrontendUrl();
  if (!baseUrl) {
    // Fallback to current origin if no base URL is configured
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/public-exam/${token}`
      : `/public-exam/${token}`;
  }
  return `${baseUrl}/public-exam/${token}`;
}

/**
 * Generate a shareable exam view link
 */
export function getExamViewLink(examId: number | string): string {
  const baseUrl = getFrontendUrl();
  if (!baseUrl) {
    // Fallback to current origin if no base URL is configured
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/exam-view/${examId}`
      : `/exam-view/${examId}`;
  }
  return `${baseUrl}/exam-view/${examId}`;
}

