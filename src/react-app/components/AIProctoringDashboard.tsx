import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, Eye, EyeOff, BarChart3, 
  Users, Clock, CheckCircle, XCircle, Loader2, 
  RefreshCw, Settings,
  MousePointer, Keyboard, Monitor, Wifi
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';

interface AIProctoringDashboardProps {
  examId: number;
  examTitle: string;
}

interface ProctoringStats {
  total_attempts: number;
  high_risk_attempts: number;
  risk_percentage: number;
  total_violations: number;
  average_risk_score: number;
}

interface HighRiskAttempt {
  attempt_id: number;
  student_id: number;
  student_name: string;
  risk_score: number;
  analyzed_at: string;
}

interface ViolationSummary {
  [key: string]: number;
}

interface Violation {
  id: number;
  attempt_id: number;
  student_id: number;
  student_name: string;
  violation_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  details: Record<string, unknown>;
  detected_at: string;
}

const AIProctoringDashboard: React.FC<AIProctoringDashboardProps> = ({ examId, examTitle }) => {
  const [stats, setStats] = useState<ProctoringStats | null>(null);
  const [highRiskAttempts, setHighRiskAttempts] = useState<HighRiskAttempt[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationSummary, setViolationSummary] = useState<ViolationSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'high-risk' | 'settings'>('overview');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadProctoringData();
  }, [examId, loadProctoringData]);

  const loadProctoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard data
      const dashboardResponse = await api.get(`/exams/${examId}/proctoring-dashboard/`);
      const dashboard = dashboardResponse.data;
      
      setStats(dashboard.statistics);
      setHighRiskAttempts(dashboard.high_risk_attempts);
      setViolationSummary(dashboard.violation_summary);
      
      // Load violations
      const violationsResponse = await api.get(`/exams/${examId}/violations/`);
      setViolations(violationsResponse.data.violations);
      
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(errorMessage || 'Failed to load proctoring data');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'text-red-600';
    if (riskScore >= 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 0.8) return 'HIGH';
    if (riskScore >= 0.5) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading proctoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadProctoringData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Proctoring Dashboard</h2>
            <p className="text-sm text-gray-600">{examTitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>
          <button
            onClick={loadProctoringData}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'violations', label: 'Violations', icon: AlertTriangle },
          { id: 'high-risk', label: 'High Risk', icon: XCircle },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'violations' | 'high-risk' | 'settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-blue-900">{stats?.total_attempts || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">High Risk Attempts</p>
                    <p className="text-2xl font-bold text-red-900">{stats?.high_risk_attempts || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Risk Percentage</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats?.risk_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Violations</p>
                    <p className="text-2xl font-bold text-purple-900">{stats?.total_violations || 0}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Risk Score Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Distribution</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Risk Score</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats?.average_risk_score?.toFixed(3) || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${(stats?.average_risk_score || 0) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low Risk (0.0)</span>
                  <span>High Risk (1.0)</span>
                </div>
              </div>
            </div>

            {/* Violation Types */}
            {Object.keys(violationSummary).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Violation Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(violationSummary).map(([type, count]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Violations</h3>
              <span className="text-sm text-gray-600">
                {violations.length} violations found
              </span>
            </div>

            {violations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No violations detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{violation.student_name}</h4>
                        <p className="text-sm text-gray-600">Attempt #{violation.attempt_id}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(violation.severity)}`}>
                        {violation.severity.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Violation Type:</span>
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {violation.violation_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <span className="ml-2 text-sm text-gray-900">{violation.description}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Confidence:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {(violation.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Detected:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(violation.detected_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'high-risk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">High-Risk Attempts</h3>
              <span className="text-sm text-gray-600">
                {highRiskAttempts.length} high-risk attempts
              </span>
            </div>

            {highRiskAttempts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No high-risk attempts detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {highRiskAttempts.map((attempt) => (
                  <div key={attempt.attempt_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{attempt.student_name}</h4>
                        <p className="text-sm text-gray-600">Attempt #{attempt.attempt_id}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRiskColor(attempt.risk_score)}`}>
                          {attempt.risk_score.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getRiskLevel(attempt.risk_score)} RISK
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Analyzed:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {new Date(attempt.analyzed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${attempt.risk_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Proctoring Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Detection Features</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <div className="flex items-center space-x-2">
                      <MousePointer className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Mouse Tracking</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <div className="flex items-center space-x-2">
                      <Keyboard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Keyboard Tracking</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Tab Switching Detection</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Copy-Paste Detection</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">AI Analysis</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Answer Similarity Detection</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Time Anomaly Detection</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Behavioral Pattern Analysis</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Device Fingerprinting</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIProctoringDashboard;
