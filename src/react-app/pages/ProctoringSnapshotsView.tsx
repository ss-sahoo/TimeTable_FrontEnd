import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Camera, AlertTriangle, CheckCircle, Clock, User, FileText, Filter, Video } from 'lucide-react';
import { api, getErrorMessage } from '../hooks/useApi';

interface Snapshot {
  timestamp: string;
  stored_reason: string;
  has_image: boolean;
  image_data?: string;
  image_url?: string;
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

interface VideoClip {
  id: number;
  video_file: string;
  timestamp: string;
  duration_seconds: number;
  metadata: Record<string, any>;
}

interface SnapshotsResponse {
  snapshots: Snapshot[];
  video_clips?: VideoClip[];
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
  const [data, setData] = useState<SnapshotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    loadSnapshots();

    // LIVE SYNC: Poll for new snapshots every 10 seconds while admin is viewing
    const interval = setInterval(() => {
      loadSnapshots();
    }, 10000);

    return () => clearInterval(interval);
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
      setError(getErrorMessage(err, 'Failed to load snapshots'));
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

  const getViolationColor = (severity: string, type?: string) => {
    if (type === 'audio_noise') return 'bg-amber-50 text-amber-700 border-amber-200';
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
      'camera_error': 'Camera Error',
      'audio_noise': 'Background Noise',
      'audio_voice_detected': 'Voice Detected'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
            <h1 className="text-2xl font-bold text-gray-900">Proctoring Review</h1>
            <div className="w-24"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-600">Student</p>
                <p className="font-semibold text-gray-900">{data.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-gray-600">Exam</p>
                <p className="font-semibold text-gray-900">{data.exam_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Camera className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-gray-600">Attempt ID</p>
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

        {/* Video Clips Section */}
        {data.video_clips && data.video_clips.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-600" />
              Recorded Video Feed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.video_clips.map((clip) => (
                <div key={clip.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                      LOGGED AT {new Date(clip.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">
                      60 SECONDS
                    </span>
                  </div>
                  <video
                    src={clip.video_file}
                    controls
                    className="w-full aspect-video bg-black block"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Snapshots Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-6 h-6 text-purple-600" />
          Proctoring Analyzed Snapshots
        </h2>

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
                className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${snapshot.stored_reason === 'violation_detected'
                  ? 'ring-2 ring-red-500'
                  : 'border border-gray-200'
                  }`}
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                {/* Image */}
                {snapshot.has_image && (snapshot.image_url || snapshot.image_data) ? (
                  <div className="relative w-full h-48 bg-gray-100">
                    <img
                      src={snapshot.image_url || `data:image/jpeg;base64,${snapshot.image_data}`}
                      alt={`Snapshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {snapshot.stored_reason === 'violation_detected' && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider shadow-lg">
                        VIOLATION
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No image stored</p>
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
                    {snapshot.violations.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Analysis</p>
                    <p className="text-sm font-semibold">{snapshot.faces_detected} face{snapshot.faces_detected !== 1 ? 's' : ''} detected</p>
                  </div>

                  {/* Violations */}
                  {snapshot.violations && snapshot.violations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {snapshot.violations.map((violation, vIndex) => (
                        <div
                          key={vIndex}
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${getViolationColor(violation.severity, violation.type)}`}
                        >
                          {getViolationTypeLabel(violation.type)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Detailed View */}
        {selectedSnapshot && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedSnapshot(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-4xl w-full my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 italic tracking-tight">ANALYSIS DETAIL</h2>
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Image */}
                  <div className="space-y-4">
                    {selectedSnapshot.has_image && (selectedSnapshot.image_url || selectedSnapshot.image_data) ? (
                      <img
                        src={selectedSnapshot.image_url || `data:image/jpeg;base64,${selectedSnapshot.image_data}`}
                        alt="Snapshot"
                        className="w-full rounded-2xl border border-gray-100 shadow-2xl"
                      />
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status</h3>
                      <div className="flex items-center gap-2">
                        {selectedSnapshot.violations.length > 0
                          ? <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Security Violation</span>
                          : <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Clear</span>
                        }
                        <span className="text-sm text-gray-500 font-medium">{formatTimestamp(selectedSnapshot.timestamp)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Detected Violations</h3>
                      {selectedSnapshot.violations.length === 0 ? (
                        <p className="text-sm text-gray-500">No AI-detected violations in this frame.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedSnapshot.violations.map((violation, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-xl border flex items-start gap-4 ${getViolationColor(violation.severity, violation.type)}`}
                            >
                              <div className="shrink-0 pt-1">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold uppercase tracking-tight">{getViolationTypeLabel(violation.type)}</p>
                                <p className="text-xs opacity-90 mt-1">{violation.message}</p>
                                <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">
                                  CONFIDENCE: {Math.round(violation.confidence * 100)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedSnapshot.metadata && Object.keys(selectedSnapshot.metadata).length > 0 && (
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Technical Logs</h3>
                        <div className="bg-slate-900 p-4 rounded-xl">
                          <pre className="text-[10px] text-blue-300 overflow-x-auto">
                            {JSON.stringify(selectedSnapshot.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
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
