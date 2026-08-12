import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log('ThemeToggle: Changing theme from', theme, 'to', newTheme);
    console.log('ThemeToggle: Current actualTheme:', actualTheme);
    console.log('ThemeToggle: Document element:', document.documentElement);
    console.log('ThemeToggle: Document classList:', document.documentElement.classList);
    setTheme(newTheme);
    
    // Force a re-check after a short delay
    setTimeout(() => {
      console.log('ThemeToggle: After theme change - classList:', document.documentElement.classList);
      console.log('ThemeToggle: After theme change - has dark class:', document.documentElement.classList.contains('dark'));
    }, 100);
  };

  return (
    <div className="relative">
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={`Switch to ${label} theme`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
