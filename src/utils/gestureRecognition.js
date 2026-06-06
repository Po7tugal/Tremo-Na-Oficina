const CONFIDENCE_THRESHOLD = 0.75;
const HOLD_DURATION_MS = 1500;
const COOLDOWN_MS = 2000;
const PIPELINE_INTERVAL_MS = 200;

// Letras normais A-Z
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Gestos especiais — substituir pelo reconhecimento real do modelo
// 'OPEN_HAND' → ENTER (mão aberta, todos os dedos estendidos)
// 'THUMB_DOWN' → BACKSPACE (polegar para baixo)
const SPECIAL_GESTURES = ['OPEN_HAND', 'THUMB_DOWN'];
const ALL_GESTURES = [...ALPHABET, ...SPECIAL_GESTURES];

// Mapeamento gesto → ação
const GESTURE_ACTION = {
  'OPEN_HAND': 'ENTER',
  'THUMB_DOWN': 'BACKSPACE',
};

export class GestureRecognizer {
  constructor() {
    this._videoElement = null;
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._intervalId = null;
    this._holdingLetter = null;
    this._holdStartTime = null;
    this._lastAcceptedLetter = null;
    this._lastAcceptedTime = null;
    this._onLetterCallback = null;
    this._onDetectionCallback = null;
    this._active = false;
    this._mockHandPresent = false;
    this._mockCurrentLetter = null;
    this._mockChangeTimer = null;
  }

  init(videoElement) {
    this._videoElement = videoElement;
    this._canvas.width = 320;
    this._canvas.height = 240;
  }

  onLetter(callback) {
    this._onLetterCallback = callback;
  }

  onDetection(callback) {
    this._onDetectionCallback = callback;
  }

  start() {
    if (this._active) return;
    this._active = true;
    this._startMockSimulation();
    this._intervalId = setInterval(() => this._tick(), PIPELINE_INTERVAL_MS);
  }

  stop() {
    this._active = false;
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._stopMockSimulation();
    this._reset();
  }

  _tick() {
    if (!this._videoElement || !this._active) return;
    this._captureFrame();
    const { letter, confidence } = this._mockRecognize();
    this._processRecognition(letter, confidence);
  }

  _captureFrame() {
    if (this._videoElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
    this._ctx.drawImage(this._videoElement, 0, 0, this._canvas.width, this._canvas.height);
  }

  /**
   * ⚠️ MOCK — Substituir por inferência real do modelo.
   * O modelo deve retornar também 'OPEN_HAND' ou 'THUMB_DOWN'
   * para gestos especiais.
   */
  _mockRecognize() {
    if (!this._mockHandPresent || !this._mockCurrentLetter) {
      return { letter: null, confidence: 0 };
    }
    const confidence = 0.75 + Math.random() * 0.2;
    return { letter: this._mockCurrentLetter, confidence };
  }

  _processRecognition(letter, confidence) {
    const now = Date.now();

    if (!letter || confidence < CONFIDENCE_THRESHOLD) {
      this._holdingLetter = null;
      this._holdStartTime = null;
      this._emitDetection(null, 0, 0);
      return;
    }

    // Cooldown global após qualquer aceitação
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

    // ✅ Confirmado — mapeia gesto especial para ação
    const action = GESTURE_ACTION[letter] ?? letter;

    this._lastAcceptedLetter = letter;
    this._lastAcceptedTime = now;
    this._holdingLetter = null;
    this._holdStartTime = null;

    if (this._onLetterCallback) {
      this._onLetterCallback(action);
    }
  }

  _emitDetection(letter, confidence, holdProgress) {
    if (this._onDetectionCallback) {
      // Mostra nome amigável na UI para gestos especiais
      const displayLabel = GESTURE_ACTION[letter] ?? letter;
      this._onDetectionCallback({ letter: displayLabel, confidence, holdProgress });
    }
  }

  _reset() {
    this._holdingLetter = null;
    this._holdStartTime = null;
  }

  _startMockSimulation() {
    const scheduleNext = () => {
      if (!this._active) return;
      const delay = this._mockHandPresent
        ? 1000 + Math.random() * 2000
        : 2000 + Math.random() * 3000;

      this._mockChangeTimer = setTimeout(() => {
        if (!this._active) return;
        if (this._mockHandPresent) {
          this._mockHandPresent = false;
          this._mockCurrentLetter = null;
        } else {
          this._mockHandPresent = true;
          // Mock usa só letras normais — gestos especiais testados via botões
          this._mockCurrentLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  simulateLetter(letter) {
    this._holdingLetter = letter.toUpperCase();
    this._holdStartTime = Date.now() - HOLD_DURATION_MS;
    this._tick();
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

export const gestureRecognizer = new GestureRecognizer();