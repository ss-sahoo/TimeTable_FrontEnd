/**
 * useProctoringEngine
 * =====================
 * Professional, enterprise-grade proctoring hook for exam platforms.
 *
 * Features:
 *  - 📸 Periodic screenshot capture (default: every 10s) → sent to backend AI for analysis
 *  - 🎤 Audio monitoring via Web Audio API → detects sustained noise / voice
 *  - 📹 Video clip recording (30s chunks) → saved as blobs (optional upload)
 *  - 🔔 Violation event bus → fires callbacks with type, confidence, message
 *  - 🛡️ Graceful degradation → if camera/mic denied, flags it but doesn't crash
 *
 * Usage:
 *   const proctoring = useProctoringEngine({ attemptId, onViolation });
 *   <video ref={proctoring.videoRef} ... />
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from './useApi';

export type ProctoringViolationType =
    | 'no_face'
    | 'multiple_faces'
    | 'gaze_left'
    | 'gaze_right'
    | 'gaze_down'
    | 'gaze_up'
    | 'head_turned_left'
    | 'head_turned_right'
    | 'head_looking_down'
    | 'head_tilted'
    | 'audio_noise'
    | 'audio_voice_detected'
    | 'camera_blocked'
    | 'mic_blocked'
    | 'multiple_audio_sources';

export interface ProctoringViolation {
    type: ProctoringViolationType;
    confidence: number;
    message: string;
    timestamp: Date;
    source: 'camera' | 'audio' | 'system';
}

export interface ProctoringStatus {
    camera: 'idle' | 'requesting' | 'active' | 'error' | 'denied';
    audio: 'idle' | 'requesting' | 'active' | 'error' | 'denied';
    recording: 'idle' | 'recording' | 'paused' | 'error';
    screenshotCount: number;
    lastScreenshotAt: Date | null;
    audioLevel: number;          // 0-100 normalized
    isVoiceDetected: boolean;
    violations: ProctoringViolation[];
}

export interface ProctoringEngineOptions {
    attemptId: number;
    screenshotIntervalMs?: number;   // default 10000 (10s)
    audioCheckIntervalMs?: number;   // default 1000 (1s)
    audioNoiseThreshold?: number;    // 0-100, default 25
    audioVoiceThreshold?: number;    // 0-100, default 40
    enableCamera?: boolean;          // default true
    enableAudio?: boolean;           // default true
    enableVideoRecording?: boolean;  // default false (experimental)
    onViolation?: (violation: ProctoringViolation) => void;
    onStatusChange?: (status: ProctoringStatus) => void;
}

const useProctoringEngine = (options: ProctoringEngineOptions) => {
    const {
        attemptId,
        screenshotIntervalMs = 15000,
        audioCheckIntervalMs = 1000,
        audioNoiseThreshold = 25,
        audioVoiceThreshold = 45,
        enableCamera = true,
        enableAudio = true,
        enableVideoRecording = false,
        onViolation,
        onStatusChange,
    } = options;

    // ─── Refs ──────────────────────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const screenshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const violationCooldownsRef = useRef<Record<string, number>>({});
    const isMountedRef = useRef(true);
    const uploadFailCountRef = useRef(0);
    const captureFnRef = useRef<(() => Promise<void>) | null>(null);
    const incidentInCurrentClip = useRef(false);

    // ─── State ─────────────────────────────────────────────────────────────────
    const [status, setStatus] = useState<ProctoringStatus>({
        camera: 'idle',
        audio: 'idle',
        recording: 'idle',
        screenshotCount: 0,
        lastScreenshotAt: null,
        audioLevel: 0,
        isVoiceDetected: false,
        violations: [],
    });

    // ─── Helpers ───────────────────────────────────────────────────────────────

    const updateStatus = useCallback((patch: Partial<ProctoringStatus>) => {
        setStatus(prev => {
            const next = { ...prev, ...patch };
            onStatusChange?.(next);
            return next;
        });
    }, [onStatusChange]);

    /** Fire a violation — with a per-type cooldown to avoid spam */
    const fireViolation = useCallback((
        type: ProctoringViolationType,
        confidence: number,
        message: string,
        source: ProctoringViolation['source'],
        cooldownMs = 15000,
    ) => {
        const now = Date.now();
        const last = violationCooldownsRef.current[type] ?? 0;
        if (now - last < cooldownMs) return; // still in cooldown
        violationCooldownsRef.current[type] = now;

        const violation: ProctoringViolation = { type, confidence, message, timestamp: new Date(), source };

        setStatus(prev => {
            const violations = [...prev.violations, violation].slice(-100);
            const next = { ...prev, violations };
            onStatusChange?.(next);
            return next;
        });

        onViolation?.(violation);

        // Mark that an incident occurred in the current video chunk
        incidentInCurrentClip.current = true;

        // Async: report to backend (best-effort, don't await)
        api.post(`/exams/attempts/${attemptId}/violations/`, {
            violation_type: type,
            metadata: { confidence, message, source },
        }).catch(() => {/* silent */ });
    }, [attemptId, onViolation, onStatusChange]);

    // ─── Camera Setup ──────────────────────────────────────────────────────────

    const startCamera = useCallback(async () => {
        if (!enableCamera || streamRef.current) return;
        updateStatus({ camera: 'requesting' });

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 },
                },
                audio: enableAudio ? {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 44100,
                } : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

            streamRef.current = stream;

            // Attach video
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => { });
            }

            updateStatus({ camera: 'active', audio: enableAudio ? 'active' : 'idle' });

            // Set up audio analysis
            if (enableAudio) {
                try {
                    const audioCtx = new AudioContext();
                    audioContextRef.current = audioCtx;
                    const source = audioCtx.createMediaStreamSource(stream);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.smoothingTimeConstant = 0.8;
                    source.connect(analyser);
                    analyserRef.current = analyser;
                } catch {
                    updateStatus({ audio: 'error' });
                }
            }

            // Set up video recording if requested
            if (enableVideoRecording && MediaRecorder.isTypeSupported('video/webm')) {
                try {
                    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 250000 });
                    const chunks: Blob[] = [];

                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) chunks.push(e.data);
                    };

                    recorder.onstop = () => {
                        if (chunks.length > 0 && incidentInCurrentClip.current) {
                            const blob = new Blob(chunks, { type: 'video/webm' });
                            uploadVideoClip(blob);
                            chunks.length = 0;
                            incidentInCurrentClip.current = false; // Reset for next chunk
                        } else {
                            chunks.length = 0; // Discard clean clip
                            incidentInCurrentClip.current = false;
                        }
                    };

                    // Record in 60-second chunks for reliability
                    recorder.start();
                    // Record in 30s chunks to make uploads more reliable (smaller files)
                    const chunkInterval = setInterval(() => {
                        if (recorder.state === 'recording') {
                            console.log('[Proctoring] Closing video chunk for upload...');
                            recorder.stop();
                            // Small delay to allow stop event to finish before restarting
                            setTimeout(() => {
                                if (mediaRecorderRef.current && isMountedRef.current) {
                                    mediaRecorderRef.current.start();
                                }
                            }, 100);
                        }
                    }, 30000);

                    mediaRecorderRef.current = recorder;
                    updateStatus({ recording: 'recording' });

                    return () => clearInterval(chunkInterval);
                } catch {
                    updateStatus({ recording: 'error' });
                }
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            const isDenied = msg.includes('Permission denied') || msg.includes('NotAllowedError');
            updateStatus({ camera: isDenied ? 'denied' : 'error', audio: isDenied ? 'denied' : 'error' });

            if (isDenied) {
                fireViolation('camera_blocked', 1.0, 'Camera/microphone permission was denied by the student.', 'system', 0);
            }
        }
    }, [enableCamera, enableAudio, enableVideoRecording, updateStatus, fireViolation]);

    // ─── Screenshot Capture ────────────────────────────────────────────────────

    const captureAndAnalyzeScreenshot = useCallback(async (isManual = false) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        try {
            // Ensure video is actually playing and providing frames
            if (video.readyState < 2 || video.videoWidth === 0) {
                console.warn('[Proctoring] Video not ready for capture. Skipping frame.');
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const fullDataUrl = canvas.toDataURL('image/jpeg', 0.8);

            console.log(`[Proctoring] ${isManual ? 'MANUAL' : 'AUTO'} Uploading snapshot for attempt ${attemptId}`);

            const response = await api.post(`/exams/attempts/${attemptId}/proctoring/snapshot/`, {
                image_data: fullDataUrl,
                timestamp: new Date().toISOString(),
                metadata: { capture_type: isManual ? 'manual' : 'scheduled' }
            });

            uploadFailCountRef.current = 0;
            setStatus(prev => {
                const next = { ...prev, screenshotCount: prev.screenshotCount + 1, lastScreenshotAt: new Date() };
                onStatusChange?.(next);
                return next;
            });

            // Process analysis results
            const analysis = response.data.analysis;
            if (analysis && analysis.success && analysis.violations) {
                analysis.violations.forEach((v: any) => {
                    fireViolation(v.type, v.confidence || 0.8, v.message, 'camera', 10000);
                });
            }
        } catch (err) {
            console.error('[Proctoring] Upload failed:', err);
            uploadFailCountRef.current += 1;
            if (uploadFailCountRef.current > 5) {
                console.log('Stopping snapshot loop due to persistent failures');
                if (screenshotTimerRef.current) clearInterval(screenshotTimerRef.current);
            }
        }
    }, [attemptId, onStatusChange, fireViolation]);

    // Update the ref whenever the stable callback changes
    useEffect(() => {
        captureFnRef.current = () => captureAndAnalyzeScreenshot(false);
    }, [captureAndAnalyzeScreenshot]);

    // ─── Audio Monitoring ──────────────────────────────────────────────────────

    const checkAudioLevel = useCallback(() => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // 1. Calculate overall Volume (RMS) -> normalized 0-100
        const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length);
        const normalized = Math.min(100, Math.round((rms / 128) * 100));

        // 2. WHISPERING / SPEECH DETECTION (Refined frequency range analysis)
        // Focus on bins 10-60 (approx 400Hz - 2500Hz) where speech power is concentrated
        const speechBins = Array.from(dataArray.slice(10, 60));
        const speechAvg = speechBins.reduce((a, b) => a + b, 0) / speechBins.length;

        // Thresholds: Lowered for discrete whispering/talking
        const isVoice = speechAvg > (audioVoiceThreshold / 100) * 80; // More sensitive
        const isNoise = normalized > audioNoiseThreshold;

        updateStatus({ audioLevel: normalized, isVoiceDetected: isVoice });

        if (isVoice) {
            fireViolation('audio_voice_detected', 0.85, `VOICE DETECTED: Possible unauthorized talking or whispering (Level: ${normalized}%)`, 'audio', 30000);
        } else if (isNoise) {
            fireViolation('audio_noise', 0.5, `HIGH NOISE: Background noise level exceeded (Level: ${normalized}%)`, 'audio', 45000);
        }
    }, [audioNoiseThreshold, audioVoiceThreshold, updateStatus, fireViolation]);

    // ─── Upload video clip ─────────────────────────────────────────────────────

    const uploadVideoClip = async (blob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('video_clip', blob, `proctoring_${attemptId}_${Date.now()}.webm`);
            formData.append('attempt_id', String(attemptId));
            await api.post('/exams/proctoring/upload-clip/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch {
            // Silent — don't disrupt exam
        }
    };

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    useEffect(() => {
        isMountedRef.current = true;
        startCamera();

        return () => {
            isMountedRef.current = false;

            // Stop screenshot loop
            if (screenshotTimerRef.current) clearInterval(screenshotTimerRef.current);
            // Stop audio loop
            if (audioTimerRef.current) clearInterval(audioTimerRef.current);
            // Stop recorder
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            // Close audio context
            if (audioContextRef.current) audioContextRef.current.close();
            // Stop all tracks
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Start screenshot loop once camera is active
    useEffect(() => {
        if (status.camera !== 'active') return;

        console.log(`[Proctoring] Camera active. Taking first immediate snapshot.`);
        if (captureFnRef.current) {
            captureFnRef.current();
        }

        console.log(`[Proctoring] Starting automatic snapshot loop (${screenshotIntervalMs}ms)`);

        // Use a wrapper that calls the ref to avoid interval resets when state changes
        const interval = setInterval(() => {
            if (captureFnRef.current) captureFnRef.current();
        }, screenshotIntervalMs);

        screenshotTimerRef.current = interval;
        return () => {
            console.log(`[Proctoring] Stopping snapshot loop.`);
            clearInterval(interval);
        };
    }, [status.camera, screenshotIntervalMs]);

    // Start audio loop once audio is active
    useEffect(() => {
        if (status.audio !== 'active') return;

        audioTimerRef.current = setInterval(checkAudioLevel, audioCheckIntervalMs);
        return () => { if (audioTimerRef.current) clearInterval(audioTimerRef.current); };
    }, [status.audio, audioCheckIntervalMs, checkAudioLevel]);

    // CAMERA WATCHDOG: Detect and fix dark or frozen feeds
    useEffect(() => {
        if (status.camera !== 'active') return;

        const watchdog = setInterval(() => {
            const video = videoRef.current;
            if (!video || !streamRef.current) return;

            // 🛠️ AUTO-RECOVER STREAM: If element exists but stream is missing (after maximize)
            if (video.srcObject !== streamRef.current) {
                console.log("Watchdog: Re-attaching camera stream to video element.");
                video.srcObject = streamRef.current;
            }

            // Check if video is stuck, paused, or black
            if (video.paused || video.ended || video.readyState < 2) {
                video.play().catch(() => { });
            }
        }, 2000);

        return () => clearInterval(watchdog);
    }, [status.camera]);

    // RE-SYNC VIDEO: If the video element is remounted (maximized), re-attach the stream
    useEffect(() => {
        if (videoRef.current && streamRef.current && status.camera === 'active') {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.play().catch(() => { });
            }
        }
    }, [status.camera]); // Re-check when camera state changes or element re-renders

    // ─── Public API ────────────────────────────────────────────────────────────

    const forceScreenshot = useCallback(() => {
        captureAndAnalyzeScreenshot(true);
    }, [captureAndAnalyzeScreenshot]);

    const stopProctoring = useCallback(() => {
        if (screenshotTimerRef.current) clearInterval(screenshotTimerRef.current);
        if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        if (audioContextRef.current) audioContextRef.current.close();
        streamRef.current?.getTracks().forEach(t => t.stop());
        updateStatus({ camera: 'idle', audio: 'idle', recording: 'idle' });
    }, [updateStatus]);

    return {
        /** Attach to a <video> element to show the live feed */
        videoRef,
        /** Hidden canvas used for screenshot capture — render off-screen */
        canvasRef,
        /** Current proctoring status snapshot */
        status,
        /** Manually trigger a screenshot + backend analysis */
        forceScreenshot,
        /** Cleanly stop all proctoring streams */
        stopProctoring,
    };
};

export default useProctoringEngine;
