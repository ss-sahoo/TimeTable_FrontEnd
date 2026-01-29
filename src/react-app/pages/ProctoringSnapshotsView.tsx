import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Camera, AlertTriangle, CheckCircle, Clock, User, FileText, Filter } from 'lucide-react';
import { api } from '../hooks/useApi';

interface Snapshot {
  timestamp: string;
  stored_reason: string;
  has_image: boolean;
  image_data?: string;
  metadata: Record<string, any>;
  analysis: {
    success: boolean;
    faces_detected?: number;
    violations?: Array<{
      type: string;
      severity: string;
      message: string;
      confidence: number;
    }>;
    error?: string;
  };
  violations: Array<{
    type: string;
    severity: string;
    message: string;
    confidence: number;
  }>;
  faces_detected: number;
}

interface SnapshotsResponse {
  snapshots: Snapshot[];
  total_count: number;
  violation_snapshots: number;
  metadata_only_snapshots: number;
  attempt_id: number;
  student_name: string;
  exam_title: string;
}

const ProctoringSnapshotsView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const [data, setData] = useState<SnapshotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, [attemptId, showViolationsOnly]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const response = await api.get<SnapshotsResponse>(
        `/exams/attempts/${attemptId}/proctoring/snapshots/`,
        {
          params: {
            violations_only: showViolationsOnly
          }
        }
      );
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load snapshots');
      console.error('Error loading snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getViolationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'no_face': 'No Face Detected',
      'multiple_faces': 'Multiple Faces',
      'looking_away': 'Looking Away',
      'tab_switch': 'Tab Switch',
      'window_blur': 'Window Lost Focus',
      'camera_error': 'Camera Error'
    };
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading snapshots...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load snapshots'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const snapshotsToShow = showViolationsOnly
    ? data.snapshots.filter(s => s.stored_reason === 'violation_detected')
    : data.snapshots;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Proctoring Snapshots Review</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-semibold text-gray-900">{data.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Exam</p>
                <p className="font-semibold text-gray-900">{data.exam_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Camera className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Attempt ID</p>
                <p className="font-semibold text-gray-900">#{data.attempt_id}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Total Snapshots</p>
              <p className="text-2xl font-bold text-gray-900">{data.total_count}</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-gray-600">With Violations</p>
              <p className="text-2xl font-bold text-red-600">{data.violation_snapshots}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600">Clean Snapshots</p>
              <p className="text-2xl font-bold text-green-600">{data.metadata_only_snapshots}</p>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showViolationsOnly}
                onChange={(e) => setShowViolationsOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Show only violation snapshots
              </span>
            </label>
          </div>
        </div>

        {/* Snapshots Grid */}
        {snapshotsToShow.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {showViolationsOnly
                ? 'No violation snapshots found'
                : 'No snapshots available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snapshotsToShow.map((snapshot, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${snapshot.stored_reason === 'violation_detected'
                  ? 'border-2 border-red-300'
                  : 'border border-gray-200'
                  }`}
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                {/* Image */}
                {snapshot.has_image && snapshot.image_data ? (
                  <div className="relative w-full h-48 bg-gray-100">
                    <img
                      src={`data:image/jpeg;base64,${snapshot.image_data}`}
                      alt={`Snapshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {snapshot.stored_reason === 'violation_detected' && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        VIOLATION
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No image stored</p>
                      <p className="text-xs text-gray-400">Metadata only</p>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(snapshot.timestamp)}</span>
                    </div>
                    {snapshot.analysis.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  <div className="mb-2">
                    <p className="text-xs text-gray-600">Faces Detected:</p>
                    <p className="text-sm font-semibold">{snapshot.faces_detected}</p>
                  </div>

                  {/* Violations */}
                  {snapshot.violations && snapshot.violations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Violations:</p>
                      {snapshot.violations.map((violation, vIndex) => (
                        <div
                          key={vIndex}
                          className={`text-xs px-2 py-1 rounded border ${getViolationColor(violation.severity)}`}
                        >
                          <span className="font-semibold">{getViolationTypeLabel(violation.type)}</span>
                          <span className="ml-2 opacity-75">({Math.round(violation.confidence * 100)}% confidence)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {snapshot.violations.length === 0 && snapshot.stored_reason === 'violation_detected' && (
                    <div className="text-xs text-gray-500 italic">No specific violations detected</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Detailed View */}
        {selectedSnapshot && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSnapshot(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Snapshot Details</h2>
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Large Image */}
                {selectedSnapshot.has_image && selectedSnapshot.image_data && (
                  <div className="mb-6">
                    <img
                      src={`data:image/jpeg;base64,${selectedSnapshot.image_data}`}
                      alt="Snapshot"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Analysis Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Timestamp</h3>
                    <p className="text-gray-600">{formatTimestamp(selectedSnapshot.timestamp)}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Analysis Results</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Faces Detected:</span> {selectedSnapshot.faces_detected}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-semibold">Analysis Status:</span>{' '}
                        {selectedSnapshot.analysis.success ? (
                          <span className="text-green-600">Success</span>
                        ) : (
                          <span className="text-red-600">Failed - {selectedSnapshot.analysis.error}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedSnapshot.violations && selectedSnapshot.violations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Detected Violations</h3>
                      <div className="space-y-2">
                        {selectedSnapshot.violations.map((violation, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${getViolationColor(violation.severity)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{getViolationTypeLabel(violation.type)}</span>
                              <span className="text-xs opacity-75">
                                {violation.severity.toUpperCase()} • {Math.round(violation.confidence * 100)}% confidence
                              </span>
                            </div>
                            <p className="text-sm">{violation.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSnapshot.metadata && Object.keys(selectedSnapshot.metadata).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Metadata</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(selectedSnapshot.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctoringSnapshotsView;

