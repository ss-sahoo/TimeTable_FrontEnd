import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import { BoxSelect, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';

interface BoxPlotData {
  exam: {
    id: number;
    title: string;
  };
  boxplot_data: Array<{
    section_id?: number;
    section_name?: string;
    subject?: string;
    scores: number[];
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
    outliers: number[];
    iqr: number;
    lower_bound: number;
    upper_bound: number;
  }> | {
    scores: number[];
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
    outliers: number[];
    iqr: number;
    lower_bound: number;
    upper_bound: number;
  };
  filters_applied: any;
}

// Custom Box Plot Visualization Component
function BoxPlotVisualization({ 
  quartiles, 
  outliers, 
  maxPossible = 100 
}: { 
  quartiles: { min: number; q1: number; median: number; q3: number; max: number };
  outliers: number[];
  maxPossible?: number;
}) {
  const scale = (value: number) => (value / maxPossible) * 100;
  
  return (
    <div className="relative h-16 my-4">
      {/* Background track */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full" />
      
      {/* Whiskers */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-400"
        style={{ 
          left: `${scale(quartiles.min)}%`, 
          width: `${scale(quartiles.q1 - quartiles.min)}%` 
        }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-400"
        style={{ 
          left: `${scale(quartiles.q3)}%`, 
          width: `${scale(quartiles.max - quartiles.q3)}%` 
        }}
      />
      
      {/* Min/Max caps */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400"
        style={{ left: `${scale(quartiles.min)}%` }}
      />
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400"
        style={{ left: `${scale(quartiles.max)}%` }}
      />
      
      {/* IQR Box */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg shadow-lg"
        style={{ 
          left: `${scale(quartiles.q1)}%`, 
          width: `${scale(quartiles.q3 - quartiles.q1)}%` 
        }}
      />
      
      {/* Median line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-white rounded-full shadow-md"
        style={{ left: `${scale(quartiles.median)}%`, marginLeft: '-2px' }}
      />
      
      {/* Outliers */}
      {outliers.slice(0, 10).map((outlier, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + index * 0.05 }}
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-500 rounded-full shadow-md"
          style={{ left: `${scale(outlier)}%`, marginLeft: '-4px' }}
        />
      ))}
      
      {/* Labels */}
      <div className="absolute -bottom-6 text-[10px] text-slate-500" style={{ left: `${scale(quartiles.min)}%`, transform: 'translateX(-50%)' }}>
        {quartiles.min.toFixed(1)}
      </div>
      <div className="absolute -bottom-6 text-[10px] text-slate-500" style={{ left: `${scale(quartiles.q1)}%`, transform: 'translateX(-50%)' }}>
        Q1: {quartiles.q1.toFixed(1)}
      </div>
      <div className="absolute -bottom-6 text-[10px] font-semibold text-blue-600" style={{ left: `${scale(quartiles.median)}%`, transform: 'translateX(-50%)' }}>
        {quartiles.median.toFixed(1)}
      </div>
      <div className="absolute -bottom-6 text-[10px] text-slate-500" style={{ left: `${scale(quartiles.q3)}%`, transform: 'translateX(-50%)' }}>
        Q3: {quartiles.q3.toFixed(1)}
      </div>
      <div className="absolute -bottom-6 text-[10px] text-slate-500" style={{ left: `${scale(quartiles.max)}%`, transform: 'translateX(-50%)' }}>
        {quartiles.max.toFixed(1)}
      </div>
    </div>
  );
}

export default function BoxPlotPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<BoxPlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoxPlotData();
  }, [examId, queryParams]);

  const loadBoxPlotData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/boxplot/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load box plot data'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const isArray = Array.isArray(data?.boxplot_data);

  const QuartileCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-xl p-4 text-center
        ${color === 'blue' ? 'bg-blue-50 border border-blue-200' : 
          color === 'emerald' ? 'bg-emerald-50 border border-emerald-200' :
          color === 'amber' ? 'bg-amber-50 border border-amber-200' :
          color === 'rose' ? 'bg-rose-50 border border-rose-200' :
          'bg-slate-50 border border-slate-200'}
      `}
    >
      <Icon className={`w-4 h-4 mx-auto mb-2 ${
        color === 'blue' ? 'text-blue-500' : 
        color === 'emerald' ? 'text-emerald-500' :
        color === 'amber' ? 'text-amber-500' :
        color === 'rose' ? 'text-rose-500' :
        'text-slate-500'
      }`} />
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${
        color === 'blue' ? 'text-blue-700' : 
        color === 'emerald' ? 'text-emerald-700' :
        color === 'amber' ? 'text-amber-700' :
        color === 'rose' ? 'text-rose-700' :
        'text-slate-700'
      }`}>
        {value.toFixed(2)}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Box Plot"
        subtitle="Score distribution quartiles and outliers"
        icon={BoxSelect}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      <ModernChartContainer loading={loading} error={error} height="auto" onRetry={loadBoxPlotData}>
        {data && (
          <div className="space-y-8">
            {isArray ? (
              // Multiple box plots for sections
              <div className="space-y-8">
                {(data.boxplot_data as any[]).map((item, index) => (
                  <motion.div
                    key={item.section_id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlassCard>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{item.section_name}</h3>
                          <p className="text-sm text-slate-500">{item.subject}</p>
                        </div>
                        {item.outliers.length > 0 && (
                          <span className="px-3 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                            {item.outliers.length} outliers
                          </span>
                        )}
                      </div>
                      
                      <BoxPlotVisualization 
                        quartiles={item.quartiles} 
                        outliers={item.outliers}
                        maxPossible={Math.max(item.quartiles.max * 1.2, 100)}
                      />
                      
                      <div className="grid grid-cols-5 gap-3 mt-10">
                        <QuartileCard label="Min" value={item.quartiles.min} icon={TrendingDown} color="rose" />
                        <QuartileCard label="Q1 (25%)" value={item.quartiles.q1} icon={Minus} color="amber" />
                        <QuartileCard label="Median" value={item.quartiles.median} icon={Minus} color="blue" />
                        <QuartileCard label="Q3 (75%)" value={item.quartiles.q3} icon={Minus} color="emerald" />
                        <QuartileCard label="Max" value={item.quartiles.max} icon={TrendingUp} color="emerald" />
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Single box plot
              <div className="space-y-6">
                <GlassCard>
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Overall Score Distribution</h3>
                  
                  <BoxPlotVisualization 
                    quartiles={(data.boxplot_data as any).quartiles} 
                    outliers={(data.boxplot_data as any).outliers}
                    maxPossible={Math.max((data.boxplot_data as any).quartiles.max * 1.2, 100)}
                  />
                  
                  <div className="grid grid-cols-5 gap-3 mt-10">
                    <QuartileCard label="Min" value={(data.boxplot_data as any).quartiles.min} icon={TrendingDown} color="rose" />
                    <QuartileCard label="Q1 (25%)" value={(data.boxplot_data as any).quartiles.q1} icon={Minus} color="amber" />
                    <QuartileCard label="Median" value={(data.boxplot_data as any).quartiles.median} icon={Minus} color="blue" />
                    <QuartileCard label="Q3 (75%)" value={(data.boxplot_data as any).quartiles.q3} icon={Minus} color="emerald" />
                    <QuartileCard label="Max" value={(data.boxplot_data as any).quartiles.max} icon={TrendingUp} color="emerald" />
                  </div>
                </GlassCard>
                
                {(data.boxplot_data as any).outliers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900">Outliers Detected</h4>
                        <p className="text-sm text-amber-700">{(data.boxplot_data as any).outliers.length} scores outside normal range</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(data.boxplot_data as any).outliers.slice(0, 15).map((outlier: number, index: number) => (
                        <motion.span
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.03 }}
                          className="px-3 py-1.5 text-sm font-medium bg-white/80 text-amber-800 rounded-lg border border-amber-200"
                        >
                          {outlier.toFixed(2)}
                        </motion.span>
                      ))}
                      {(data.boxplot_data as any).outliers.length > 15 && (
                        <span className="px-3 py-1.5 text-sm text-amber-600">
                          +{(data.boxplot_data as any).outliers.length - 15} more
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </ModernChartContainer>

      {/* Legend */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded" />
            <span className="text-slate-600">Interquartile Range (IQR)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-slate-400" />
            <span className="text-slate-600">Whiskers (Min/Max)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-white border border-slate-300 rounded" />
            <span className="text-slate-600">Median</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            <span className="text-slate-600">Outliers</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
