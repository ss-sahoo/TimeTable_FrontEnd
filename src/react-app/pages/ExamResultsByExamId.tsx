import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const ExamResultsByExamId: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      loadLatestAttempt();
    }
  }, [examId]);

  const loadLatestAttempt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading latest attempt for exam ID:', examId);
      
      // Get the latest attempt for this exam
      const response = await api.get(`/exams/exams/${examId}/attempts/latest/`);
      const attemptData = response.data;
      
      console.log('Latest attempt data:', attemptData);
      
      if (attemptData && attemptData.attempt_id) {
        console.log('Redirecting to exam results with attempt ID:', attemptData.attempt_id);
        // Redirect to the actual exam results page with the attempt ID
        navigate(`/exam-results/${attemptData.attempt_id}`, { replace: true });
      } else {
        console.log('No attempt ID found in response');
        setError('No exam attempts found for this exam');
      }
    } catch (error: any) {
      console.error('Error loading latest attempt:', error);
      if (error.response?.status === 404) {
        setError('No exam attempts found for this exam');
      } else {
        setError('Failed to load exam results');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Results Available</h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/student-dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={loadLatestAttempt}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // This should not render as we redirect
};

export default ExamResultsByExamId;
