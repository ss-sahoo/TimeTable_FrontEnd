/**
 * ProctoringOverlay
 * ==================
 * Drop-in replacement for WebcamMonitor.
 * Shows:
 *  - Live webcam feed (expandable/minimizable)
 *  - Real-time audio level meter
 *  - Screenshot counter + last capture time
 *  - Violation log
 *  - Camera/Mic permission status
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Mic,
    MicOff,
    CameraOff,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Shield,
    Activity,
    Eye,
} from 'lucide-react';
import useProctoringEngine, { ProctoringViolation } from '../hooks/useProctoringEngine';

interface ProctoringOverlayProps {
    attemptId: number;
    screenshotIntervalSec?: number;   // default 10
    enableAudio?: boolean;            // default true
    enableVideoRecording?: boolean;   // default false
    onViolation?: (v: ProctoringViolation) => void;
}

const STATUS_DOT: Record<string, string> = {
    active: 'bg-emerald-500',
    requesting: 'bg-amber-400 animate-pulse',
    error: 'bg-red-500',
    denied: 'bg-red-600',
    idle: 'bg-slate-400',
    recording: 'bg-red-500 animate-pulse',
};

const ProctoringOverlay: React.FC<ProctoringOverlayProps> = ({
    attemptId,
    screenshotIntervalSec = 10,
    enableAudio = true,
    enableVideoRecording = false,
    onViolation,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [showLog, setShowLog] = useState(false);

    const { videoRef, canvasRef, status, forceScreenshot } = useProctoringEngine({
        attemptId,
        screenshotIntervalMs: screenshotIntervalSec * 1000,
        enableCamera: true,
        enableAudio,
        enableVideoRecording,
        onViolation,
    });

    const hasCameraIssue = status.camera === 'error' || status.camera === 'denied';
    const hasMicIssue = status.audio === 'error' || status.audio === 'denied';
    const violationCount = status.violations.length;

    // Audio level bar color
    const audioBarColor =
        status.audioLevel > 60 ? 'bg-red-500' :
            status.audioLevel > 30 ? 'bg-amber-500' :
                'bg-emerald-500';

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

            {/* ── Hidden canvas for screenshot capture ── */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Violation badge (floats above main panel) ── */}
            {violationCount > 0 && !expanded && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10"
                >
                    {violationCount > 9 ? '9+' : violationCount}
                </motion.div>
            )}

            {/* ── Violation Log Panel ── */}
            <AnimatePresence>
                {showLog && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        className="w-72 max-h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                Violation Log ({violationCount})
                            </span>
                            <button
                                onClick={() => setShowLog(false)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-52 divide-y divide-slate-100 dark:divide-slate-800">
                            {status.violations.length === 0 ? (
                                <p className="text-[11px] text-slate-400 text-center py-4">No violations recorded</p>
                            ) : (
                                [...status.violations].reverse().map((v, i) => (
                                    <div key={i} className="px-4 py-2.5 flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                                {v.type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{v.message}</p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">
                                                {v.timestamp.toLocaleTimeString()} · {Math.round(v.confidence * 100)}% confidence
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Proctoring Panel ── */}
            <motion.div
                layout
                className="w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 dark:bg-black">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                            Proctoring
                        </span>
                        {/* Rec indicator */}
                        {status.recording === 'recording' && (
                            <span className="flex items-center gap-1 ml-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[8px] font-bold text-red-400 uppercase">REC</span>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Violations badge */}
                        {violationCount > 0 && (
                            <button
                                onClick={() => setShowLog(v => !v)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                            >
                                <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                                <span className="text-[9px] font-bold text-red-400">{violationCount}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* ── Camera Feed ── */}
                            <div className="relative aspect-video bg-black">
                                {/* Live video element */}
                                <video
                                    ref={videoRef}
                                    muted
                                    playsInline
                                    autoPlay
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                {/* Camera error overlay */}
                                {hasCameraIssue && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900">
                                        <CameraOff className="w-6 h-6 text-red-400" />
                                        <p className="text-[9px] font-bold text-red-400 uppercase text-center px-4">
                                            {status.camera === 'denied' ? 'Camera access denied' : 'Camera unavailable'}
                                        </p>
                                    </div>
                                )}

                                {/* Requesting overlay */}
                                {status.camera === 'requesting' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80">
                                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Requesting access…</p>
                                    </div>
                                )}

                                {/* AI scan line animation */}
                                {status.camera === 'active' && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <motion.div
                                            animate={{ y: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
                                        />
                                        {/* Corner brackets */}
                                        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400/70" />
                                        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400/70" />
                                        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400/70" />
                                        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400/70" />
                                    </div>
                                )}

                                {/* Last capture badge */}
                                {status.lastScreenshotAt && (
                                    <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                                        <Eye className="w-2.5 h-2.5 text-blue-400" />
                                        <span className="text-[8px] text-white font-bold">{status.screenshotCount} captured</span>
                                    </div>
                                )}
                            </div>

                            {/* ── Status Row ── */}
                            <div className="px-3 py-2 grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-800">
                                {/* Camera status */}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status.camera] || 'bg-slate-400'}`} />
                                    {hasCameraIssue
                                        ? <CameraOff className="w-3 h-3 text-red-500" />
                                        : <Camera className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                    }
                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                        {status.camera === 'active' ? 'Camera On' : status.camera}
                                    </span>
                                </div>

                                {/* Mic status */}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status.audio] || 'bg-slate-400'}`} />
                                    {hasMicIssue
                                        ? <MicOff className="w-3 h-3 text-red-500" />
                                        : <Mic className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                    }
                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                        {status.isVoiceDetected ? 'Voice!' : status.audio === 'active' ? 'Mic On' : status.audio}
                                    </span>
                                </div>
                            </div>

                            {/* ── Audio Meter ── */}
                            {enableAudio && status.audio === 'active' && (
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-2.5 h-2.5 text-slate-500" />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">Audio Level</span>
                                        </div>
                                        <span className={`text-[9px] font-black ${status.isVoiceDetected ? 'text-red-500' : 'text-slate-400'}`}>
                                            {status.isVoiceDetected ? '⚠ VOICE' : `${status.audioLevel}%`}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={{ width: `${status.audioLevel}%` }}
                                            transition={{ duration: 0.3 }}
                                            className={`h-full rounded-full ${audioBarColor} transition-colors`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Footer ── */}
                            <div className="px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {violationCount === 0
                                        ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        : <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    }
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                        {violationCount === 0 ? 'No violations' : `${violationCount} violation${violationCount === 1 ? '' : 's'}`}
                                    </span>
                                </div>

                                <button
                                    onClick={forceScreenshot}
                                    className="text-[8px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide"
                                    title="Trigger manual screenshot"
                                >
                                    Capture now
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ProctoringOverlay;
