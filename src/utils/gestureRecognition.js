import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const CONFIDENCE_THRESHOLD = 0.70;
const HOLD_DURATION_MS = 1200;
const COOLDOWN_MS = 1800;
const PIPELINE_INTERVAL_MS = 80;

// ─── Auxiliares de geometria base ──────────────────────────────────────────

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Distância normalizada pelo tamanho da palma (pulso → MCP do médio)
function palmSize(lm) {
  return dist(lm[0], lm[9]) || 0.001;
}
function nd(a, b, lm) {
  return dist(a, b) / palmSize(lm);
}

// Ponto médio aproximado da palma (média dos 4 MCPs + pulso)
function palmCenter(lm) {
  const pts = [lm[0], lm[5], lm[9], lm[13], lm[17]];
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

// ─── Curvatura por ângulo (NÃO depende da rotação da mão no ecrã) ─────────
//
// Em vez de comparar apenas a coordenada Y (que só funciona se o dedo
// apontar para cima/baixo no ecrã), medimos o ângulo no nó PIP entre o
// segmento PIP→MCP e o segmento PIP→TIP. Um dedo esticado dá um ângulo
// próximo de 180°, independentemente de estar a apontar para cima, para
// baixo ou de lado. Isto resolve a maior fonte de confusão do código
// original (letras como M, N, T, G, H, L, onde o dedo/mão está rodado).

function jointAngleDeg(mcp, pip, tip) {
  const v1x = mcp.x - pip.x, v1y = mcp.y - pip.y;
  const v2x = tip.x - pip.x, v2y = tip.y - pip.y;
  const m1 = Math.hypot(v1x, v1y) || 0.0001;
  const m2 = Math.hypot(v2x, v2y) || 0.0001;
  const cos = clamp((v1x * v2x + v1y * v2y) / (m1 * m2), -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

// 1 = totalmente esticado, 0 = totalmente fechado, independente da direção
function curl01(mcp, pip, tip) {
  const deg = jointAngleDeg(mcp, pip, tip);
  return clamp((deg - 50) / 120, 0, 1);
}

// Estado discreto do dedo a partir da curvatura (substitui o antigo up/down/level)
function fstate(c) {
  if (c > 0.62) return "up";     // esticado
  if (c < 0.32) return "down";   // fechado
  return "level";                // a meio (curvado tipo C/garra)
}

// Direção absoluta no ecrã de um dedo ESTICADO (só tem sentido quando o
// dedo está esticado — usado para distinguir, p.ex., T (indicador de lado)
// de H/L (indicador para cima), e M/N (dedos para baixo) de D (para cima).
function screenDir(mcp, tip) {
  const dx = tip.x - mcp.x, dy = tip.y - mcp.y;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (ady > adx * 1.25) return dy < 0 ? "up" : "down";
  if (adx > ady * 1.25) return "side";
  return "diag";
}

// ─── Reconhecedor LGP ──────────────────────────────────────────────────────
//
// Referência visual: Alfabeto Manual — Associação Portuguesa de Surdos (2009)
// Landmarks MediaPipe (câmara espelhada, mão direita):
//   0=pulso  1-4=polegar(cmc,mcp,ip,tip)
//   5-8=indicador(mcp,pip,dip,tip)  9-12=médio  13-16=anelar  17-20=mínimo
//
// ARQUITETURA: em vez de um if/else sequencial (onde a primeira condição
// satisfeita "ganha", mesmo que outra letra seja um match melhor — e onde
// uma letra com condição mais restrita colocada DEPOIS de outra mais larga
// nunca pode ser alcançada), calculamos um candidato para CADA letra e
// devolvemos o de maior confiança. Isto elimina ramos "mortos" que existiam
// no código original (ex: K e ENTER tinham a mesma condição, por isso ENTER
// nunca podia disparar; Q e BACKSPACE colidiam da mesma forma).

function recognizeLGP(lm) {
  const ps = palmSize(lm);

  // Curvatura (0-1) e estado de cada dedo
  const idxCurl  = curl01(lm[5],  lm[6],  lm[8]);
  const midCurl  = curl01(lm[9],  lm[10], lm[12]);
  const ringCurl = curl01(lm[13], lm[14], lm[16]);
  const pinkCurl = curl01(lm[17], lm[18], lm[20]);

  const idxC  = fstate(idxCurl);
  const midC  = fstate(midCurl);
  const ringC = fstate(ringCurl);
  const pinkC = fstate(pinkCurl);

  // Direção no ecrã (só fiável quando o dedo está esticado)
  const idxDir  = screenDir(lm[5],  lm[8]);
  const midDir  = screenDir(lm[9],  lm[12]);

  const allDown = idxC === "down" && midC === "down" && ringC === "down" && pinkC === "down";
  const allUp   = idxC === "up"   && midC === "up"   && ringC === "up"   && pinkC === "up";
  const noneUp  = idxC !== "up"   && midC !== "up"   && ringC !== "up"   && pinkC !== "up";

  // Polegar — mantemos a leitura por coordenadas de ecrã (câmara espelhada,
  // mão direita), mas adicionamos a EXTENSÃO (distância ao centro da palma)
  // e a ALTURA (acima/abaixo do nó do indicador), que são o que realmente
  // separa A/E/G/Q/S/B, o grupo mais difícil do alfabeto.
  const thumbOutSide = lm[4].x > lm[3].x + 0.03;
  const thumbInSide  = lm[4].x < lm[3].x - 0.01;
  const thumbUp       = lm[4].y < lm[3].y - 0.03;
  const thumbDown      = lm[4].y > lm[3].y + 0.03;
  const thumbExt       = nd(lm[4], palmCenter(lm), lm);       // 0=junto à palma, alto=esticado
  const thumbHighUp     = lm[4].y < lm[5].y;                   // polegar acima do nó do indicador
  const thumbOverFingers = lm[4].y < lm[8].y;                   // polegar acima da ponta do indicador (S)

  // Distâncias normalizadas entre pontas (pinças e afastamento)
  const t2idx  = nd(lm[4], lm[8],  lm);
  const t2mid  = nd(lm[4], lm[12], lm);
  const i2mid  = nd(lm[8], lm[12], lm);
  const m2ring = nd(lm[12], lm[16], lm);

  // Gancho específico do X (ponta do indicador dobra para baixo a meio,
  // mantendo o nó PIP levantado) — geometria distinta de curvatura simples
  const indexHook = lm[7].y < lm[6].y - 0.005 && lm[8].y > lm[7].y + 0.01;

  const candidates = [];
  const add = (letter, ok, confidence) => { if (ok) candidates.push({ letter, confidence }); };

  // ── Grupo: punho fechado (A, B, E, G, O, Q, S) ───────────────────────────
  add("B", allDown && thumbUp && !thumbOutSide, 0.92);
  add("Q", allDown && thumbDown && !thumbOutSide, 0.90);
  add("A", allDown && thumbOutSide && !thumbUp && !thumbDown && thumbExt >= 0.32, 0.86);
  add("S", allDown && !thumbOutSide && !thumbUp && !thumbDown &&
        thumbExt >= 0.18 && thumbExt < 0.45 && thumbOverFingers, 0.80);
  add("O", noneUp && t2idx < 0.30 && t2mid < 0.34, 0.84);
  add("E", allDown && !thumbOutSide && !thumbUp && !thumbDown &&
        thumbExt < 0.28 && !thumbHighUp, 0.78);
  add("G", allDown && !thumbOutSide && !thumbUp && !thumbDown &&
        thumbExt < 0.32 && thumbHighUp, 0.76);

  // ── Grupo: indicador só esticado (F, H, L) + T (indicador de lado) ──────
  const indexAloneUp = idxC === "up" && idxDir === "up" &&
    midC === "down" && ringC === "down" && pinkC === "down";
  add("F", indexAloneUp && !thumbOutSide && thumbExt < 0.30, 0.85);
  add("H", indexAloneUp && thumbOutSide && thumbExt >= 0.32 && thumbExt < 0.52, 0.78);
  add("L", indexAloneUp && thumbOutSide && thumbExt >= 0.55, 0.86);
  add("T", idxC === "up" && idxDir === "side" &&
        midC === "down" && ringC === "down" && pinkC === "down" && thumbUp, 0.84);

  // ── Mínimo só esticado (I) ───────────────────────────────────────────────
  add("I", pinkC === "up" && idxC === "down" && midC === "down" && ringC === "down" &&
        !thumbOutSide, 0.87);

  // ── Indicador + médio esticados juntos: U / K / V (por afastamento) ─────
  const twoFingerUp = idxC === "up" && midC === "up" && ringC === "down" && pinkC === "down";
  add("U", twoFingerUp && i2mid < 0.15, 0.86);
  add("K", twoFingerUp && i2mid >= 0.18 && i2mid < 0.28, 0.79);
  add("V", twoFingerUp && i2mid >= 0.31, 0.88);
  add("R", idxC === "level" && midC === "level" && ringC === "level" && pinkC === "level" &&
        thumbOutSide && (i2mid >= 0.22 || m2ring >= 0.22) && t2idx < 0.36, 0.77);
  add("N", idxC === "up" && midC === "up" && ringC === "down" && pinkC === "down" &&
        idxDir === "down" && !thumbOutSide, 0.82);

  // ── Três dedos esticados (W) ──────────────────────────────────────────────
  add("W", idxC === "up" && midC === "up" && ringC === "up" && pinkC === "down" &&
        !thumbOutSide && (i2mid >= 0.15 || m2ring >= 0.15), 0.85);

  // ── Quatro dedos esticados juntos: D / M (direção) / J / ENTER / BACKSPACE
  add("D", allUp && idxDir === "up" && thumbInSide && thumbExt < 0.35 &&
        i2mid < 0.20 && m2ring < 0.20, 0.85);
  add("M", allUp && idxDir === "down" && !thumbOutSide, 0.83);
  add("J", allUp && idxDir === "up" && !thumbOutSide && thumbExt < 0.40 &&
        (i2mid >= 0.26 || m2ring >= 0.26), 0.80);
  add("ENTER", allUp && idxDir === "up" && thumbOutSide && thumbExt >= 0.45 &&
        (i2mid >= 0.20 || m2ring >= 0.20), 0.90);
  add("BACKSPACE", allUp && idxDir === "up" && thumbDown, 0.85);

  // ── C (arco largo, dedos juntos) ─────────────────────────────────────────
  add("C", idxC === "level" && midC === "level" && ringC === "level" && pinkC === "level" &&
        thumbOutSide && t2idx >= 0.32 && i2mid < 0.22 && m2ring < 0.22, 0.83);

  // ── X (gancho só no indicador) ───────────────────────────────────────────
  add("X", indexHook && midC === "down" && ringC === "down" && pinkC === "down" &&
        !thumbOutSide, 0.80);

  // ── P (mão solta, dedos em gancho largo, a apontar para baixo) ──────────
  add("P", idxC === "level" && midC === "down" && ringC === "down" && pinkC === "down" &&
        !thumbOutSide && thumbExt >= 0.15 && thumbExt < 0.45, 0.74);

  // ── Y (polegar + mínimo esticados) ───────────────────────────────────────
  add("Y", idxC === "down" && midC === "down" && ringC === "down" && pinkC === "up" &&
        thumbOutSide && thumbExt >= 0.40, 0.88);

  // ── Z (garra fechada e apertada, polegar não saliente) ───────────────────
  add("Z", idxC === "level" && midC === "level" && ringC === "level" && pinkC === "level" &&
        !thumbOutSide && t2idx < 0.30 && i2mid < 0.18 && m2ring < 0.18, 0.75);

  if (candidates.length === 0) return { letter: null, confidence: 0 };

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0];
}

// ─── Classe GestureRecognizer ───────────────────────────────────────────────

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