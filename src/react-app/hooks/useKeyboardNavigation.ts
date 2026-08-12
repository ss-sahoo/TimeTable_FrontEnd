import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onSpace?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  onDelete?: () => void;
  onBackspace?: () => void;
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11?: () => void;
  onF12?: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const {
      onEnter,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
      onSpace,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
      onDelete,
      onBackspace,
      onF1,
      onF2,
      onF3,
      onF4,
      onF5,
      onF6,
      onF7,
      onF8,
      onF9,
      onF10,
      onF11,
      onF12,
      preventDefault = false,
      stopPropagation = false
    } = options;

    if (stopPropagation) {
      event.stopPropagation();
    }

    if (preventDefault) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
        }
        break;
      case 'Tab':
        if (event.shiftKey && onShiftTab) {
          event.preventDefault();
          onShiftTab();
        } else if (onTab) {
          event.preventDefault();
          onTab();
        }
        break;
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace();
        }
        break;
      case 'Home':
        if (onHome) {
          event.preventDefault();
          onHome();
        }
        break;
      case 'End':
        if (onEnd) {
          event.preventDefault();
          onEnd();
        }
        break;
      case 'PageUp':
        if (onPageUp) {
          event.preventDefault();
          onPageUp();
        }
        break;
      case 'PageDown':
        if (onPageDown) {
          event.preventDefault();
          onPageDown();
        }
        break;
      case 'Delete':
        if (onDelete) {
          event.preventDefault();
          onDelete();
        }
        break;
      case 'Backspace':
        if (onBackspace) {
          event.preventDefault();
          onBackspace();
        }
        break;
      case 'F1':
        if (onF1) {
          event.preventDefault();
          onF1();
        }
        break;
      case 'F2':
        if (onF2) {
          event.preventDefault();
          onF2();
        }
        break;
      case 'F3':
        if (onF3) {
          event.preventDefault();
          onF3();
        }
        break;
      case 'F4':
        if (onF4) {
          event.preventDefault();
          onF4();
        }
        break;
      case 'F5':
        if (onF5) {
          event.preventDefault();
          onF5();
        }
        break;
      case 'F6':
        if (onF6) {
          event.preventDefault();
          onF6();
        }
        break;
      case 'F7':
        if (onF7) {
          event.preventDefault();
          onF7();
        }
        break;
      case 'F8':
        if (onF8) {
          event.preventDefault();
          onF8();
        }
        break;
      case 'F9':
        if (onF9) {
          event.preventDefault();
          onF9();
        }
        break;
      case 'F10':
        if (onF10) {
          event.preventDefault();
          onF10();
        }
        break;
      case 'F11':
        if (onF11) {
          event.preventDefault();
          onF11();
        }
        break;
      case 'F12':
        if (onF12) {
          event.preventDefault();
          onF12();
        }
        break;
    }
  }, [options]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return elementRef;
};

// Hook for managing focus within a container
export const useFocusManagement = () => {
  const containerRef = useRef<HTMLElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef<number>(0);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const elements = containerRef.current.querySelectorAll(focusableSelectors.join(', '));
    focusableElementsRef.current = Array.from(elements) as HTMLElement[];
    currentIndexRef.current = 0;
  }, []);

  const focusNext = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = (currentIndexRef.current + 1) % elements.length;
    elements[currentIndexRef.current]?.focus();
  }, [updateFocusableElements]);

  const focusPrevious = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = currentIndexRef.current === 0 
      ? elements.length - 1 
      : currentIndexRef.current - 1;
    elements[currentIndexRef.current]?.focus();
  }, [updateFocusableElements]);

  const focusFirst = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = 0;
    elements[0]?.focus();
  }, [updateFocusableElements]);

  const focusLast = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length === 0) return;

    currentIndexRef.current = elements.length - 1;
    elements[elements.length - 1]?.focus();
  }, [updateFocusableElements]);

  const focusByIndex = useCallback((index: number) => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length === 0 || index < 0 || index >= elements.length) return;

    currentIndexRef.current = index;
    elements[index]?.focus();
  }, [updateFocusableElements]);

  const focusByText = useCallback((text: string) => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    
    const element = elements.find(el => 
      el.textContent?.toLowerCase().includes(text.toLowerCase()) ||
      el.getAttribute('aria-label')?.toLowerCase().includes(text.toLowerCase())
    );

    if (element) {
      const index = elements.indexOf(element);
      currentIndexRef.current = index;
      element.focus();
    }
  }, [updateFocusableElements]);

  return {
    containerRef,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusByIndex,
    focusByText,
    updateFocusableElements
  };
};

// Hook for creating accessible keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      };

      // Create shortcut key
      const shortcutKey = [
        modifiers.ctrl && 'ctrl',
        modifiers.alt && 'alt',
        modifiers.shift && 'shift',
        modifiers.meta && 'meta',
        key
      ].filter(Boolean).join('+');

      // Check if shortcut exists
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for creating accessible roving tabindex
export const useRovingTabIndex = <T,>(items: T[]) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(prev => prev === 0 ? items.length - 1 : prev - 1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  }, [items.length]);

  const getTabIndex = useCallback((index: number) => {
    return index === activeIndex ? 0 : -1;
  }, [activeIndex]);

  const getAriaSelected = useCallback((index: number) => {
    return index === activeIndex;
  }, [activeIndex]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getTabIndex,
    getAriaSelected
  };
};
