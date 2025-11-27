import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Outlet } from 'react-router';
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
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import FilterPanel, { AnalyticsFilters } from '@/react-app/components/analytics/FilterPanel';

const analyticsPages = [
  { id: 'statistics', name: 'Statistics', icon: BarChart3, path: 'statistics' },
  { id: 'heatmap', name: 'Heat Map', icon: Activity, path: 'heatmap' },
  { id: 'histogram', name: 'Histogram', icon: TrendingUp, path: 'histogram' },
  { id: 'boxplot', name: 'Box Plot', icon: PieChart, path: 'boxplot' },
  { id: 'questions', name: 'Questions', icon: FileText, path: 'questions' },
  { id: 'evaluation', name: 'Evaluation', icon: ClipboardCheck, path: 'evaluation' },
  { id: 'graphs', name: 'Graphs', icon: LineChart, path: 'graphs' },
];

export default function ExamAnalyticsDashboard() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  const [sections, setSections] = useState<Array<{ id: number; name: string; subject: string }>>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/exams/exams/${examId}/`);
      setExamData(response.data);

      // Load sections if pattern exists
      if (response.data.pattern) {
        // Handle both pattern ID (number) and pattern object
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

      // Set max score from exam total marks
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/exams/${examId}`)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {examData?.title || 'Exam Analytics'}
                </h1>
                <p className="text-xs text-slate-500">Comprehensive performance analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleFilterReset}
                examTotalMarks={examData?.total_marks || 100}
                sections={sections}
                isOpen={filterPanelOpen}
                onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
              />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 top-[73px] left-0 h-[calc(100vh-73px)] w-64 bg-white border-r border-slate-200 z-20 transition-transform duration-300 overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {analyticsPages.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    navigate(`/exams/${examId}/results-analytics/${page.path}`);
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  {page.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ examId, filters, queryParams: buildQueryParams(), examData, sections }} />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

