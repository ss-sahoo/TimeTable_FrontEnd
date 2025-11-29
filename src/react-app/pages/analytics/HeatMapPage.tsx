import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import { Grid3X3, TrendingUp, TrendingDown, Users, BookOpen } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

interface HeatMapData {
  exam: {
    id: number;
    title: string;
  };
  heatmap_data: Array<{
    section_id: number;
    section_name: string;
    subject: string;
    average_score: number;
    average_percentage: number;
    max_marks: number;
    total_questions: number;
    total_attempts: number;
    performance_level: string;
  }>;
  filters_applied: any;
}

const performanceConfig = {
  excellent: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'emerald' as const,
  },
  good: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'blue' as const,
  },
  average: {
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    ring: 'amber' as const,
  },
  poor: {
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    ring: 'rose' as const,
  },
};

export default function HeatMapPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<HeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

  useEffect(() => {
    loadHeatMapData();
  }, [examId, queryParams]);

  const loadHeatMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/heatmap/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load heat map data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const getConfig = (level: string) => {
    return performanceConfig[level as keyof typeof performanceConfig] || performanceConfig.average;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Heat Map"
        subtitle="Section and subject performance visualization"
        icon={Grid3X3}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid
              </button>
            </div>
            <ModernExportButton onExport={handleExport} />
          </div>
        }
      />

      <ModernChartContainer loading={loading} error={error} height="auto" onRetry={loadHeatMapData}>
        {data && (
          <div>
            {data.heatmap_data.length === 0 ? (
              <div className="text-center py-16">
                <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No heat map data available</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.heatmap_data.map((item, index) => {
                  const config = getConfig(item.performance_level);
                  return (
                    <motion.div
                      key={item.section_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={`
                        relative overflow-hidden rounded-2xl ${config.bg} ${config.border} border
                        p-6 cursor-pointer transition-shadow hover:shadow-xl
                      `}
                    >
                      {/* Decorative gradient */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{item.section_name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {item.subject}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${config.badge}`}>
                          {item.performance_level}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <ProgressRing
                          value={item.average_percentage}
                          size={80}
                          strokeWidth={6}
                          color={config.ring}
                          label="Score"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Average Score</span>
                            <span className="text-sm font-bold text-slate-900">
                              {item.average_score.toFixed(1)} / {item.max_marks}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Questions</span>
                            <span className="text-sm font-semibold text-slate-700">{item.total_questions}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Attempts</span>
                            <span className="text-sm font-semibold text-slate-700">{item.total_attempts}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Grid View - Actual Heat Map */
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-4 text-xs">
                  <span className="text-slate-500">Performance:</span>
                  {Object.entries(performanceConfig).map(([level, config]) => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded bg-gradient-to-r ${config.gradient}`} />
                      <span className="text-slate-600 capitalize">{level}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {data.heatmap_data.map((item, index) => {
                    const config = getConfig(item.performance_level);
                    return (
                      <motion.div
                        key={item.section_id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        className={`
                          relative overflow-hidden rounded-xl bg-gradient-to-br ${config.gradient}
                          p-4 text-white cursor-pointer shadow-lg
                        `}
                        style={{
                          boxShadow: `0 10px 30px -10px ${
                            item.performance_level === 'excellent' ? 'rgba(16, 185, 129, 0.4)' :
                            item.performance_level === 'good' ? 'rgba(59, 130, 246, 0.4)' :
                            item.performance_level === 'average' ? 'rgba(245, 158, 11, 0.4)' :
                            'rgba(244, 63, 94, 0.4)'
                          }`
                        }}
                      >
                        <div className="absolute inset-0 bg-white/10" />
                        <div className="relative">
                          <p className="text-xs font-medium text-white/80 truncate">{item.section_name}</p>
                          <p className="text-2xl font-bold mt-1">{item.average_percentage.toFixed(0)}%</p>
                          <p className="text-xs text-white/70 mt-1">{item.total_questions} questions</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ModernChartContainer>

      {/* Legend */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {Object.entries(performanceConfig).map(([level, config]) => (
            <div key={level} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-lg bg-gradient-to-r ${config.gradient}`} />
              <span className="text-sm text-slate-600 capitalize">{level}</span>
              <span className="text-xs text-slate-400">
                ({level === 'excellent' ? '≥80%' : level === 'good' ? '60-79%' : level === 'average' ? '40-59%' : '<40%'})
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
