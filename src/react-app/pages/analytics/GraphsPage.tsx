import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { LineChart as LineChartIcon, BarChart3, ScatterChart as ScatterIcon, TrendingUp, Clock, Layers } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ModernTabs from '@/react-app/components/analytics/ModernTabs';

interface GraphsData {
  exam: {
    id: number;
    title: string;
  };
  score_trend: Array<{
    date: string;
    score: number;
    percentage: number;
    time_spent: number;
  }>;
  submission_distribution: Record<number, number>;
  section_performance: Array<{
    section_name: string;
    subject: string;
    average_score: number;
    average_percentage: number;
    total_attempts: number;
  }>;
  time_score_data: Array<{
    time_spent: number;
    score: number;
    percentage: number;
  }>;
  filters_applied: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-4 shadow-xl">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-slate-600">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value?.toFixed?.(2) || entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function GraphsPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<GraphsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGraph, setActiveGraph] = useState<'trend' | 'distribution' | 'section' | 'scatter'>('trend');

  useEffect(() => {
    loadGraphsData();
  }, [examId, queryParams]);

  const loadGraphsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/graphs/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load graphs data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const trendData = data?.score_trend.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.score,
    percentage: item.percentage,
  })) || [];

  const distributionData = data?.submission_distribution
    ? Object.entries(data.submission_distribution)
        .map(([hour, count]) => ({
          hour: `${hour}:00`,
          count,
        }))
        .sort((a, b) => Number(a.hour.split(':')[0]) - Number(b.hour.split(':')[0]))
    : [];

  const sectionData = data?.section_performance || [];

  const scatterData = data?.time_score_data.map((item) => ({
    time: Math.round(item.time_spent / 60),
    score: item.score,
    percentage: item.percentage,
  })) || [];

  const tabs = [
    { id: 'trend', label: 'Score Trend', icon: TrendingUp },
    { id: 'distribution', label: 'Submissions', icon: Clock },
    { id: 'section', label: 'Sections', icon: Layers },
    { id: 'scatter', label: 'Time vs Score', icon: ScatterIcon },
  ];

  // Generate gradient colors for bars
  const getBarColor = (index: number, total: number) => {
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Performance Graphs"
        subtitle="Time-series and trend visualizations"
        icon={LineChartIcon}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      {/* Graph Selector */}
      <GlassCard padding="sm">
        <ModernTabs
          tabs={tabs}
          activeTab={activeGraph}
          onChange={(id) => setActiveGraph(id as typeof activeGraph)}
          variant="pills"
        />
      </GlassCard>

      <ModernChartContainer loading={loading} error={error} height={550} onRetry={loadGraphsData}>
        {data && (
          <div className="space-y-6">
            {activeGraph === 'trend' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Score Trend Over Time</h3>
                    <p className="text-sm text-slate-500">Track performance changes across submissions</p>
                  </div>
                </div>
                {trendData.length === 0 ? (
                  <div className="text-center py-16">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No trend data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="percentageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: 20 }}
                        formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fill="url(#scoreGradient)" 
                        name="Score"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fill="url(#percentageGradient)" 
                        name="Percentage"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            )}

            {activeGraph === 'distribution' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Submission Time Distribution</h3>
                    <p className="text-sm text-slate-500">When students submit their exams</p>
                  </div>
                </div>
                {distributionData.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No distribution data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={distributionData} barCategoryGap="20%">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        name="Submissions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            )}

            {activeGraph === 'section' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Performance by Section</h3>
                    <p className="text-sm text-slate-500">Compare scores across different sections</p>
                  </div>
                </div>
                {sectionData.length === 0 ? (
                  <div className="text-center py-16">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No section data available</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={sectionData} barCategoryGap="15%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis 
                          dataKey="section_name" 
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: 20 }}
                          formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                        />
                        <Bar 
                          dataKey="average_score" 
                          name="Avg Score" 
                          radius={[4, 4, 0, 0]}
                        >
                          {sectionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(index, sectionData.length)} />
                          ))}
                        </Bar>
                        <Bar 
                          dataKey="average_percentage" 
                          name="Avg %" 
                          radius={[4, 4, 0, 0]}
                        >
                          {sectionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(index + 3, sectionData.length)} opacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Section Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                      {sectionData.map((section, index) => (
                        <motion.div
                          key={section.section_name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-50 rounded-xl p-4 text-center"
                        >
                          <div 
                            className="w-3 h-3 rounded-full mx-auto mb-2"
                            style={{ backgroundColor: getBarColor(index, sectionData.length) }}
                          />
                          <p className="text-xs text-slate-500 truncate">{section.section_name}</p>
                          <p className="text-lg font-bold text-slate-900">{section.average_percentage.toFixed(0)}%</p>
                          <p className="text-xs text-slate-400">{section.total_attempts} attempts</p>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeGraph === 'scatter' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Time vs Score Correlation</h3>
                    <p className="text-sm text-slate-500">Relationship between time spent and performance</p>
                  </div>
                </div>
                {scatterData.length === 0 ? (
                  <div className="text-center py-16">
                    <ScatterIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No scatter data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="time" 
                        name="Time (min)"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        label={{ value: 'Time (minutes)', position: 'bottom', offset: -5, fill: '#64748b', fontSize: 12 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="score" 
                        name="Score"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ strokeDasharray: '3 3' }} 
                      />
                      <Scatter 
                        data={scatterData} 
                        fill="#3b82f6"
                      >
                        {scatterData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.percentage >= 70 ? '#10b981' : entry.percentage >= 40 ? '#f59e0b' : '#ef4444'}
                            opacity={0.7}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
                
                {/* Legend for scatter */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-600">≥70% (High)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs text-slate-600">40-69% (Medium)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs text-slate-600">&lt;40% (Low)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ModernChartContainer>
    </div>
  );
}
