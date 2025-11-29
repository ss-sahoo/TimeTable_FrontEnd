import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Activity,
  TrendingUp,
  PieChart,
  FileText,
  ClipboardCheck,
  LineChart,
  Menu,
  X,
  ArrowLeft,
  Users,
  Clock,
  Award,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import FilterPanel, { AnalyticsFilters } from '@/react-app/components/analytics/FilterPanel';

const analyticsPages = [
  { id: 'statistics', name: 'Statistics', icon: BarChart3, path: 'statistics' },
  { id: 'heatmap', name: 'Heat Map', icon: Activity, path: 'heatmap' },
  { id: 'histogram', name: 'Histogram', icon: TrendingUp, path: 'histogram' },
  { id: 'boxplot', name: 'Box Plot', icon: PieChart, path: 'boxplot' },
  { id: 'questions', name: 'Questions', icon: FileText, path: 'questions' },
  { id: 'students', name: 'Students', icon: Users, path: 'students' },
  { id: 'evaluation', name: 'Evaluation', icon: ClipboardCheck, path: 'evaluation' },
  { id: 'graphs', name: 'Graphs', icon: LineChart, path: 'graphs' },
];

export default function ExamAnalyticsDashboard() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  const [sections, setSections] = useState<Array<{ id: number; name: string; subject: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    status: 'all',
    sectionId: '',
    subject: '',
    violationsOnly: false,
  });

  const currentPath = location.pathname.split('/').pop() || 'statistics';

  useEffect(() => {
    if (examId) {
      loadExamData();
      loadBasicStats();
    }
  }, [examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exams/exams/${examId}/`);
      setExamData(response.data);

      if (response.data.pattern) {
        const patternId = typeof response.data.pattern === 'object' 
          ? response.data.pattern.id 
          : response.data.pattern;
        
        if (patternId) {
          const patternResponse = await api.get(`/patterns/patterns/${patternId}/`);
          const sectionsData = patternResponse.data.sections || [];
          setSections(
            sectionsData.map((section: any) => ({
              id: section.id,
              name: section.name,
              subject: section.subject || '',
            }))
          );
        }
      }

      if (response.data.total_marks) {
        setFilters((prev) => ({
          ...prev,
          scoreMax: response.data.total_marks,
        }));
      }
    } catch (error) {
      console.error('Error loading exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBasicStats = async () => {
    try {
      const response = await api.get(`/exams/exams/${examId}/analytics/statistics/`);
      setStatsData(response.data?.statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      scoreMin: 0,
      scoreMax: examData?.total_marks || 100,
      status: 'all',
      sectionId: '',
      subject: '',
      violationsOnly: false,
    });
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.scoreMin > 0) params.append('score_min', filters.scoreMin.toString());
    if (filters.scoreMax < (examData?.total_marks || 100)) {
      params.append('score_max', filters.scoreMax.toString());
    }
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.sectionId) params.append('section_id', filters.sectionId);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.violationsOnly) params.append('violations_only', 'true');
    return params.toString();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading analytics dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Full Width Header with Exam Info */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-slate-200 shadow-sm"
      >
        {/* Top Bar with Title and Stats */}
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Back Button and Title */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/exams/${examId}`)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {examData?.title || 'Exam'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Analytics Dashboard</p>
              </div>
            </div>

            {/* Center: Dynamic Page Info */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">
                    Viewing: <span className="text-blue-600 font-semibold capitalize">{currentPath.replace('-', ' ')}</span>
                  </span>
                </div>
              </motion.div>

              {statsData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-500">Students:</span>
                    <span className="text-sm font-bold text-slate-900">{statsData.total_attempts || 0}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-500">Avg:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {statsData.average_score?.toFixed(1) || 0}
                      <span className="text-xs text-slate-500">/{examData?.total_marks || 100}</span>
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-500">Highest:</span>
                    <span className="text-sm font-bold text-emerald-600">{statsData.highest_score?.toFixed(1) || 0}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleFilterReset}
                examTotalMarks={examData?.total_marks || 100}
                sections={sections}
                isOpen={filterPanelOpen}
                onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 lg:px-8 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {analyticsPages.map((page, index) => {
              const Icon = page.icon;
              const isActive = currentPath === page.path;
              return (
                <motion.button
                  key={page.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.02 }}
                  onClick={() => navigate(`/exams/${examId}/results-analytics/${page.path}`)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-all
                    ${isActive 
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {page.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl lg:hidden"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Analytics Views</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {analyticsPages.map((page) => {
                  const Icon = page.icon;
                  const isActive = currentPath === page.path;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        navigate(`/exams/${examId}/results-analytics/${page.path}`);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                        ${isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {page.name}
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - Full Width */}
      <main className="w-full">
        <div className="px-4 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ examId, filters, queryParams: buildQueryParams(), examData, sections }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
