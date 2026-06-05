/**
 * gestureRecognition.js – Hand Gesture Recognition Pipeline
 *
 * Purpose:
 *   Provides a modular gesture recognition system that processes webcam
 *   frames and attempts to classify hand signs as ASL alphabet letters.
 *
 * Architecture Decision:
 *   Full ML-based hand landmark detection (e.g. MediaPipe Hands) requires
 *   loading a ~12MB WASM model and is not feasible without internet for the
 *   initial load OR a locally bundled model file. This module implements:
 *     1. A REAL WebRTC camera pipeline (always active).
 *     2. A basic skin-color + contour heuristic layer that demonstrates
 *        where a real recognizer would plug in.
 *     3. A MOCK RECOGNITION LAYER that simulates letter detection with
 *        configurable confidence scores and debouncing.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  FUTURE INTEGRATION POINT                                        │
 *   │  Replace `mockClassifyFrame()` with a real classifier:           │
 *   │    - MediaPipe Hands (self-hosted WASM model)                    │
 *   │    - TensorFlow.js + custom ASL model (bundled .json + weights)  │
 *   │    - Hand landmark geometry rules (no ML, rule-based)            │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Dependencies: Browser WebRTC (getUserMedia), Canvas API.
 * Interactions: Used by useGestureRecognition hook.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Minimum confidence score (0–1) to accept a classification */
export const CONFIDENCE_THRESHOLD = 0.72;

/** Milliseconds a letter must be held before it's "inserted" */
export const HOLD_DURATION_MS = 1200;

/** Milliseconds to ignore after a letter is inserted (debounce) */
export const DEBOUNCE_MS = 1800;

/** Canvas size for frame analysis */
const ANALYSIS_W = 160;
const ANALYSIS_H = 120;

// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} RecognitionResult
 * @property {string|null} letter       - Detected letter or null
 * @property {number}      confidence   - 0.0 – 1.0
 * @property {string}      method       - 'mock' | 'heuristic' | 'ml'
 * @property {number}      timestamp    - performance.now()
 */

// ─── Internal canvas for pixel analysis ──────────────────────────────────────
let _analysisCanvas = null;
let _analysisCtx = null;

function getAnalysisCanvas() {
  if (!_analysisCanvas) {
    _analysisCanvas = document.createElement('canvas');
    _analysisCanvas.width = ANALYSIS_W;
    _analysisCanvas.height = ANALYSIS_H;
    _analysisCtx = _analysisCanvas.getContext('2d', { willReadFrequently: true });
  }
  return { canvas: _analysisCanvas, ctx: _analysisCtx };
}

// ─── Skin Detection Heuristic ─────────────────────────────────────────────────
/**
 * Counts pixels that fall within a skin-tone HSV range.
 * Returns a ratio 0–1 indicating how much of the frame looks like skin.
 * This is a REAL computation on the video feed, not mocked.
 *
 * @param {HTMLVideoElement} video
 * @returns {{ skinRatio: number, pixelCount: number }}
 */
export function analyzeSkinPixels(video) {
  if (!video || video.readyState < 2) return { skinRatio: 0, pixelCount: 0 };

  const { ctx } = getAnalysisCanvas();
  ctx.drawImage(video, 0, 0, ANALYSIS_W, ANALYSIS_H);

  let data;
  try {
    data = ctx.getImageData(0, 0, ANALYSIS_W, ANALYSIS_H).data;
  } catch {
    // Cross-origin or security error
    return { skinRatio: 0, pixelCount: 0 };
  }

  let skinCount = 0;
  const total = ANALYSIS_W * ANALYSIS_H;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Simple RGB skin heuristic (works across a range of skin tones)
    const isSkin =
      r > 60 && g > 30 && b > 15 &&
      r > b &&
      Math.abs(r - g) > 10 &&
      r - g > 10 &&
      r - b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15;

    if (isSkin) skinCount++;
  }

  return { skinRatio: skinCount / total, pixelCount: skinCount };
}

// ─── Mock Classifier ──────────────────────────────────────────────────────────
/**
 * Mock classification layer.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  FUTURE INTEGRATION POINT                                        ║
 * ║  Replace this function body with a real ML or rule-based         ║
 * ║  classifier. The contract remains the same:                      ║
 * ║    Input:  HTMLVideoElement, skinRatio float                     ║
 * ║    Output: RecognitionResult                                     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Current behaviour:
 *   - If skin ratio is high enough (hand visible), simulate a stable
 *     random letter with slowly drifting confidence so the UI
 *     "lock-on" bar animates realistically.
 *   - Returns null when no hand is visible.
 */

let _mockState = {
  currentLetter: null,
  confidence: 0,
  framesSinceChange: 0,
  stabilityCounter: 0,
};

export function mockClassifyFrame(video, skinRatio) {
  // No hand detected → reset
  if (skinRatio < 0.04) {
    _mockState = { currentLetter: null, confidence: 0, framesSinceChange: 0, stabilityCounter: 0 };
    return { letter: null, confidence: 0, method: 'mock', timestamp: performance.now() };
  }

  _mockState.framesSinceChange++;

  // Every ~90 frames (~3s at 30fps) drift to a new letter
  if (_mockState.framesSinceChange > 90 || !_mockState.currentLetter) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    _mockState.currentLetter = letters[Math.floor(Math.random() * letters.length)];
    _mockState.framesSinceChange = 0;
    _mockState.confidence = 0.3 + Math.random() * 0.2;
  }

  // Confidence ramps up over ~40 frames then stabilises with noise
  const target = 0.75 + (skinRatio - 0.04) * 2;
  _mockState.confidence += (_mockState.confidence < target ? 0.02 : -0.01);
  _mockState.confidence = Math.min(0.99, Math.max(0.1, _mockState.confidence + (Math.random() - 0.5) * 0.03));

  return {
    letter: _mockState.currentLetter,
    confidence: _mockState.confidence,
    method: 'mock',
    timestamp: performance.now(),
  };
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
/**
 * Process one video frame through the full recognition pipeline.
 * Called once per animation frame.
 *
 * @param {HTMLVideoElement} video
 * @returns {RecognitionResult}
 */
export function processFrame(video) {
  const { skinRatio } = analyzeSkinPixels(video);

  // ── FUTURE: insert ML model inference here ──────────────────────────────
  // const mlResult = await runMLModel(video);
  // if (mlResult.confidence > CONFIDENCE_THRESHOLD) return mlResult;
  // ────────────────────────────────────────────────────────────────────────

  return mockClassifyFrame(video, skinRatio);
}

// ─── Camera Utilities ─────────────────────────────────────────────────────────
/**
 * Request camera access and return a MediaStream.
 * Tries to use the environment/front-facing camera at HD resolution.
 *
 * @returns {Promise<MediaStream>}
 */
export async function requestCameraStream() {
  const constraints = {
    video: {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      facingMode: 'user',
      frameRate: { ideal: 30 },
    },
    audio: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Stop all tracks on a MediaStream.
 * @param {MediaStream} stream
 */
export function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

// ─── Debounce / Hold Logic ────────────────────────────────────────────────────
/**
 * Stateful tracker that converts a stream of recognition results into
 * discrete "letter inserted" events with hold-time and debounce.
 *
 * Usage:
 *   const tracker = createHoldTracker();
 *   // In your animation loop:
 *   const inserted = tracker.update(result);
 *   if (inserted) { /* add letter to board *\/ }
 */
export function createHoldTracker() {
  let heldLetter = null;
  let holdStart = null;
  let lastInsertTime = 0;

  return {
    /**
     * @param {RecognitionResult} result
     * @returns {string|null} Letter to insert, or null
     */
    update(result) {
      const now = performance.now();

      // Still in debounce window after last insert
      if (now - lastInsertTime < DEBOUNCE_MS) return null;

      if (!result.letter || result.confidence < CONFIDENCE_THRESHOLD) {
        heldLetter = null;
        holdStart = null;
        return null;
      }

      // New letter – start hold timer
      if (result.letter !== heldLetter) {
        heldLetter = result.letter;
        holdStart = now;
        return null;
      }

      // Same letter – check if held long enough
      if (now - holdStart >= HOLD_DURATION_MS) {
        lastInsertTime = now;
        heldLetter = null;
        holdStart = null;
        return result.letter;
      }

      return null;
    },

    /** Progress 0–1 of how long the current letter has been held */
    getHoldProgress(result) {
      if (!heldLetter || !holdStart || result?.letter !== heldLetter) return 0;
      return Math.min(1, (performance.now() - holdStart) / HOLD_DURATION_MS);
    },

    reset() {
      heldLetter = null;
      holdStart = null;
      lastInsertTime = 0;
    },
  };
}