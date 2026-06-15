import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const CONFIDENCE_THRESHOLD = 0.75;
const HOLD_DURATION_MS = 1200;
const COOLDOWN_MS = 1800;
const PIPELINE_INTERVAL_MS = 80;

// ─── Auxiliares de geometria ───────────────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Distância normalizada pelo tamanho da palma (pulso → MCP do meio)
function nd(a, b, lm) {
  const palm = dist(lm[0], lm[9]) || 0.001;
  return dist(a, b) / palm;
}

// O tip está claramente acima do pip? (dedo estendido)
function up(tip, pip)    { return tip.y < pip.y - 0.02; }
// O tip está claramente abaixo do pip? (dedo dobrado)
function down(tip, pip)  { return tip.y > pip.y + 0.02; }
// O tip está ao nível do pip? (meio dobrado)
function level(tip, pip) { return Math.abs(tip.y - pip.y) <= 0.02; }

// ─── Reconhecedor LGP ─────────────────────────────────────────────────────────
//
// Referência visual: Alfabeto Manual — Associação Portuguesa de Surdos (2009)
//
// Landmarks MediaPipe (câmara espelhada, mão direita):
//   0=pulso  1-4=polegar(cmc,mcp,ip,tip)
//   5-8=indicador(mcp,pip,dip,tip)  9-12=médio  13-16=anelar  17-20=mínimo

function recognizeLGP(lm) {
  // ── Estado de cada dedo ───────────────────────────────────────────────────
  const idx  = { up: up(lm[8],lm[6]),   down: down(lm[8],lm[6]),   level: level(lm[8],lm[6])  };
  const mid  = { up: up(lm[12],lm[10]), down: down(lm[12],lm[10]), level: level(lm[12],lm[10]) };
  const ring = { up: up(lm[16],lm[14]), down: down(lm[16],lm[14]), level: level(lm[16],lm[14]) };
  const pink = { up: up(lm[20],lm[18]), down: down(lm[20],lm[18]), level: level(lm[20],lm[18]) };

  // Polegar: na câmara espelhada, tip à DIREITA do IP = polegar aberto
  const thumbOut   = lm[4].x > lm[3].x + 0.03;
  const thumbIn    = lm[4].x < lm[3].x - 0.01;
  const thumbUpY   = lm[4].y < lm[3].y - 0.03;
  const thumbDownY = lm[4].y > lm[3].y + 0.03;

  const allDown = idx.down && mid.down && ring.down && pink.down;
  const allUp   = idx.up   && mid.up   && ring.up   && pink.up;

  // Distâncias normalizadas entre pontas
  const t2idx  = nd(lm[4], lm[8],  lm);
  const t2mid  = nd(lm[4], lm[12], lm);
  const t2ring = nd(lm[4], lm[16], lm);
  const t2pink = nd(lm[4], lm[20], lm);
  const i2mid  = nd(lm[8], lm[12], lm);
  const i2pink = nd(lm[8], lm[20], lm);
  const m2ring = nd(lm[12],lm[16], lm);

  // ── A: punho fechado, polegar ao lado (ponta do polegar sobre o indicador) ─
  // LGP-A: dedos dobrados, polegar repousa lateralmente sobre os dedos
  if (allDown && !thumbOut && t2idx > 0.25 && t2idx < 0.65 && !thumbUpY) {
    return { letter: "A", confidence: 0.88 };
  }

  // ── B: polegar para cima, restantes dedos dobrados ───────────────────────
  // LGP-B: punho fechado mas com polegar esticado para cima
  if (allDown && thumbUpY && !thumbOut) {
    return { letter: "B", confidence: 0.90 };
  }

  // ── C: mão em forma de C, dedos curvados, polegar afastado ───────────────
  // LGP-C: igual ao ASL — arco entre polegar e dedos
  if (
    !idx.up && !idx.down &&
    !mid.up && !mid.down &&
    !ring.up && !ring.down &&
    thumbOut &&
    t2idx > 0.30 && t2idx < 0.72 &&
    t2mid > 0.30
  ) {
    return { letter: "C", confidence: 0.82 };
  }

  // ── D: mão aberta, dedos juntos, polegar dobrado para a palma ─────────────
  // LGP-D: palma aberta virada para a frente, 4 dedos juntos e estendidos, polegar fletido
  if (
    allUp && thumbIn &&
    i2mid < 0.22 && m2ring < 0.22
  ) {
    return { letter: "D", confidence: 0.85 };
  }

  // ── E: indicador estendido, restantes dobrados, polegar dobrado ────────────
  // LGP-E: apenas indicador estendido (apontar)
  if (
    idx.up && mid.down && ring.down && pink.down && !thumbOut
  ) {
    return { letter: "E", confidence: 0.88 };
  }

  // ── F: indicador e polegar formam OK/círculo, outros três estendidos ───────
  // LGP-F: igual ao ASL-F
  if (
    !idx.up && mid.up && ring.up && pink.up &&
    t2idx < 0.28
  ) {
    return { letter: "F", confidence: 0.85 };
  }

  // ── G: indicador e polegar estendidos horizontalmente (pistola) ───────────
  // LGP-G: indicador aponta para o lado, polegar para cima (forma de L deitado)
  if (
    idx.up && mid.down && ring.down && pink.down &&
    thumbOut && !thumbUpY
  ) {
    return { letter: "G", confidence: 0.83 };
  }

  // ── H: indicador e médio estendidos e juntos, apontando para o lado ────────
  // LGP-H: dois dedos horizontais, juntos
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut &&
    i2mid < 0.20
  ) {
    return { letter: "H", confidence: 0.83 };
  }

  // ── I: mão fechada, mínimo estendido ─────────────────────────────────────
  // LGP-I: apenas mínimo (mindinho) estendido
  if (idx.down && mid.down && ring.down && pink.up && !thumbOut) {
    return { letter: "I", confidence: 0.88 };
  }

  // ── J: indicador e mínimo estendidos (chifres), polegar dobrado ───────────
  // LGP-J: indicador + mínimo para cima, médio + anelar dobrados
  if (
    idx.up && mid.down && ring.down && pink.up && !thumbOut
  ) {
    return { letter: "J", confidence: 0.82 };
  }

  // ── K: todos os dedos esticados, espalmado, polegar para fora ─────────────
  // LGP-K: mão aberta completamente, todos os dedos e polegar estendidos
  if (allUp && thumbOut) {
    return { letter: "K", confidence: 0.90 };
  }

  // ── L: polegar e indicador formam L, outros dobrados ─────────────────────
  // LGP-L: como ASL-L — polegar horizontal + indicador para cima
  if (idx.up && mid.down && ring.down && pink.down && thumbOut && !thumbUpY) {
    return { letter: "L", confidence: 0.88 };
  }

  // ── M: três primeiros dedos dobrados sobre polegar, mínimo estendido ───────
  // LGP-M: mínimo para cima, outros dobrados com polegar tucked
  if (
    idx.down && mid.down && ring.down && pink.up &&
    thumbIn && t2idx < 0.45
  ) {
    return { letter: "M", confidence: 0.80 };
  }

  // ── N: indicador e médio dobrados sobre o polegar ─────────────────────────
  // LGP-N: como ASL-N — 2 dedos sobre o polegar, anelar+mínimo fechados
  if (
    !idx.up && !mid.up && ring.down && pink.down &&
    thumbIn &&
    t2idx < 0.38 && t2mid < 0.38 && t2ring > 0.42
  ) {
    return { letter: "N", confidence: 0.79 };
  }

  // ── O: todos os dedos curvados a tocar o polegar (círculo/O) ─────────────
  // LGP-O: igual ao ASL-O
  if (
    !idx.up && !mid.up && !ring.up && !pink.up &&
    thumbOut &&
    t2idx < 0.30 && t2mid < 0.36 && t2ring < 0.40
  ) {
    return { letter: "O", confidence: 0.84 };
  }

  // ── P: mão aberta, dedos juntos, polegar separado (variante LGP) ──────────
  // LGP-P: palma espalmada virada para baixo / para a frente, polegar afastado
  if (
    allUp && thumbOut && thumbUpY &&
    i2mid < 0.22
  ) {
    return { letter: "P", confidence: 0.80 };
  }

  // ── Q: polegar e indicador formam pinça apontada para baixo ──────────────
  // LGP-Q: indicador dobrado a tocar polegar, restantes fechados
  if (
    !idx.up && mid.down && ring.down && pink.down &&
    thumbDownY &&
    t2idx < 0.40
  ) {
    return { letter: "Q", confidence: 0.78 };
  }

  // ── R: indicador e médio cruzados e estendidos ───────────────────────────
  // LGP-R: V com dedos cruzados
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut &&
    i2mid < 0.14
  ) {
    return { letter: "R", confidence: 0.84 };
  }

  // ── S: punho fechado, polegar por cima dos dedos ──────────────────────────
  // LGP-S: igual ao ASL-S
  if (
    allDown && !thumbIn && !thumbUpY &&
    t2idx < 0.38 && t2mid < 0.42 &&
    lm[4].y < lm[8].y
  ) {
    return { letter: "S", confidence: 0.84 };
  }

  // ── T: polegar entre indicador e médio dobrados ───────────────────────────
  // LGP-T: como ASL-T — polegar sai entre indicador e médio com todos dobrados
  if (
    !idx.up && !mid.up && !ring.up && !pink.up &&
    thumbUpY && nd(lm[4], lm[5], lm) < 0.45
  ) {
    return { letter: "T", confidence: 0.79 };
  }

  // ── U: indicador e médio juntos e estendidos, anelar e mínimo dobrados ────
  // LGP-U: dois dedos para cima, juntos (como ASL-U)
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut && i2mid < 0.20
  ) {
    return { letter: "U", confidence: 0.86 };
  }

  // ── V: indicador e médio estendidos e afastados (V da vitória) ────────────
  // LGP-V: como ASL-V
  if (
    idx.up && mid.up && ring.down && pink.down &&
    !thumbOut && i2mid >= 0.20
  ) {
    return { letter: "V", confidence: 0.87 };
  }

  // ── W: indicador, médio e anelar estendidos e afastados ───────────────────
  // LGP-W: 3 dedos para cima separados (W tem 3 pontas como a letra)
  if (
    idx.up && mid.up && ring.up && pink.down &&
    !thumbOut &&
    i2mid >= 0.16 && m2ring >= 0.16
  ) {
    return { letter: "W", confidence: 0.85 };
  }

  // ── X: indicador curvado em gancho ────────────────────────────────────────
  // LGP-X: indicador dobrado em gancho, outros fechados
  if (
    !idx.up && !idx.down &&
    lm[7].y < lm[6].y &&
    lm[8].y > lm[7].y + 0.01 &&
    mid.down && ring.down && pink.down && !thumbOut
  ) {
    return { letter: "X", confidence: 0.78 };
  }

  // ── Y: mínimo e polegar estendidos (gesto "fixe"/hang loose) ─────────────
  // LGP-Y: polegar + mínimo para fora, outros dobrados
  if (idx.down && mid.down && ring.down && pink.up && thumbOut) {
    return { letter: "Y", confidence: 0.87 };
  }

  // ── Z: mínimo estendido, mão ligeiramente rodada ──────────────────────────
  // LGP-Z: mínimo para cima com movimento de Z (estático: mínimo isolado rodado)
  if (
    idx.down && mid.down && ring.down && pink.up &&
    thumbIn
  ) {
    return { letter: "Z", confidence: 0.76 };
  }

  // ── ENTER: mão completamente aberta (todos os dedos + polegar) ────────────
  if (allUp && thumbOut) {
    return { letter: "ENTER", confidence: 0.92 };
  }

  // ── BACKSPACE: gesto de polegar para baixo ────────────────────────────────
  if (allDown && thumbDownY && !thumbIn) {
    return { letter: "BACKSPACE", confidence: 0.83 };
  }

  return { letter: null, confidence: 0 };
}

// ─── Classe GestureRecognizer ─────────────────────────────────────────────────

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

    const { letter, confidence } = recognizeLGP(landmarks);
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