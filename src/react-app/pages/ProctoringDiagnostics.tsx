import React, { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Clock, Eye, Play, Square, ToggleLeft, ToggleRight } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import { CameraStatusPayload, ProctoringIncidentPayload } from '../hooks/useProctoringCamera';

interface ViolationData {
  type: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

const ProctoringDiagnostics: React.FC = () => {
  const [attemptInput, setAttemptInput] = useState('');
  const [captureInterval, setCaptureInterval] = useState(30);
  const [autoStart, setAutoStart] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [statusInfo, setStatusInfo] = useState<CameraStatusPayload>({ status: 'idle' });
  const [incidentLog, setIncidentLog] = useState<ProctoringIncidentPayload[]>([]);
  const [lastViolation, setLastViolation] = useState<ViolationData | null>(null);

  const parsedAttemptId = useMemo(() => {
    const trimmed = attemptInput.trim();
    if (!trimmed) return null;
    const value = Number(trimmed);
    if (Number.isNaN(value) || value <= 0) return null;
    return value;
  }, [attemptInput]);

  const handleStatusChange = (payload: CameraStatusPayload) => {
    setStatusInfo(payload);
    if (payload.incident) {
      setIncidentLog(prev => [payload.incident!, ...prev].slice(0, 25));
    }
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return `${parsed.toLocaleTimeString()} • ${parsed.toLocaleDateString()}`;
  };

  const formatIncidentDetails = (incident: ProctoringIncidentPayload) => {
    if (!incident.details) return '—';
    try {
      return JSON.stringify(incident.details);
    } catch {
      return String(incident.details);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Proctoring Diagnostics</h1>
              <p className="text-sm text-slate-500">
                Quickly verify camera permissions, incident logging, and snapshot uploads before launching a live exam.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-xl p-4 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Camera Status</p>
              <p className="text-lg font-semibold mt-1 capitalize">{statusInfo.status || 'idle'}</p>
            </div>
            <div className="border rounded-xl p-4 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Permission</p>
              <p className="text-lg font-semibold mt-1 capitalize">{statusInfo.permissionState || 'unknown'}</p>
            </div>
            <div className="border rounded-xl p-4 bg-slate-50">
              <p className="text-xs uppercase tracking-wide text-slate-500">Last Capture</p>
              <p className="text-lg font-semibold mt-1">{statusInfo.lastCapture ? formatTimestamp(statusInfo.lastCapture) : '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                Attempt ID
                <span className="text-xs font-normal text-slate-500">(required to hit backend APIs)</span>
              </label>
              <input
                type="number"
                min={1}
                value={attemptInput}
                onChange={(e) => setAttemptInput(e.target.value)}
                placeholder="e.g. 51"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {!parsedAttemptId && attemptInput && (
                <p className="text-xs text-red-600 mt-1">Please enter a valid positive attempt ID.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {showPreview ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                <label className="text-sm text-slate-600">
                  Show Preview?
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                {autoStart ? <Play className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                <label className="text-sm text-slate-600">
                  Auto-start?
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              Capture Interval <Clock className="w-4 h-4 text-slate-500" />
            </label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={captureInterval}
              onChange={(e) => setCaptureInterval(Number(e.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">{captureInterval} seconds between automatic snapshots</p>
          </div>

          <div className="border rounded-2xl p-4 bg-slate-50">
            {parsedAttemptId ? (
              <WebcamMonitor
                attemptId={parsedAttemptId}
                captureInterval={captureInterval}
                showPreview={showPreview}
                autoStart={autoStart}
                onViolationDetected={(violation) => setLastViolation(violation)}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-slate-500">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <p className="text-sm font-medium">Enter an attempt ID to initialize the webcam tester.</p>
                <p className="text-xs max-w-md">
                  Use an active student attempt with webcam proctoring enabled. All logs will be stored against that attempt in the backend.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Incident Stream</h2>
            </div>
            {incidentLog.length === 0 ? (
              <p className="text-sm text-slate-500">No incidents recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {incidentLog.map((incident, index) => (
                  <div key={`${incident.timestamp}-${incident.event_type}-${index}`} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{incident.event_type}</span>
                      <span className="text-xs uppercase tracking-wide text-slate-500">{incident.severity || 'info'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{formatTimestamp(incident.timestamp)}</p>
                    {incident.details && (
                      <p className="text-xs text-slate-600 mt-2 break-all">{formatIncidentDetails(incident)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Latest Violation (AI Snapshot)</h2>
            </div>
            {lastViolation ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-900 capitalize">{lastViolation.type.replace('_', ' ')}</span>
                  {lastViolation.timestamp && (
                    <span className="text-xs text-slate-500">{lastViolation.timestamp.toLocaleTimeString()}</span>
                  )}
                </div>
                {lastViolation.metadata && (
                  <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-48">
                    {JSON.stringify(lastViolation.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No AI violations detected from the snapshot pipeline yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringDiagnostics;

