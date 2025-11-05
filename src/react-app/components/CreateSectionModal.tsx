import { useState } from 'react';
import { X } from 'lucide-react';
import { CreateSection } from '@/shared/types';

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: CreateSection) => void;
  loading?: boolean;
}

export default function CreateSectionModal({ isOpen, onClose, onSave, loading }: CreateSectionModalProps) {
  const [formData, setFormData] = useState<CreateSection>({
    name: '',
    question_start: 1,
    question_end: 10,
    min_questions_to_attempt: 5,
    question_type: 'Single Correct MCQ',
    marking_if_attempted: 0,
    marking_if_correct: 4,
    marking_if_incorrect: -1,
    marking_in_any_other_case: -1,
  });

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateSection, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.question_start > formData.question_end) {
      setError('Please fill all required fields correctly');
      return;
    }

    onSave(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      question_start: 1,
      question_end: 10,
      min_questions_to_attempt: 5,
      question_type: 'Single Correct MCQ',
      marking_if_attempted: 0,
      marking_if_correct: 4,
      marking_if_incorrect: -1,
      marking_in_any_other_case: -1,
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Section</h2>
          <button
            onClick={handleClose}
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
              Section Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Part A, Section C"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Question Number *
              </label>
              <input
                type="number"
                value={formData.question_start}
                onChange={(e) => handleInputChange('question_start', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Question Number *
              </label>
              <input
                type="number"
                value={formData.question_end}
                onChange={(e) => handleInputChange('question_end', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Minimum Questions to Attempt
            </label>
            <input
              type="number"
              value={formData.min_questions_to_attempt}
              onChange={(e) => handleInputChange('min_questions_to_attempt', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question Type *
            </label>
            <select
              value={formData.question_type}
              onChange={(e) => handleInputChange('question_type', e.target.value as CreateSection['question_type'])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Single Correct MCQ">Single Correct MCQ</option>
              <option value="Numerical">Numerical</option>
              <option value="Subjective">Subjective</option>
            </select>
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Marking Scheme</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  If Attempted
                </label>
                <input
                  type="number"
                  value={formData.marking_if_attempted}
                  onChange={(e) => handleInputChange('marking_if_attempted', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  If Correct
                </label>
                <input
                  type="number"
                  value={formData.marking_if_correct}
                  onChange={(e) => handleInputChange('marking_if_correct', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  If Incorrect
                </label>
                <input
                  type="number"
                  value={formData.marking_if_incorrect}
                  onChange={(e) => handleInputChange('marking_if_incorrect', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  In Any Other Case
                </label>
                <input
                  type="number"
                  value={formData.marking_in_any_other_case}
                  onChange={(e) => handleInputChange('marking_in_any_other_case', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    </div>
  );
}
