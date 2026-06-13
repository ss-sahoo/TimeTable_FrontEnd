import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './useApi';

interface ViolationMetadata {
  action?: string;
  key?: string;
  url?: string;
  [key: string]: unknown;
}

interface ViolationData {
  type: string;
  timestamp: Date;
  metadata?: ViolationMetadata;
}

interface SecurityConfig {
  maxViolations: number;
  enableTabMonitoring: boolean;
  enableFullscreenEnforcement: boolean;
  enableCopyPasteBlocking: boolean;
  enableRightClickBlocking: boolean;
  enableContextMenuBlocking: boolean;
  initialViolationCount?: number;
}

interface UseExamSecurityReturn {
  violations: ViolationData[];
  violationCount: number;
  isDisqualified: boolean;
  logViolation: (type: string, metadata?: ViolationMetadata, skipBackend?: boolean) => void;
  syncViolationCount: (count: number) => void;
  clearViolations: () => void;
  isFullscreen: boolean;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

const useExamSecurity = (
  attemptId: number,
  config: SecurityConfig = {
    maxViolations: 5,
    enableTabMonitoring: true,
    enableFullscreenEnforcement: true,
    enableCopyPasteBlocking: true,
    enableRightClickBlocking: true,
    enableContextMenuBlocking: true,
    initialViolationCount: 0,
  }
): UseExamSecurityReturn => {
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [violationCount, setViolationCount] = useState(config.initialViolationCount || 0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync with initial count from backend when it becomes available
  useEffect(() => {
    if (config.initialViolationCount !== undefined && config.initialViolationCount > violationCount) {
      setViolationCount(config.initialViolationCount);
    }
  }, [config.initialViolationCount]);

  const violationCooldowns = useRef<Record<string, number>>({});
  const lastViolationTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now()); // Grace period start time

  // Log security configuration on initialization
  useEffect(() => {
    // Only log once on mount
    console.log('🔒 EXAM SECURITY ACTIVE', { attemptId, max: config.maxViolations, initialCount: config.initialViolationCount });
  }, []);

  // Log violation to backend
  const logViolationToBackend = useCallback(async (type: string, metadata?: ViolationMetadata) => {
    try {
      const response = await api.post(`/exams/attempts/${attemptId}/violations/`, {
        violation_type: type,
        metadata: metadata || {}
      });

      const data = response.data;
      return data;
    } catch {
      // Quiet error logging
    }
  }, [attemptId]);

  // Log violation
  const logViolation = useCallback((type: string, metadata?: ViolationMetadata, skipBackend: boolean = false) => {
    const now = Date.now();
    const lastTime = violationCooldowns.current[type] || 0;

    // Strict cooldown to avoid spamming the student
    // 10s for same type (prevents accidental double trigger)
    // 2s across any type (global breathing room)
    if (now - lastTime < 10000 || now - lastViolationTimeRef.current < 2000) {
      console.log(`🛡️ Violation suppressed (cooldown): ${type}`);
      return;
    }

    violationCooldowns.current[type] = now;
    lastViolationTimeRef.current = now;

    console.log(`🚫 Security Violation: ${type}${skipBackend ? ' (Backend sync skipped)' : ''}`, metadata);

    // Trigger proctoring video chunk upload for ALL violations
    if (typeof (window as any).proctoringMarkIncident === 'function') {
      (window as any).proctoringMarkIncident();
    }

    const violation: ViolationData = {
      type,
      timestamp: new Date(),
      metadata
    };

    setViolations(prev => {
      // Only keep last 50 violations in state to prevent memory issues
      const newViolations = [...prev, violation];
      return newViolations.length > 50 ? newViolations.slice(-50) : newViolations;
    });

    // Only increment count for HARD violations (visual or system breach)
    // SOFT violations (audio noise, voice) are logged but don't count towards penalty/disqualification
    const SOFT_VIOLATIONS = ['audio_noise', 'audio_voice_detected'];
    if (!SOFT_VIOLATIONS.includes(type)) {
      setViolationCount(prev => prev + 1);
    }

    // Log to backend if not already logged (e.g. by webcam analyzer)
    if (!skipBackend) {
      logViolationToBackend(type, metadata);
    }
  }, [config.maxViolations, logViolationToBackend]);

  // Check for disqualification
  useEffect(() => {
    if (violationCount >= config.maxViolations) {
      console.log('🔴 DISQUALIFICATION LIMIT REACHED');
      setIsDisqualified(true);
    }
  }, [violationCount, config.maxViolations]);

  // Clear violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    setViolationCount(0);
    setIsDisqualified(false);
    violationCooldowns.current = {};
  }, []);

  // Tab visibility monitoring
  useEffect(() => {
    if (!config.enableTabMonitoring) {
      console.log('📑 Tab monitoring: DISABLED');
      return;
    }

    console.log('📑 Tab monitoring: ENABLED');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📑 TAB SWITCH detected - logging violation');
        logViolation('tab_switch', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
    };

    const handleBlur = () => {
      // 🛡️ GRACE PERIOD: Ignore window blur for the first 60 seconds (covers permission popups)
      if (Date.now() - startTimeRef.current < 60000) {
        console.log('🪟 WINDOW BLUR ignored during setup grace period');
        return;
      }

      console.log('🪟 WINDOW BLUR detected - logging violation');
      logViolation('window_blur', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [config.enableTabMonitoring, logViolation]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!config.enableFullscreenEnforcement) return;

    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && isFullscreen) {
        logViolation('fullscreen_exit', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [config.enableFullscreenEnforcement, isFullscreen, logViolation]);

  // Copy/Paste blocking
  useEffect(() => {
    if (!config.enableCopyPasteBlocking) {
      console.log('📋 Copy/Paste monitoring: DISABLED');
      return;
    }

    console.log('📋 Copy/Paste monitoring: ENABLED');

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      console.log('📋 COPY detected - preventing and logging violation');
      logViolation('copy_paste', {
        action: 'copy',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      console.log('📋 PASTE detected - preventing and logging violation');
      logViolation('copy_paste', {
        action: 'paste',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      console.log('✂️ CUT detected - preventing and logging violation');
      logViolation('copy_paste', {
        action: 'cut',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [config.enableCopyPasteBlocking, logViolation]);

  // Right-click blocking
  useEffect(() => {
    if (!config.enableRightClickBlocking) {
      console.log('🖱️ Right-click monitoring: DISABLED');
      return;
    }

    console.log('🖱️ Right-click monitoring: ENABLED');

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.log('🖱️ RIGHT CLICK detected - preventing and logging violation');
      logViolation('right_click', {
        timestamp: new Date().toISOString(),
        x: e.clientX,
        y: e.clientY,
        userAgent: navigator.userAgent
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [config.enableRightClickBlocking, logViolation]);

  // Keyboard shortcuts blocking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      const blockedShortcuts = [
        'F12', // Developer tools
        'Ctrl+Shift+I', // Developer tools
        'Ctrl+Shift+J', // Console
        'Ctrl+U', // View source
        'Ctrl+S', // Save
        'Ctrl+P', // Print
        'Ctrl+Shift+P', // Command palette
        'Alt+Tab', // Switch applications
        'Ctrl+Tab', // Switch tabs
        'Ctrl+W', // Close tab
        'Ctrl+T', // New tab
        'Ctrl+N', // New window
        'Ctrl+R', // Refresh
        'F5', // Refresh
        'Ctrl+F5', // Hard refresh
      ];

      const keyCombo = e.ctrlKey ? `Ctrl+${e.key}` :
        e.altKey ? `Alt+${e.key}` :
          e.shiftKey ? `Shift+${e.key}` :
            e.key;

      if (blockedShortcuts.includes(keyCombo) ||
        blockedShortcuts.includes(e.key) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')) {
        e.preventDefault();
        logViolation('keyboard_shortcut', {
          keyCombo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [logViolation]);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }

      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to request fullscreen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logViolation('fullscreen_error', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }, [logViolation]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      };

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }

      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Note: Fullscreen can only be requested by user gesture, not automatically
  // The requestFullscreen function is available for manual triggering

  // Prevent page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? This will end your exam.';
      return 'Are you sure you want to leave? This will end your exam.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    violations,
    violationCount,
    isDisqualified,
    logViolation,
    syncViolationCount: setViolationCount,
    clearViolations,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
  };
};

export default useExamSecurity;

