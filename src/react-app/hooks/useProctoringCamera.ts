import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type Webcam from 'react-webcam';
import { api } from './useApi';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'active' | 'error';
export type CameraPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';
export type IncidentSeverity = 'info' | 'low' | 'medium' | 'high';

export interface ProctoringIncidentPayload {
  event_type: string;
  timestamp?: string;
  severity?: IncidentSeverity;
  details?: Record<string, unknown>;
}

export interface CameraStatusPayload {
  status: CameraStatus;
  permissionState?: CameraPermissionState;
  lastCapture?: string;
  error?: string;
  incident?: ProctoringIncidentPayload;
}

interface UseProctoringCameraArgs {
  attemptId?: number | null;
  webcamRef: RefObject<Webcam>;
  captureIntervalMs?: number;
  autoStart?: boolean;
  incidentDebounceMs?: number;
  enableIncidentLogging?: boolean;
  onViolationDetected?: (violation: any) => void;
  onStatusChange?: (payload: CameraStatusPayload) => void;
}

const DEFAULT_INCIDENT_DEBOUNCE = 5000;

export const useProctoringCamera = ({
  attemptId,
  webcamRef,
  captureIntervalMs = 30000,
  autoStart = true,
  incidentDebounceMs = DEFAULT_INCIDENT_DEBOUNCE,
  enableIncidentLogging = true,
  onViolationDetected,
  onStatusChange
}: UseProctoringCameraArgs) => {
  const [isActive, setIsActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('unknown');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'error'>('idle');
  const [lastCapture, setLastCapture] = useState<Date | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [incidents, setIncidents] = useState<ProctoringIncidentPayload[]>([]);

  const incidentThrottleRef = useRef<Record<string, number>>({});
  const captureSnapshotRef = useRef<() => Promise<any> | null>(() => null);

  const emitStatus = useCallback(
    (payload: Partial<CameraStatusPayload>) => {
      onStatusChange?.({
        status: cameraStatus,
        permissionState,
        ...payload
      });
    },
    [cameraStatus, onStatusChange, permissionState]
  );

  const ensurePermissionState = useCallback(async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const descriptor: PermissionDescriptor = { name: 'camera' as PermissionName };
      const result = await (navigator as any).permissions.query(descriptor);
      setPermissionState(result.state as CameraPermissionState);
      result.onchange = () => {
        setPermissionState(result.state as CameraPermissionState);
        emitStatus({ permissionState: result.state as CameraPermissionState });
      };
    } catch {
      setPermissionState('unknown');
    }
  }, [emitStatus]);

  const reportIncident = useCallback(
    async (incident: ProctoringIncidentPayload) => {
      if (!enableIncidentLogging) return;
      const now = Date.now();
      const last = incidentThrottleRef.current[incident.event_type] || 0;
      if (now - last < incidentDebounceMs) return;
      incidentThrottleRef.current[incident.event_type] = now;

      const payload: ProctoringIncidentPayload = {
        severity: incident.severity || 'info',
        timestamp: incident.timestamp || new Date().toISOString(),
        details: incident.details || {},
        event_type: incident.event_type
      };

      setIncidents(prev => [payload, ...prev].slice(0, 20));
      emitStatus({ incident: payload });

      if (!attemptId) return;

      try {
        await api.post(`/exams/attempts/${attemptId}/proctoring/incidents/`, payload);
      } catch (error) {
        console.error('Failed to log proctoring incident', error);
      }
    },
    [attemptId, emitStatus, enableIncidentLogging, incidentDebounceMs]
  );

  const handleUserMedia = useCallback(() => {
    setCameraError(null);
    setPermissionState('granted');
    setCameraStatus(autoStart ? 'active' : 'ready');
    emitStatus({ status: autoStart ? 'active' : 'ready', permissionState: 'granted' });

    if (autoStart) {
      setIsActive(true);
    }
  }, [autoStart, emitStatus]);

  const handleCameraError = useCallback(
    (error: string | DOMException) => {
      const message = typeof error === 'string' ? error : error?.message || 'Unknown camera error';
      setCameraError(message);
      setCameraStatus('error');
      setPermissionState('denied');
      setIsActive(false);
      emitStatus({ status: 'error', error: message, permissionState: 'denied' });
      reportIncident({
        event_type: 'camera_error',
        severity: 'high',
        details: { message }
      });
    },
    [emitStatus, reportIncident]
  );

  const startMonitoring = useCallback(() => {
    if (permissionState === 'denied') {
      reportIncident({
        event_type: 'camera_denied',
        severity: 'medium',
        details: { message: 'Camera permission denied' }
      });
      return;
    }

    setIsActive(true);
    setCameraStatus('active');
    emitStatus({ status: 'active' });
  }, [emitStatus, permissionState, reportIncident]);

  const stopMonitoring = useCallback(() => {
    setIsActive(false);
    setCameraStatus('ready');
    emitStatus({ status: 'ready' });
  }, [emitStatus]);

  const captureSnapshot = useCallback(async () => {
    if (!attemptId || !webcamRef.current) return null;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      return null;
    }

    try {
      setDetectionStatus('detecting');
      const base64Data = imageSrc.split(',')[1];

      const response = await api.post(`/exams/attempts/${attemptId}/proctoring/snapshot/`, {
        image_data: base64Data,
        timestamp: new Date().toISOString(),
        metadata: {
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          window_size: `${window.innerWidth}x${window.innerHeight}`
        }
      });

      const data = response.data;
      if (typeof data?.violation_count === 'number') {
        setViolationCount(data.violation_count);
      }

      setLastCapture(new Date());
      emitStatus({ lastCapture: new Date().toISOString() });

      const analysis = data?.analysis;
      if (analysis?.violations?.length && onViolationDetected) {
        analysis.violations.forEach((violation: any) => {
          onViolationDetected({
            type: violation.type,
            confidence: violation.confidence,
            message: violation.message,
            timestamp: new Date(),
            analysis
          });
        });
      }

      return data;
    } catch (error) {
      console.error('Error capturing/analyzing snapshot', error);
      setDetectionStatus('error');
      emitStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Snapshot capture failed'
      });
      reportIncident({
        event_type: 'snapshot_failed',
        severity: 'low',
        details: { message: error instanceof Error ? error.message : String(error) }
      });
      return null;
    } finally {
      setDetectionStatus('idle');
    }
  }, [attemptId, emitStatus, onViolationDetected, reportIncident, webcamRef]);

  // Keep ref updated with latest captureSnapshot function
  useEffect(() => {
    captureSnapshotRef.current = captureSnapshot;
  }, [captureSnapshot]);

  useEffect(() => {
    if (!isActive) return;
    
    // Initial capture using current function
    const currentCapture = captureSnapshotRef.current;
    if (currentCapture) {
      currentCapture();
    }
    
    // Set up interval - use ref to always call latest version without recreating interval
    const intervalId = window.setInterval(() => {
      const latestCapture = captureSnapshotRef.current;
      if (latestCapture) {
        latestCapture();
      }
    }, captureIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [captureIntervalMs, isActive]); // Only recreate when interval or active state changes

  useEffect(() => {
    ensurePermissionState();
  }, [ensurePermissionState]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportIncident({
          event_type: 'tab_hidden',
          severity: 'medium',
          details: { reason: 'document hidden' }
        });
      }
    };

    const handleBlur = () => {
      reportIncident({
        event_type: 'window_blur',
        severity: 'medium',
        details: { reason: 'window lost focus' }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [reportIncident]);

  return {
    isActive,
    cameraStatus,
    permissionState,
    cameraError,
    detectionStatus,
    lastCapture,
    violationCount,
    incidents,
    startMonitoring,
    stopMonitoring,
    captureSnapshot,
    handleUserMedia,
    handleCameraError,
    reportIncident
  };
};

export default useProctoringCamera;

