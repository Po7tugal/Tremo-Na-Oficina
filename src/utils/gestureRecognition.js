/**
 * gestureRecognition.js — Hand Sign Recognition Engine
 * -------------------------------------------------------
 * Implements a gesture detection pipeline using the browser's
 * MediaDevices API and Canvas 2D image analysis.
 *
 * ⚠️  ARCHITECTURE NOTE — MOCK RECOGNITION LAYER:
 * Full sign language recognition requires a trained ML model
 * (e.g. TensorFlow.js + MediaPipe Hands). Without a model,
 * this module implements a MOCK pipeline that:
 *   1. Demonstrates the full architecture for future integration
 *   2. Simulates gesture detection with controlled randomness
 *   3. Provides a stable interface that a real model can plug into
 *
 * TO INTEGRATE A REAL MODEL:
 *   Replace the `_mockRecognize()` method with a call to your
 *   chosen ML pipeline (MediaPipe Hands, TensorFlow.js HandPose, etc.)
 *   The rest of the pipeline (debouncing, confidence, callbacks) stays.
 *
 * Dependencies: WebRTC (navigator.mediaDevices), Canvas API
 * Used by: useWebcam hook
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum confidence threshold to accept a recognition result (0–1) */
const CONFIDENCE_THRESHOLD = 0.75;

/** Milliseconds a letter must be "held" before it's accepted */
const HOLD_DURATION_MS = 1500;

/** Milliseconds after acceptance before the same letter can fire again */
const COOLDOWN_MS = 2000;

/** How often (ms) the recognition pipeline runs */
const PIPELINE_INTERVAL_MS = 200;

// ─── Mock Letter Pool ─────────────────────────────────────────────────────────
// Used by the mock engine to simulate detections. In production, replace with
// actual landmark-to-letter mapping from your trained model.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── GestureRecognizer Class ──────────────────────────────────────────────────

/**
 * GestureRecognizer
 * -----------------
 * Manages the full recognition pipeline:
 *   VideoStream → Frame Capture → Feature Extraction → Letter Mapping
 *   → Confidence Scoring → Hold Debounce → Cooldown → Callback
 */
export class GestureRecognizer {
    constructor() {
        /** @type {HTMLVideoElement|null} */
        this._videoElement = null;

        /** @type {HTMLCanvasElement} — offscreen canvas for frame analysis */
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');

        /** @type {number|null} — setInterval id */
        this._intervalId = null;

        /** @type {string|null} — letter currently being held */
        this._holdingLetter = null;

        /** @type {number|null} — timestamp when holding started */
        this._holdStartTime = null;

        /** @type {string|null} — last accepted letter (for cooldown) */
        this._lastAcceptedLetter = null;

        /** @type {number|null} — timestamp of last acceptance */
        this._lastAcceptedTime = null;

        /** @type {Function|null} — callback when a letter is recognized */
        this._onLetterCallback = null;

        /** @type {Function|null} — callback for raw detection updates (UI display) */
        this._onDetectionCallback = null;

        /** @type {boolean} */
        this._active = false;

        // Mock: simulate no hand present initially
        this._mockHandPresent = false;
        this._mockCurrentLetter = null;
        this._mockChangeTimer = null;
    }

    /**
     * Initialize the recognizer with a video element.
     * @param {HTMLVideoElement} videoElement
     */
    init(videoElement) {
        this._videoElement = videoElement;
        this._canvas.width = 320;
        this._canvas.height = 240;
    }

    /**
     * Register a callback for confirmed letter recognition.
     * @param {Function} callback - (letter: string) => void
     */
    onLetter(callback) {
        this._onLetterCallback = callback;
    }

    /**
     * Register a callback for raw detection updates (every pipeline tick).
     * Use this to show live detection state in the UI.
     * @param {Function} callback - ({letter: string|null, confidence: number, holdProgress: number}) => void
     */
    onDetection(callback) {
        this._onDetectionCallback = callback;
    }

    /**
     * Start the recognition pipeline.
     */
    start() {
        if (this._active) return;
        this._active = true;
        this._startMockSimulation();
        this._intervalId = setInterval(() => this._tick(), PIPELINE_INTERVAL_MS);
    }

    /**
     * Stop the recognition pipeline and clean up.
     */
    stop() {
        this._active = false;
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._stopMockSimulation();
        this._reset();
    }

    /**
     * Main pipeline tick — runs every PIPELINE_INTERVAL_MS.
     * Steps:
     *   1. Capture current video frame
     *   2. Extract features (mock: use simulated data)
     *   3. Map features to letter + confidence
     *   4. Apply hold debounce
     *   5. Apply cooldown
     *   6. Fire callback if confirmed
     */
    _tick() {
        if (!this._videoElement || !this._active) return;

        // Step 1: Capture frame
        this._captureFrame();

        // Step 2 & 3: Recognize (mock implementation)
        const { letter, confidence } = this._mockRecognize();

        // Step 4 & 5 & 6: Debounce and emit
        this._processRecognition(letter, confidence);
    }

    /**
     * Capture the current video frame to the offscreen canvas.
     * In a real implementation, this frame would be passed to the ML model.
     */
    _captureFrame() {
        if (
            this._videoElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
        ) return;
        this._ctx.drawImage(
            this._videoElement,
            0, 0,
            this._canvas.width,
            this._canvas.height
        );
        // In a real implementation:
        // const imageData = this._ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
        // Pass imageData to ML model for feature extraction
    }

    /**
     * ⚠️  MOCK RECOGNITION — Replace this method with real ML inference.
     *
     * Real implementation would:
     *   1. Run MediaPipe Hands to get 21 3D hand landmarks
     *   2. Normalize landmarks relative to wrist
     *   3. Pass normalized landmarks through a classifier (KNN, MLP, etc.)
     *   4. Return top prediction + confidence score
     *
     * @returns {{ letter: string|null, confidence: number }}
     */
    _mockRecognize() {
        if (!this._mockHandPresent || !this._mockCurrentLetter) {
            return { letter: null, confidence: 0 };
        }
        // Simulate confidence fluctuation around 0.85
        const confidence = 0.75 + Math.random() * 0.2;
        return { letter: this._mockCurrentLetter, confidence };
    }

    /**
     * Apply hold-debounce and cooldown logic, then fire the callback.
     * A letter is confirmed when it's held steadily for HOLD_DURATION_MS.
     *
     * @param {string|null} letter
     * @param {number} confidence
     */
    _processRecognition(letter, confidence) {
        const now = Date.now();

        if (!letter || confidence < CONFIDENCE_THRESHOLD) {
            this._holdingLetter = null;
            this._holdStartTime = null;
            this._emitDetection(null, 0, 0);
            return;
        }

        // 🆕 Bloqueia QUALQUER letra durante o cooldown global
        if (this._lastAcceptedTime && now - this._lastAcceptedTime < COOLDOWN_MS) {
            this._holdingLetter = null;
            this._holdStartTime = null;
            this._emitDetection(letter, confidence, 0);
            return;
        }

        if (letter !== this._holdingLetter) {
            this._holdingLetter = letter;
            this._holdStartTime = now;
            this._emitDetection(letter, confidence, 0);
            return;
        }

        const holdDuration = now - this._holdStartTime;
        const holdProgress = Math.min(holdDuration / HOLD_DURATION_MS, 1);
        this._emitDetection(letter, confidence, holdProgress);

        if (holdDuration < HOLD_DURATION_MS) return;

        // ✅ Confirmado!
        this._lastAcceptedLetter = letter;
        this._lastAcceptedTime = now;
        this._holdingLetter = null;
        this._holdStartTime = null;

        if (this._onLetterCallback) {
            this._onLetterCallback(letter);
        }
    }

    /**
     * Emit raw detection state for the UI to display progress.
     */
    _emitDetection(letter, confidence, holdProgress) {
        if (this._onDetectionCallback) {
            this._onDetectionCallback({ letter, confidence, holdProgress });
        }
    }

    /**
     * Reset hold state.
     */
    _reset() {
        this._holdingLetter = null;
        this._holdStartTime = null;
    }

    // ─── Mock Simulation ──────────────────────────────────────────────────────

    /**
     * Simulate a hand appearing/disappearing and holding letters.
     * This drives the mock recognition system.
     *
     * In production: remove these methods entirely.
     * The real ML model drives `_mockRecognize()` instead.
     */
    _startMockSimulation() {
        const scheduleNext = () => {
            if (!this._active) return;
            // Alternate between hand present and absent
            const delay = this._mockHandPresent
                ? 1000 + Math.random() * 2000   // Show letter for 1–3s
                : 2000 + Math.random() * 3000;  // Wait 2–5s before next letter

            this._mockChangeTimer = setTimeout(() => {
                if (!this._active) return;
                if (this._mockHandPresent) {
                    // Hand leaves
                    this._mockHandPresent = false;
                    this._mockCurrentLetter = null;
                } else {
                    // Hand appears with a random letter
                    this._mockHandPresent = true;
                    this._mockCurrentLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
                }
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }

    /**
     * Simulate showing a specific letter (for keyboard/testing mode).
     * @param {string} letter
     */
    simulateLetter(letter) {
        // Simula hold imediato — só para testes com teclado
        this._holdingLetter = letter.toUpperCase();
        this._holdStartTime = Date.now() - HOLD_DURATION_MS; // já "segurou" o tempo todo
        this._tick(); // processa imediatamente
    }

    _stopMockSimulation() {
        if (this._mockChangeTimer) {
            clearTimeout(this._mockChangeTimer);
            this._mockChangeTimer = null;
        }
        this._mockHandPresent = false;
        this._mockCurrentLetter = null;
    }
}

// Singleton instance — shared across the app
export const gestureRecognizer = new GestureRecognizer();