import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, CheckCircle } from 'lucide-react';

export default function ThemeTest() {
  const { theme, actualTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Theme System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the light/dark mode functionality
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-xl border border-blue-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Theme Setting</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{theme}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Theme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{actualTheme}</p>
            </div>
          </div>
        </div>

        {/* Theme Buttons */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Switch Theme</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all ${
                theme === 'light' 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:scale-105'
              }`}
            >
              <Sun className="w-5 h-5" />
              Light
              {theme === 'light' && <CheckCircle className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:scale-105'
              }`}
            >
              <Moon className="w-5 h-5" />
              Dark
              {theme === 'dark' && <CheckCircle className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={() => setTheme('system')}
              className={`flex items-center gap-3 px-6 py-4 rounded-lg font-semibold transition-all ${
                theme === 'system' 
                  ? 'bg-green-600 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:scale-105'
              }`}
            >
              <Monitor className="w-5 h-5" />
              System
              {theme === 'system' && <CheckCircle className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Visual Examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Visual Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Example Card</h3>
              <p className="text-gray-600 dark:text-gray-400">
                This card adapts to the current theme
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-xl">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Gradient Card</h3>
              <p className="text-blue-700 dark:text-blue-300">
                With gradient backgrounds
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Input Example</h3>
              <input 
                type="text" 
                placeholder="Type something..." 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Button Example</h3>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Action Button
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-300 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Debug Information</h2>
          <div className="space-y-2 font-mono text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Theme Setting:</span> {theme}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Actual Theme:</span> {actualTheme}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">HTML Classes:</span> {document.documentElement.className || '(none)'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Has Dark Class:</span> {document.documentElement.classList.contains('dark') ? 'Yes ✅' : 'No ❌'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
