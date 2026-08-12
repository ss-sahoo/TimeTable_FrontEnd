import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  Clock, 
  User, 
  BookOpen,
  Filter,
  Search,
  Download,
  XCircle,
  Flag,
  Monitor,
  Smartphone,
  MousePointer
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { SkeletonTable, SkeletonStatsCard, SkeletonText, SkeletonChart } from '../components/SkeletonLoader';

interface Violation {
  id: number;
  attempt_student: string;
  attempt_exam: string;
  violation_type: string;
  violation_type_display: string;
  timestamp: string;
  screenshot: string | null;
  metadata: {
    confidence?: number;
    message?: string;
    analysis_data?: any;
    user_agent?: string;
    x?: number;
    y?: number;
  };
}

interface ViolationSummary {
  [violationType: string]: {
    count: number;
    attempts: number[];
  };
}

interface ViolationDashboardData {
  violation_summary: ViolationSummary;
  recent_violations: Violation[];
  total_attempts_with_violations: number;
  auto_disqualified_count: number;
}

const ViolationDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ViolationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading: apiLoading, error: apiError } = useApi('/exams/violation-dashboard/');

  useEffect(() => {
    if (data) {
      setDashboardData(data);
    }
    setLoading(apiLoading);
    setError(apiError);
  }, [data, apiLoading, apiError]);

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'tab_switch':
        return <Monitor className="w-5 h-5" />;
      case 'window_blur':
        return <Monitor className="w-5 h-5" />;
      case 'multiple_faces':
        return <User className="w-5 h-5" />;
      case 'no_face':
        return <User className="w-5 h-5" />;
      case 'looking_away':
        return <Eye className="w-5 h-5" />;
      case 'mobile_detected':
        return <Smartphone className="w-5 h-5" />;
      case 'copy_paste':
        return <MousePointer className="w-5 h-5" />;
      case 'fullscreen_exit':
        return <Monitor className="w-5 h-5" />;
      case 'right_click':
        return <MousePointer className="w-5 h-5" />;
      case 'keyboard_shortcut':
        return <MousePointer className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'multiple_faces':
      case 'mobile_detected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'tab_switch':
      case 'looking_away':
      case 'no_face':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'copy_paste':
      case 'right_click':
      case 'keyboard_shortcut':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityLevel = (type: string) => {
    switch (type) {
      case 'multiple_faces':
      case 'mobile_detected':
        return 'High';
      case 'tab_switch':
      case 'looking_away':
      case 'no_face':
        return 'Medium';
      case 'copy_paste':
      case 'right_click':
      case 'keyboard_shortcut':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const filteredViolations = dashboardData?.recent_violations.filter(violation => {
    const matchesType = filterType === 'all' || violation.violation_type === filterType;
    const matchesSearch = searchTerm === '' || 
      violation.attempt_student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.attempt_exam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.violation_type_display.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  }) || [];

  const handleViewViolation = (violation: Violation) => {
    setSelectedViolation(violation);
    setShowViolationModal(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <SkeletonText lines={1} variant="xl" className="w-1/3 mb-2" />
            <SkeletonText lines={1} variant="md" className="w-1/2" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonStatsCard key={index} />
            ))}
          </div>
          
          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart height="h-80" />
            <SkeletonChart height="h-80" />
          </div>
          
          {/* Violations Table Skeleton */}
          <SkeletonTable rows={10} columns={4} />
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading violation dashboard: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Violation Dashboard</h1>
            <p className="text-gray-600">Monitor and review exam security violations</p>
          </div>

          {/* Summary Cards */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            data-tour-id="panel-proctoring"
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Violations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(dashboardData.violation_summary).reduce((sum, item) => sum + item.count, 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Affected Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_attempts_with_violations}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Auto Disqualified</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.auto_disqualified_count}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Violation Types</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(dashboardData.violation_summary).length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Flag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Violation Type Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Violation Types Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dashboardData.violation_summary).map(([type, data]) => (
                <div key={type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    {getViolationIcon(type)}
                    <div>
                      <h3 className="font-medium text-gray-900">{type.replace('_', ' ').toUpperCase()}</h3>
                      <p className="text-sm text-gray-600">Severity: {getSeverityLevel(type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{data.count}</span>
                    <span className="text-sm text-gray-500">{data.attempts.length} attempts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by student, exam, or violation type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {Object.keys(dashboardData.violation_summary).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recent Violations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Violations</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violation Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredViolations.map((violation) => (
                    <tr key={violation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {violation.attempt_student}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{violation.attempt_exam}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getViolationIcon(violation.violation_type)}
                          <span className="text-sm text-gray-900">
                            {violation.violation_type_display}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getViolationColor(violation.violation_type)}`}>
                          {getSeverityLevel(violation.violation_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatTimestamp(violation.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewViolation(violation)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Detail Modal */}
      {showViolationModal && selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Violation Details</h3>
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Violation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Violation Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedViolation.violation_type_display}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student:</span>
                      <span className="font-medium">{selectedViolation.attempt_student}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exam:</span>
                      <span className="font-medium">{selectedViolation.attempt_exam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timestamp:</span>
                      <span className="font-medium">{formatTimestamp(selectedViolation.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getViolationColor(selectedViolation.violation_type)}`}>
                        {getSeverityLevel(selectedViolation.violation_type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Technical Details</h4>
                  <div className="space-y-2">
                    {selectedViolation.metadata.confidence && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{(selectedViolation.metadata.confidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedViolation.metadata.user_agent && (
                      <div>
                        <span className="text-gray-600">User Agent:</span>
                        <p className="text-sm text-gray-900 mt-1 break-all">
                          {selectedViolation.metadata.user_agent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              {selectedViolation.screenshot && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Screenshot</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={selectedViolation.screenshot}
                      alt="Violation screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Analysis Data */}
              {selectedViolation.metadata.analysis_data && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">AI Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedViolation.metadata.analysis_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedViolation.metadata.message && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Detection Message</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">{selectedViolation.metadata.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Implement download functionality
                    console.log('Download violation data');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationDashboard;

