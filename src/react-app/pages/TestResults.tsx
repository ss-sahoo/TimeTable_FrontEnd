import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';

const TestResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestResults component mounted with attemptId:', attemptId);
    loadData();
  }, [attemptId]);

  const loadData = async () => {
    try {
      console.log('Loading data for attempt:', attemptId);
      const response = await api.get(`/exams/attempts/${attemptId}/results/`);
      console.log('Response received:', response.data);
      setData(response.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Test Results</h1>
        <p className="text-slate-600 mb-4">Attempt ID: {attemptId}</p>
        <pre className="bg-white p-4 rounded-lg border text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
        <button
          onClick={() => navigate('/student-dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TestResults;
