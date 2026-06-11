import React, { useEffect, useRef } from 'react';
import { useWebcam } from '../hooks/useWebcam.js';
import { gestureRecognizer } from '../utils/gestureRecognition.js';

// Hand skeleton connections (MediaPipe topology)
const CONNECTIONS = [
  // Thumb
  [0,1],[1,2],[2,3],[3,4],
  // Index
  [0,5],[5,6],[6,7],[7,8],
  // Middle
  [5,9],[9,10],[10,11],[11,12],
  // Ring
  [9,13],[13,14],[14,15],[15,16],
  // Pinky
  [13,17],[17,18],[18,19],[19,20],
  // Palm
  [0,17],
];

// Colour per finger group (indices into landmarks array)
const FINGER_COLORS = {
  thumb:  '#f97316', // orange
  index:  '#22d3ee', // cyan
  middle: '#a78bfa', // violet
  ring:   '#34d399', // green
  pinky:  '#f472b6', // pink
  palm:   '#94a3b8', // slate
};

function getLandmarkColor(idx) {
  if (idx <= 4)              return FINGER_COLORS.thumb;
  if (idx >= 5  && idx <= 8) return FINGER_COLORS.index;
  if (idx >= 9  && idx <= 12) return FINGER_COLORS.middle;
  if (idx >= 13 && idx <= 16) return FINGER_COLORS.ring;
  if (idx >= 17 && idx <= 20) return FINGER_COLORS.pinky;
  return FINGER_COLORS.palm;
}

function getConnectionColor(a, b) {
  // Colour the bone based on the tip landmark
  return getLandmarkColor(Math.max(a, b));
}

export function WebcamView({ onLetter, disabled }) {
  const canvasRef = useRef(null);

  const {
    videoRef,
    cameraState,
    errorMessage,
    detection,
    startCamera,
    stopCamera,
    simulateLetter,
  } = useWebcam(disabled ? () => {} : onLetter);

  const isActive = cameraState === 'active';

  // ── Draw hand landmarks on canvas ──────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    let lastLandmarks = null;
    let rafId = null;

    // Continuously clear canvas when no hand is detected
    function clearLoop() {
      if (!lastLandmarks) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      rafId = requestAnimationFrame(clearLoop);
    }
    rafId = requestAnimationFrame(clearLoop);

    gestureRecognizer.onLandmarks((landmarks) => {
      lastLandmarks = landmarks;

      // Match canvas size to video
      const w = video.videoWidth  || 640;
      const h = video.videoHeight || 480;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // ── Bones ────────────────────────────────────────────────────────────
      CONNECTIONS.forEach(([a, b]) => {
        const pa = landmarks[a];
        const pb = landmarks[b];
        if (!pa || !pb) return;

        // Mirror X to match the video transform: scaleX(-1)
        const ax = (1 - pa.x) * w;
        const ay = pa.y * h;
        const bx = (1 - pb.x) * w;
        const by = pb.y * h;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = getConnectionColor(a, b);
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
      });

      // ── Landmark dots ─────────────────────────────────────────────────────
      ctx.globalAlpha = 1;
      landmarks.forEach((p, i) => {
        const x = (1 - p.x) * w;
        const y = p.y * h;
        const color = getLandmarkColor(i);

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = color + '33'; // 20% opacity
        ctx.fill();

        // Filled dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // White centre for finger tips (4, 8, 12, 16, 20)
        if ([4, 8, 12, 16, 20].includes(i)) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      });

      // After a frame with landmarks, start a timeout to clear if no new data
      setTimeout(() => { lastLandmarks = null; }, 200);
    });

    return () => {
      cancelAnimationFrame(rafId);
      gestureRecognizer.onLandmarks(() => {});
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isActive, videoRef]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <section className="webcam-section">

      <h2 className="section-title">📷 Câmara</h2>

      <div className="video-wrapper">

        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
        />

        {/* Canvas sits on top of the video, same size, mirrored */}
        <canvas
          ref={canvasRef}
          className="hand-overlay"
          style={{ display: isActive ? 'block' : 'none' }}
        />

        {!isActive && (
          <div className="video-placeholder">
            <span className="placeholder-icon">🖐</span>
            <span className="placeholder-text">Câmara desligada</span>
          </div>
        )}

        {/* Letter + hold-progress overlay */}
        {isActive && detection?.letter && (
          <div className="detection-overlay">
            <div className="detected-letter">
              {detection.letter}
            </div>

            <div className="hold-progress-bar">
              <div
                className="hold-progress-fill"
                style={{ width: `${detection.holdProgress * 100}%` }}
              />
            </div>

            <div className="confidence-label">
              {Math.round(detection.confidence * 100)}%
            </div>
          </div>
        )}

      </div>

      {/* Controls */}
      <div className="camera-controls">
        {!isActive ? (
          <button className="btn btn-primary" onClick={startCamera}>
            ▶ Ligar Câmara
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={stopCamera}>
            ⏹ Desligar
          </button>
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="error-banner">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Test buttons */}
      {!disabled && (
        <div className="gesture-actions">
          <button onClick={() => simulateLetter('ENTER')}>✋ ENTER</button>
          <button onClick={() => simulateLetter('BACKSPACE')}>👎 DELETE</button>
        </div>
      )}

    </section>
  );
}