import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announcements: boolean;
}

interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: true,
    announcements: true
  });

  const [announcements, setAnnouncements] = useState<AccessibilityAnnouncement[]>([]);
  const [focusManager, setFocusManager] = useState<{
    trapFocus: boolean;
    restoreFocus: boolean;
    lastFocusedElement: HTMLElement | null;
  }>({
    trapFocus: false,
    restoreFocus: false,
    lastFocusedElement: null
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }

    // Detect screen reader
    const detectScreenReader = () => {
      const isScreenReader = !!(
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.navigator.userAgent.includes('VoiceOver') ||
        window.navigator.userAgent.includes('Orca') ||
        window.speechSynthesis?.speak
      );
      setSettings(prev => ({ ...prev, screenReader: isScreenReader }));
    };

    detectScreenReader();

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSettings(prev => ({ ...prev, reducedMotion: mediaQuery.matches }));

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [settings]);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return;

    const announcement: AccessibilityAnnouncement = {
      id: `announcement-${Date.now()}`,
      message,
      priority,
      timestamp: Date.now()
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);

    // Use live region for screen readers
    const liveRegion = document.getElementById('accessibility-live-region') || createLiveRegion();
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // Clear after a short delay
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }, [settings.announcements]);

  // Create live region for announcements
  const createLiveRegion = () => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'accessibility-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    return liveRegion;
  };

  // Focus management
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Restore focus
  const restoreFocus = useCallback(() => {
    if (focusManager.lastFocusedElement) {
      focusManager.lastFocusedElement.focus();
    }
  }, [focusManager.lastFocusedElement]);

  // Save current focus
  const saveFocus = useCallback(() => {
    setFocusManager(prev => ({
      ...prev,
      lastFocusedElement: document.activeElement as HTMLElement
    }));
  }, []);

  // Keyboard navigation helpers
  const handleKeyDown = useCallback((e: KeyboardEvent, onEnter?: () => void, onEscape?: () => void) => {
    if (!settings.keyboardNavigation) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
    }
  }, [settings.keyboardNavigation]);

  // Skip to content
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
      announce('Skipped to main content');
    }
  }, [announce]);

  // Skip to navigation
  const skipToNavigation = useCallback(() => {
    const navigation = document.getElementById('main-navigation');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView();
      announce('Skipped to navigation');
    }
  }, [announce]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Toggle specific setting
  const toggleSetting = useCallback((setting: keyof AccessibilitySettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  // Get ARIA attributes for interactive elements
  const getAriaAttributes = useCallback((options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
  }) => {
    const attrs: Record<string, string | boolean> = {};
    
    if (options.label) attrs['aria-label'] = options.label;
    if (options.describedBy) attrs['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) attrs['aria-expanded'] = options.expanded;
    if (options.selected !== undefined) attrs['aria-selected'] = options.selected;
    if (options.disabled !== undefined) attrs['aria-disabled'] = options.disabled;
    if (options.required !== undefined) attrs['aria-required'] = options.required;
    if (options.invalid !== undefined) attrs['aria-invalid'] = options.invalid;

    return attrs;
  }, []);

  // Get focus styles
  const getFocusStyles = useCallback(() => {
    return {
      outline: settings.focusVisible ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px',
      borderRadius: '4px'
    };
  }, [settings.focusVisible]);

  return {
    settings,
    announcements,
    focusManager,
    announce,
    trapFocus,
    restoreFocus,
    saveFocus,
    handleKeyDown,
    skipToContent,
    skipToNavigation,
    updateSettings,
    toggleSetting,
    getAriaAttributes,
    getFocusStyles
  };
};
