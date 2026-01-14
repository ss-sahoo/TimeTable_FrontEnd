import { useState } from 'react';
import { Plus, FileText, GraduationCap } from 'lucide-react';
import { useApi } from '@/react-app/hooks/useApi';
import { Exam } from '@/shared/types';
import ExamCard from '@/react-app/components/ExamCard';
import CreateExamModal from '@/react-app/components/CreateExamModal';
import { useNavigate } from 'react-router';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'preparing' | 'prepared'>('preparing');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const { data: exams, loading, error, refetch } = useApi<Exam[]>(`/api/exams?status=${activeTab}`, [activeTab]);

  const handleExamClick = (examId: number) => {
    navigate(`/exam/${examId}`);
  };

  const handleCreateSuccess = () => {
    refetch();
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-slate-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">DashoExams</h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 truncate">Professional exam creation and management</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Create New Exam</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg sm:rounded-xl border border-slate-200 mb-4 sm:mb-6 lg:mb-8 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('preparing')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all text-sm sm:text-base ${activeTab === 'preparing'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            Preparing
          </button>
          <button
            onClick={() => setActiveTab('prepared')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium transition-all text-sm sm:text-base ${activeTab === 'prepared'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            Prepared
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg inline-block text-sm sm:text-base">
              Failed to load exams. Please try again.
            </div>
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="flex flex-col gap-3 sm:gap-4 max-w-4xl">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onClick={() => handleExamClick(exam.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-16 px-4">
            <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-slate-900 mb-2">
              No {activeTab} exams yet
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
              {activeTab === 'preparing'
                ? "Create your first exam to get started with building comprehensive assessments."
                : "No exams have been marked as prepared yet. Complete your exam setup to move them here."
              }
            </p>
            {activeTab === 'preparing' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Create Your First Exam</span>
              </button>
            )}
          </div>
        )}
      </div>

      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
