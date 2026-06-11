import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const CONFIDENCE_THRESHOLD = 0.75;
const HOLD_DURATION_MS = 1200;
const COOLDOWN_MS = 1800;
const PIPELINE_INTERVAL_MS = 80;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Normalised by palm size (wrist → middle MCP)
function nd(a, b, lm) {
  const palm = dist(lm[0], lm[9]) || 0.001;
  return dist(a, b) / palm;
}

// Is tip clearly above pip? (finger extended)
function up(tip, pip)   { return tip.y < pip.y - 0.02; }
// Is tip clearly below pip? (finger curled)
function down(tip, pip) { return tip.y > pip.y + 0.02; }
// Is tip roughly level with pip? (half-bent)
function level(tip, pip){ return Math.abs(tip.y - pip.y) <= 0.02; }

// Horizontal direction: tip to the LEFT of base (landmark coords: left = smaller x)
function pointingLeft(tip, base)  { return tip.x < base.x - 0.04; }
function pointingRight(tip, base) { return tip.x > base.x + 0.04; }

// ─── ASL Recognizer ───────────────────────────────────────────────────────────

function recognizeASL(lm) {
  // MediaPipe landmarks (right hand, mirrored camera):
  // 0=wrist, 1-4=thumb(cmc,mcp,ip,tip)
  // 5-8=index(mcp,pip,dip,tip), 9-12=middle, 13-16=ring, 17-20=pinky

  const idx   = { up: up(lm[8],lm[6]),   down: down(lm[8],lm[6]),   level: level(lm[8],lm[6])  };
  const mid   = { up: up(lm[12],lm[10]), down: down(lm[12],lm[10]), level: level(lm[12],lm[10]) };
  const ring  = { up: up(lm[16],lm[14]), down: down(lm[16],lm[14]), level: level(lm[16],lm[14]) };
  const pink  = { up: up(lm[20],lm[18]), down: down(lm[20],lm[18]), level: level(lm[20],lm[18]) };

  // Thumb: in mirrored camera, thumb tip to the RIGHT of thumb IP = thumb extended outward
  const thumbOut  = lm[4].x > lm[3].x + 0.03;
  const thumbIn   = lm[4].x < lm[3].x - 0.01;
  // Thumb pointing up (tip above ip joint)
  const thumbUpY  = lm[4].y < lm[3].y - 0.03;
  // Thumb pointing down
  const thumbDownY = lm[4].y > lm[3].y + 0.03;

  const allDown  = idx.down && mid.down && ring.down && pink.down;
  const allUp    = idx.up   && mid.up   && ring.up   && pink.up;

  // Key normalised distances
  const t2idx  = nd(lm[4], lm[8],  lm);  // thumb tip → index tip
  const t2mid  = nd(lm[4], lm[12], lm);  // thumb tip → middle tip
  const t2ring = nd(lm[4], lm[16], lm);  // thumb tip → ring tip
  const t2pink = nd(lm[4], lm[20], lm);  // thumb tip → pinky tip
  const i2mid  = nd(lm[8], lm[12], lm);  // index tip → middle tip

  // Thumb tip to index MCP (base)
  const t2idxMcp = nd(lm[4], lm[5], lm);

  // How horizontal is the index finger?
  // (close y values between tip and mcp = horizontal)
  const idxHoriz = Math.abs(lm[8].y - lm[5].y) < 0.06;
  const idxMidHoriz = Math.abs(lm[8].y - lm[5].y) < 0.06 &&
                      Math.abs(lm[12].y - lm[9].y) < 0.06;

  // ── A: fist, thumb rests alongside (not over fingers, not out) ────────────
  // All fingers curled, thumb to the side (not tucked under, not spread)
  if (allDown && !thumbOut && t2idx > 0.3 && t2idx < 0.75 && !thumbUpY) {
    return { letter: "A", confidence: 0.90 };
  }

  // ── B: 4 fingers straight up, thumb tucked across palm ────────────────────
  if (allUp && thumbIn && !thumbOut) {
    return { letter: "B", confidence: 0.92 };
  }

  // ── C: hand curved like letter C, thumb out, all fingers curved but not closed ─
  if (
    !idx.up && !idx.down && !mid.up && !mid.down &&
    !ring.up && !ring.down &&
    thumbOut &&
    t2idx > 0.35 && t2idx < 0.75 &&
    t2mid > 0.35
  ) {
    return { letter: "C", confidence: 0.82 };
  }

  // ── D: index up, middle+ring+pinky curl to touch thumb ────────────────────
  // Index fully up, others down, thumb meets curled fingers
  if (
    idx.up && mid.down && ring.down && pink.down &&
    t2mid < 0.40 && !thumbOut
  ) {
    return { letter: "D", confidence: 0.86 };
  }

  // ── E: all fingers curled down, thumb tucked under fingers ────────────────
  // All tips point down/forward, thumb tucked fully in
  if (
    allDown && thumbIn &&
    t2idx < 0.35 && t2mid < 0.38
  ) {
    return { letter: "E", confidence: 0.84 };
  }

  // ── F: index+thumb form OK circle, middle+ring+pinky up ───────────────────
  if (
    !idx.up && mid.up && ring.up && pink.up &&
    t2idx < 0.28
  ) {
    return { letter: "F", confidence: 0.86 };
  }

  // ── G: index points horizontally to the side, thumb parallel, others curled ─
  // Index horizontal (tip and MCP at similar height), others down, thumb out horizontally
  if (
    !idx.up && idxHoriz && mid.down && ring.down && pink.down &&
    thumbOut && !thumbUpY
  ) {
    return { letter: "G", confidence: 0.82 };
  }

  // ── H: index+middle both pointing horizontally, side by side ──────────────
  if (
    !idx.up && !mid.up && idxMidHoriz &&
    ring.down && pink.down &&
    i2mid < 0.30
  ) {
    return { letter: "H", confidence: 0.82 };
  }

  // ── I: only pinky up, thumb can be slightly out ───────────────────────────
  if (idx.down && mid.down && ring.down && pink.up && !thumbOut) {
    return { letter: "I", confidence: 0.88 };
  }

  // ── J: pinky up + thumb out (J has a movement but static = I + thumb out) ─
  if (idx.down && mid.down && ring.down && pink.up && thumbOut) {
    return { letter: "J", confidence: 0.76 };
  }

  // ── K: index+middle up in V, thumb tip touches middle pip (not tip) ───────
  // Spread V with thumb poking up between them
  if (
    idx.up && mid.up && ring.down && pink.down &&
    thumbOut && thumbUpY &&
    t2mid < 0.55 && i2mid > 0.22
  ) {
    return { letter: "K", confidence: 0.83 };
  }

  // ── L: index up + thumb out horizontal, others down ───────────────────────
  if (idx.up && mid.down && ring.down && pink.down && thumbOut && !thumbUpY) {
    return { letter: "L", confidence: 0.90 };
  }

  // ── M: 4 fingers relaxed open pointing forward/down, palm facing viewer ───
  // All 4 fingers up but together, thumb tucked, hand open like a flat palm
  // Actually in ASL: thumb tucked under index+middle+ring (3 fingers over thumb)
  if (
    !idx.up && !mid.up && !ring.up && !pink.up &&
    thumbIn &&
    t2idx < 0.45 && t2mid < 0.45 && t2ring < 0.45
  ) {
    return { letter: "M", confidence: 0.80 };
  }

  // ── N: thumb tucked under index+middle only (2 fingers over thumb) ─────────
  if (
    !idx.up && !mid.up && ring.down && pink.down &&
    thumbIn &&
    t2idx < 0.38 && t2mid < 0.38 && t2ring > 0.40
  ) {
    return { letter: "N", confidence: 0.79 };
  }

  // ── O: all fingers + thumb form a circle, tips meet thumb ─────────────────
  if (
    !idx.up && !mid.up && !ring.up && !pink.up &&
    thumbOut &&
    t2idx < 0.32 && t2mid < 0.38 && t2ring < 0.40
  ) {
    return { letter: "O", confidence: 0.83 };
  }

  // ── P: like K but whole hand points downward ──────────────────────────────
  // Index+middle down (pointing to floor), thumb between them, wrist rotated
  if (
    !idx.up && !mid.up && ring.down && pink.down &&
    lm[8].y > lm[5].y + 0.04 &&   // index tip below MCP = pointing down
    lm[12].y > lm[9].y + 0.04 &&  // middle tip below MCP = pointing down
    thumbOut &&
    t2mid < 0.55
  ) {
    return { letter: "P", confidence: 0.78 };
  }

  // ── Q: like G but pointing down (index+thumb form downward pinch) ──────────
  if (
    !idx.up && mid.down && ring.down && pink.down &&
    thumbDownY &&
    lm[8].y > lm[5].y + 0.03 &&
    t2idx < 0.45
  ) {
    return { letter: "Q", confidence: 0.77 };
  }

  // ── R: index+middle crossed (tips very close, crossing each other) ─────────
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut &&
    i2mid < 0.14  // tips extremely close = crossed
  ) {
    return { letter: "R", confidence: 0.84 };
  }

  // ── S: fist with thumb wrapped OVER the fingers ───────────────────────────
  if (
    allDown && !thumbIn &&
    thumbUpY === false &&
    t2idx < 0.38 && t2mid < 0.42 &&
    lm[4].y < lm[8].y  // thumb tip above index tip (wrapped over)
  ) {
    return { letter: "S", confidence: 0.84 };
  }

  // ── T: thumb pokes UP between index and middle fingers ────────────────────
  if (
    !idx.up && !mid.up && !ring.up && !pink.up &&
    thumbUpY &&
    t2idxMcp < 0.45
  ) {
    return { letter: "T", confidence: 0.79 };
  }

  // ── U: index+middle up TOGETHER (close), ring+pinky down, no thumb ────────
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut &&
    i2mid < 0.20  // close together = U
  ) {
    return { letter: "U", confidence: 0.86 };
  }

  // ── V: index+middle up SPREAD apart, ring+pinky down ─────────────────────
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut &&
    i2mid >= 0.20  // spread apart = V
  ) {
    return { letter: "V", confidence: 0.87 };
  }

  // ── W: index+middle+ring up, pinky down, no thumb ─────────────────────────
  if (idx.up && mid.up && ring.up && pink.down && !thumbOut) {
    return { letter: "W", confidence: 0.88 };
  }

  // ── X: index finger hooked/bent (pip up but tip curled back down) ──────────
  // Index pip is up but tip is not fully up (hook shape)
  if (
    !idx.up && !idx.down &&          // index tip at mid-height (hooked)
    lm[7].y < lm[6].y &&            // dip above pip = still some extension
    lm[8].y > lm[7].y + 0.01 &&     // tip curling back
    mid.down && ring.down && pink.down && !thumbOut
  ) {
    return { letter: "X", confidence: 0.78 };
  }

  // ── Y: pinky + thumb both out, others curled ──────────────────────────────
  if (idx.down && mid.down && ring.down && pink.up && thumbOut) {
    return { letter: "Y", confidence: 0.88 };
  }

  // ── Z: index up and pointing, drawn in air ────────────────────────────────
  // Static approximation: index fully up, others down, thumb out to the side
  if (
    idx.up && mid.down && ring.down && pink.down &&
    thumbOut && !thumbUpY
  ) {
    return { letter: "Z", confidence: 0.76 };
  }

  // ── ENTER: full open hand, all up + thumb out ─────────────────────────────
  if (allUp && thumbOut) {
    return { letter: "ENTER", confidence: 0.92 };
  }

  // ── BACKSPACE: thumbs down gesture ────────────────────────────────────────
  if (allDown && thumbDownY && !thumbIn) {
    return { letter: "BACKSPACE", confidence: 0.83 };
  }

  return { letter: null, confidence: 0 };
}

// ─── GestureRecognizer class ──────────────────────────────────────────────────

class GestureRecognizer {
  constructor() {
    this.video = null;
    this.landmarker = null;
    this.intervalId = null;
    this.holdingLetter = null;
    this.holdStartTime = null;
    this.lastAcceptedTime = 0;
    this.onLetterCallback = null;
    this.onDetectionCallback = null;
    this.onLandmarksCallback = null;
  }

  async init(videoElement) {
    this.video = videoElement;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }

  onLetter(cb)    { this.onLetterCallback    = cb; }
  onDetection(cb) { this.onDetectionCallback = cb; }
  onLandmarks(cb) { this.onLandmarksCallback = cb; }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.detect(), PIPELINE_INTERVAL_MS);
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  detect() {
    if (!this.video || !this.landmarker) return;
    const result = this.landmarker.detectForVideo(this.video, performance.now());

    if (!result.landmarks.length) {
      this.processRecognition(null, 0);
      return;
    }

    const landmarks = result.landmarks[0];
    if (this.onLandmarksCallback) this.onLandmarksCallback(landmarks);

    const { letter, confidence } = recognizeASL(landmarks);
    this.processRecognition(letter, confidence);
  }

  processRecognition(letter, confidence) {
    const now = Date.now();

    if (!letter || confidence < CONFIDENCE_THRESHOLD) {
      this.holdingLetter = null;
      this.holdStartTime = null;
      this.emitDetection(null, 0, 0);
      return;
    }

    if (now - this.lastAcceptedTime < COOLDOWN_MS) return;

    if (letter !== this.holdingLetter) {
      this.holdingLetter = letter;
      this.holdStartTime = now;
      this.emitDetection(letter, confidence, 0);
      return;
    }

    const hold = now - this.holdStartTime;
    const progress = Math.min(hold / HOLD_DURATION_MS, 1);
    this.emitDetection(letter, confidence, progress);

    if (hold < HOLD_DURATION_MS) return;

    this.lastAcceptedTime = now;
    this.holdingLetter = null;
    this.holdStartTime = null;
    if (this.onLetterCallback) this.onLetterCallback(letter);
  }

  emitDetection(letter, confidence, holdProgress) {
    if (this.onDetectionCallback) {
      this.onDetectionCallback({ letter, confidence, holdProgress });
    }
  }

  simulateLetter(letter) {
    if (this.onLetterCallback) this.onLetterCallback(letter);
  }
}

export const gestureRecognizer = new GestureRecognizer();