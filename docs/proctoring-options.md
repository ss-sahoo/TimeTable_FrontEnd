# Free Browser Proctoring Stack

This note captures the free components we can stitch together for student-side webcam proctoring before paying for commercial SDKs.

## 1. Camera Capture & Transport
- **Browser APIs**: `navigator.mediaDevices.getUserMedia` is enough for HD webcam capture. Pair with `MediaRecorder` (record chunks) or `canvas.toDataURL` for JPEG snapshots. No licensing costs.
- **Preview UI**: `react-webcam` already wraps getUserMedia and works in Safari/Firefox/Chromium without extra binaries.
- **Optional Streaming**: For live invigilation, start with pure WebRTC:
  - Signaling: free Node/Socket.io channel or supabase realtime.
  - STUN: use Google's `stun:stun.l.google.com:19302`.
  - TURN: defer until needed; coturn can be self-hosted when bandwidth becomes an issue.

## 2. Automated Detection (Client-Side)
- **TensorFlow.js** (MIT) models:
  - `@tensorflow-models/blazeface` for single/multiple-face detection.
  - `@tensorflow-models/facemesh` or MediaPipe FaceMesh (Apache-2.0) for gaze/pose estimation.
- Run on captured frames inside a `requestAnimationFrame` loop; downscale frames to 160×160 to keep CPU <30% on mid laptops.
- Detection output becomes structured incidents (e.g., `no_face`, `multiple_faces`, `looking_away`) logged locally and sent via our API.

## 3. Backend Storage & Review
- **Snapshot uploads**: existing `/exams/attempts/:id/proctoring/snapshot/` endpoint accepts base64 images and triggers `AIProctoringSystem`.
- **Incident logging**: extend `ExamProctoring` JSON fields to store `{ event_type, severity, timestamp, details }`. Free Postgres JSONB handles this without extra services.
- **Admin review**: re-use existing attempts dashboard; add “Proctoring” tab fed by the new JSON data.

## 4. Browser Lockdown Helpers
- Already in place via `useExamSecurity` (fullscreen, copy/paste, right click, keyboard shortcuts, visibility). No extensions required.
- Extra free add-ons:
  - `document.visibilitychange`, `window.blur/focus`, `beforeunload` events to cross-check.
  - `navigator.permissions.query({ name: 'camera' })` to detect users who revoke permission mid-exam.

## 5. Roll-out Plan
1. **Consent Gate**: block question panel until webcam stream is active; show status + troubleshooting steps.
2. **Local Hook**: `useProctoringCamera` coordinates permission checks, auto-snapshots (every 30s), and incident reporting.
3. **Backend API**: log incidents + snapshots on free self-hosted Django/Postgres stack.
4. **Phase 2 (Optional)**: enable TF.js/MediaPipe detection to auto-flag missing faces or sideways gaze—still free.

## 6. Privacy & Compliance Checklist
- Show prominent consent banner (camera + microphone usage, storage duration).
- Send only JPEG blobs + structured metadata (UA, resolution). No continuous audio.
- Encrypt uploads via existing HTTPS; at rest, rely on Postgres + disk encryption (or S3 SSE) already available.
- Offer delete/export hooks to comply with local data laws (GDPR/CCPA) without paying for third-party storage.

## 7. Diagnostic Page
- Navigate to `/proctoring-test` (any authenticated user) to:
  - Enter a live attempt ID and spin up the `WebcamMonitor` without joining the full exam UI.
  - Toggle preview/autostart flags and adjust capture intervals to stress-test the snapshot pipeline.
  - Watch incident events stream in real time plus view the latest AI violation payloads.
- Use this page before high-stakes exams to confirm browsers grant camera access and that `/proctoring/incidents` is reachable from the test location.

