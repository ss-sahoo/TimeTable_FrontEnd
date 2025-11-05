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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">ExamFlow</h1>
                <p className="text-slate-600">Professional exam creation and management</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create New Exam
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'preparing'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Preparing
          </button>
          <button
            onClick={() => setActiveTab('prepared')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'prepared'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Prepared
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
              Failed to load exams. Please try again.
            </div>
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="flex flex-col gap-4 max-w-4xl">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onClick={() => handleExamClick(exam.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              No {activeTab} exams yet
            </h3>
            <p className="text-slate-600 mb-6">
              {activeTab === 'preparing' 
                ? "Create your first exam to get started with building comprehensive assessments."
                : "No exams have been marked as prepared yet. Complete your exam setup to move them here."
              }
            </p>
            {activeTab === 'preparing' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Exam
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
