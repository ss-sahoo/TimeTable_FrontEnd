import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Camera, AlertTriangle, CheckCircle, Clock,
  User, FileText, Filter, Video, Mic, Activity, Monitor
} from 'lucide-react';
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

interface ViolationEntry {
  id: number;
  type: string;
  timestamp: string;
  screenshot_url: string | null;
  metadata: Record<string, any>;
  type_display: string;
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
  violations_log?: ViolationEntry[];
  video_clips?: VideoClip[];
  total_count: number;
  violation_snapshots: number;
  total_violations: number;
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

  const getViolationColor = (type: string) => {
    if (type.includes('audio') || type.includes('voice')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (type.includes('face') || type.includes('gaze')) return 'bg-red-50 text-red-700 border-red-200';
    if (type.includes('tab') || type.includes('window')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getViolationIcon = (type: string) => {
    if (type.includes('audio') || type.includes('voice')) return <Mic className="w-4 h-4" />;
    if (type.includes('tab') || type.includes('window')) return <Monitor className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (loading && !data) {
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
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Proctoring Review</h1>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-100">
              <Activity className="w-3 h-3 animate-pulse" />
              LIVE VIEW
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
              <div className="bg-blue-100 p-2 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</p>
                <p className="font-bold text-slate-900">{data.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
              <div className="bg-green-100 p-2 rounded-lg"><FileText className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam</p>
                <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{data.exam_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
              <div className="bg-purple-100 p-2 rounded-lg"><Camera className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attempt ID</p>
                <p className="font-bold text-slate-900">#{data.attempt_id}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Snapshots</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{data.total_count}</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Violations</p>
              <p className="text-3xl font-black text-red-600 tracking-tighter">{data.total_violations || data.violation_snapshots}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Clean Frames</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">{data.metadata_only_snapshots}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Video Clips</p>
              <p className="text-3xl font-black text-blue-600 tracking-tighter">{data.video_clips?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Log and Videos */}
          <div className="lg:col-span-4 space-y-8">
            {/* Violations Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  Security & Audio Log
                </h2>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  {data.total_violations} EVENTS
                </span>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                {(!data.violations_log || data.violations_log.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl m-2 border border-dashed border-slate-200">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">No violations detected so far</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.violations_log.map((v) => (
                      <div key={v.id} className={`p-3 rounded-xl border flex items-start gap-3 transition-colors hover:bg-white shadow-sm ${getViolationColor(v.type)}`}>
                        <div className="mt-0.5">{getViolationIcon(v.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{v.type_display}</p>
                          <p className="text-[10px] font-medium opacity-70 mb-1">{v.metadata?.message || 'Detected by security engine'}</p>
                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-60">
                            <Clock className="w-2 h-2" />
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {v.screenshot_url && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/50 shadow-sm shrink-0">
                            <img src={v.screenshot_url} className="w-full h-full object-cover" alt="violation" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Clips Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900 italic uppercase tracking-tight flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  Recorded Sessions
                </h2>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {(!data.video_clips || data.video_clips.length === 0) ? (
                  <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No video clips recorded</p>
                    <p className="text-[8px] text-slate-400 mt-1 max-w-[150px] mx-auto uppercase">Video is captured only during active violations for privacy.</p>
                  </div>
                ) : (
                  data.video_clips.map((clip) => (
                    <div key={clip.id} className="bg-slate-900 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-800">
                      <div className="p-2 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(clip.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase ring-1 ring-blue-500/30">
                          {clip.duration_seconds}s CLIP
                        </span>
                      </div>
                      <video
                        src={clip.video_file}
                        controls
                        className="w-full aspect-video block"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Snapshots Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-2">
                <Camera className="w-6 h-6 text-purple-600" />
                Snapshot Analysis Engine
              </h2>

              <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showViolationsOnly}
                    onChange={(e) => setShowViolationsOnly(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    VIOLATIONS ONLY
                  </span>
                </label>
              </div>
            </div>

            {snapshotsToShow.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-24 text-center border border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 italic uppercase">Zero Frames Found</h3>
                <p className="text-slate-500 text-sm font-medium">
                  {showViolationsOnly
                    ? 'Student behavior was clear during the monitoring period.'
                    : 'System is waiting for the first snapshot sync.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {snapshotsToShow.map((snapshot, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-3xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group active:scale-95 ${snapshot.stored_reason === 'violation_detected'
                      ? 'ring-2 ring-red-500'
                      : 'border border-slate-200'
                      }`}
                    onClick={() => setSelectedSnapshot(snapshot)}
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                      {snapshot.has_image && (snapshot.image_url || snapshot.image_data) ? (
                        <img
                          src={snapshot.image_url || `data:image/jpeg;base64,${snapshot.image_data}`}
                          alt={`Snapshot ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Camera className="w-12 h-12 mb-2 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Image</p>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex gap-2">
                        <div className="bg-white/90 backdrop-blur-md text-slate-900 px-2 py-1 rounded-lg text-[10px] font-black shadow-lg flex items-center gap-1.5 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {new Date(snapshot.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {snapshot.stored_reason === 'violation_detected' && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg ring-1 ring-red-400">
                          ALERT
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                          Open Analysis Detail
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Face Detection</p>
                          <p className="text-sm font-bold text-slate-900">{snapshot.faces_detected} detected</p>
                        </div>
                        {snapshot.violations?.length > 0 ? (
                          <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                      </div>

                      {/* Violations */}
                      {snapshot.violations && snapshot.violations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-50">
                          {snapshot.violations.map((violation, vIndex) => (
                            <div
                              key={vIndex}
                              className="bg-red-50 text-red-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter border border-red-100 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {violation.type.split('_').join(' ')}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest pt-4 border-t border-slate-50">
                          <CheckCircle className="w-3 h-3" />
                          Clean Capture
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal for Detailed View */}
        {selectedSnapshot && (
          <div
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedSnapshot(null)}
          >
            <div
              className="bg-white rounded-[40px] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
                {selectedSnapshot.has_image && (selectedSnapshot.image_url || selectedSnapshot.image_data) ? (
                  <img
                    src={selectedSnapshot.image_url || `data:image/jpeg;base64,${selectedSnapshot.image_data}`}
                    alt="Snapshot"
                    className="w-full h-full object-contain rounded-3xl shadow-lg border border-white"
                  />
                ) : (
                  <div className="aspect-video w-full bg-slate-200 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-300">
                    <Camera className="w-16 h-16 text-slate-400 opacity-30" />
                  </div>
                )}
              </div>

              <div className="w-full sm:w-[400px] bg-white p-8 overflow-y-auto flex flex-col relative">
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-500 shadow-sm"
                >
                  ✕
                </button>

                <div className="mb-8 pr-10">
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-2">Analysis Result</h2>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">{formatTimestamp(selectedSnapshot.timestamp)}</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Security Assessment</h3>
                    {selectedSnapshot.violations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedSnapshot.violations.map((v, i) => (
                          <div key={i} className="p-4 rounded-3xl bg-red-50 border border-red-100 flex items-start gap-4">
                            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200 shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{v.type.split('_').join(' ')}</p>
                              <p className="text-xs font-bold text-slate-700 leading-snug">{v.message}</p>
                              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-2 bg-white inline-block px-2 py-0.5 rounded-full border border-red-50 shadow-sm">
                                CONFIDENCE: {Math.round(v.confidence * 100)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                        <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Environment Status</p>
                          <p className="text-xs font-bold text-slate-700">Frame Analysis: Secure</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Technical Metadata</h3>
                    <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Activity className="w-24 h-24 text-blue-400" />
                      </div>
                      <pre className="text-[10px] font-mono text-blue-400/90 overflow-x-auto whitespace-pre-wrap leading-relaxed relative z-10">
                        {JSON.stringify(selectedSnapshot.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-xl shadow-slate-200"
                  >
                    Dismiss View
                  </button>
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
