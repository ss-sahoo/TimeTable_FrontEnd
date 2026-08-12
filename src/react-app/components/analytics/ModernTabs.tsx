import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
}

interface ModernTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md';
}

export default function ModernTabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
}: ModernTabsProps) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  };

  if (variant === 'pills') {
    return (
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative ${sizeClasses[size]} font-medium rounded-lg transition-all duration-200
                flex items-center gap-2
                ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`
                    px-1.5 py-0.5 text-[10px] font-bold rounded-full
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative ${sizeClasses[size]} font-medium transition-colors duration-200
                flex items-center gap-2 pb-3
                ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-[10px] font-bold rounded-full
                  ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}
                `}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Cards variant
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-3 rounded-xl font-medium transition-all duration-200
              flex flex-col items-center gap-2 text-center
              ${isActive 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
              }
            `}
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span className="text-xs">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
