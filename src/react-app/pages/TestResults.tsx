import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import { Clock, CheckCircle, Eye, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';

const TestResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsNowAvailable, setResultsNowAvailable] = useState(false);

  useEffect(() => {
    console.log('TestResults component mounted with attemptId:', attemptId);
    loadData();
  }, [attemptId]);

  // Auto-refresh when hidden results become available
  useEffect(() => {
    if (data?.status === 'hidden' && data?.available_at) {
      const availableAt = new Date(data.available_at).getTime();
      const now = Date.now();
      const delay = availableAt - now;

      if (delay <= 0) {
        setResultsNowAvailable(true);
        return;
      }

      setResultsNowAvailable(false);
      const timer = setTimeout(() => {
        setResultsNowAvailable(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setResultsNowAvailable(false);
    }
  }, [data]);

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

  // Handle hidden results
  if (data?.status === 'hidden') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-lg w-full text-center">
          {resultsNowAvailable ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Results Are Now Available!</h2>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-medium">
                  The exam period has ended. Your results are ready to view.
                </p>
              </div>
              <button
                onClick={() => {
                  setResultsNowAvailable(false);
                  setLoading(true);
                  loadData();
                }}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View Results
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Results Pending</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-blue-800 font-medium">{data.message}</p>
              </div>
              {data.available_at && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Scheduled Release: <span className="font-semibold text-slate-900">{new Date(data.available_at).toLocaleString()}</span></span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/student-dashboard')}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    loadData();
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh
                </button>
              </div>
            </>
          )}
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
