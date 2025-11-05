import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { CreateExam } from '@/shared/types';
import { api } from '@/react-app/hooks/useApi';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Subject {
  name: string;
  start_question: number;
  end_question: number;
}

export default function CreateExamModal({ isOpen, onClose, onSuccess }: CreateExamModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    duration_minutes: 180,
  });
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>({
    name: '',
    start_question: 1,
    end_question: 30,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSubject = () => {
    if (newSubject.name && newSubject.start_question <= newSubject.end_question) {
      setSubjects(prev => [...prev, { ...newSubject }]);
      setNewSubject({ name: '', start_question: 1, end_question: 30 });
      setShowSubjectForm(false);
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date || subjects.length === 0) {
      setError('Please fill all required fields and add at least one subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const examData: CreateExam = {
        ...formData,
        subjects,
      };

      await api.post('/api/exams', examData);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({ title: '', start_date: '', end_date: '', duration_minutes: 180 });
      setSubjects([]);
    } catch (err) {
      setError('Failed to create exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New Exam</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exam Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Half-yearly Exam"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Subjects</h3>
              <button
                onClick={() => setShowSubjectForm(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>

            {subjects.map((subject, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800">
                    {subject.name}
                  </span>
                  <button
                    onClick={() => removeSubject(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-600">
                  Questions {subject.start_question} to {subject.end_question}
                </div>
              </div>
            ))}

            {showSubjectForm && (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Subject name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="number"
                    placeholder="Start Q#"
                    value={newSubject.start_question}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, start_question: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="End Q#"
                    value={newSubject.end_question}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, end_question: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addSubject}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowSubjectForm(false)}
                    className="px-3 py-1.5 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}
