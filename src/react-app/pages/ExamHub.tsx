import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart3, Zap, BookOpen, FileText, Settings } from 'lucide-react';

// Import existing components
import PatternManagement from '@/react-app/pages/PatternManagement';
import ExamManagement from '@/react-app/pages/ExamManagementNew';
import Results from '@/react-app/pages/Results';
import SettingsPage from '@/react-app/pages/Settings';

// Import Statistics components
import StatisticsTab from '@/react-app/pages/ExamHubStatistics';

type TabType = 'statistics' | 'patterns' | 'exams' | 'results' | 'settings';

export default function ExamHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'statistics';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'statistics' as const, label: 'Statistics', icon: BarChart3 },
    { id: 'patterns' as const, label: 'Patterns', icon: Zap },
    { id: 'exams' as const, label: 'Exams', icon: BookOpen },
    { id: 'results' as const, label: 'Results', icon: FileText },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-0">
      {/* Tab Navigation - Fixed at top */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-gray-900 p-4 md:p-6 pb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-1">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div 
        key={activeTab} 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'patterns' && <PatternManagement />}
        {activeTab === 'exams' && <ExamManagement />}
        {activeTab === 'results' && <Results />}
        {activeTab === 'settings' && <SettingsPage />}
      </motion.div>
    </div>
  );
}
