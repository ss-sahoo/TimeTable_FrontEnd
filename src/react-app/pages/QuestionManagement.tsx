import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
  FileQuestion,
  Upload,
  Download
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import BulkImportModal from '../components/BulkImportModal';

interface Pattern {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  total_duration: number;
  is_active: boolean;
  sections: any[];
}

export default function QuestionManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { data: patternsData, loading, refetch } = useApi<{ results: Pattern[] }>('/patterns/patterns/');
  const patterns = patternsData?.results || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Question Management
                </h1>
                <p className="text-slate-600">Select a pattern to add questions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`${basePath}/patterns/create`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Pattern
              </button>
            </div>
          </div>
        </div>

        {/* Patterns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patterns.map((pattern) => {
            const totalSections = pattern.sections?.length || 0;

            return (
              <div
                key={pattern.id}
                onClick={() => navigate(`${basePath}/pattern/${pattern.id}/question/1`)}
                className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    {pattern.is_active && (
                      <span className="px-3 py-1 bg-green-400 text-green-900 text-xs font-bold rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{pattern.name}</h3>
                  <p className="text-blue-100 text-sm line-clamp-2">{pattern.description || 'No description'}</p>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <FileQuestion className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Questions</p>
                      <p className="text-lg font-bold text-blue-600">{pattern.total_questions}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Marks</p>
                      <p className="text-lg font-bold text-green-600">{pattern.total_marks}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Duration</p>
                      <p className="text-lg font-bold text-purple-600">{pattern.total_duration}m</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">{totalSections} Sections</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {patterns.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Patterns Found</h3>
            <p className="text-slate-600 mb-6">Create a pattern first to start adding questions</p>
            <button
              onClick={() => navigate(`${basePath}/patterns/create`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Pattern
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
