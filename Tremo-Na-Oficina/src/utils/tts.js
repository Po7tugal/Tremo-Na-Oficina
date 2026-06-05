/**
 * tts.js – Text-to-Speech Service
 * Purpose: Wraps the browser's SpeechSynthesis API to provide
 *          accessible audio feedback throughout the game.
 * Dependencies: Browser SpeechSynthesis API (no external deps).
 * Responsibilities:
 *   - Speak messages aloud.
 *   - Queue or interrupt utterances.
 *   - Respect a user-controlled mute setting.
 * Interactions: Called by useGameLogic and useGestureRecognition hooks.
 */

let _muted = false;
let _rate = 1.0;
let _pitch = 1.0;

/** Toggle global mute state */
export function setMuted(muted) {
  _muted = muted;
  if (muted) window.speechSynthesis?.cancel();
}

export function getMuted() {
  return _muted;
}

/** Adjust speech rate (0.5 – 2.0) */
export function setRate(rate) {
  _rate = rate;
}

/** Adjust pitch (0.5 – 2.0) */
export function setPitch(pitch) {
  _pitch = pitch;
}

/**
 * Speak text using SpeechSynthesis.
 * @param {string} text - The message to speak.
 * @param {object} options
 * @param {boolean} options.interrupt - Cancel current speech before speaking. Default true.
 * @param {string}  options.lang     - BCP-47 language tag. Default 'en-US'.
 */
export function speak(text, { interrupt = true, lang = 'en-US' } = {}) {
  if (_muted) return;
  if (!window.speechSynthesis) return; // API not available

  if (interrupt) window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = _rate;
  utterance.pitch = _pitch;
  utterance.lang = lang;

  // Prefer a natural-sounding voice when available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && !v.name.includes('compact')
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

/**
 * Update the hidden screen-reader live region so screen readers
 * that don't pick up SpeechSynthesis still receive the message.
 * @param {string} text
 */
export function announceToScreenReader(text) {
  const el = document.getElementById('sr-live');
  if (!el) return;
  // Toggling content forces re-announcement in most screen readers
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = text;
  });
}

/**
 * Combined helper: speak + announce to screen reader.
 * @param {string} text
 * @param {object} options - Passed to speak().
 */
export function announce(text, options) {
  speak(text, options);
  announceToScreenReader(text);
}

// Pre-defined game messages for consistency
export const MESSAGES = {
  letterDetected: (letter) => `Detected letter ${letter}`,
  letterInserted: (letter) => `Letter ${letter} added`,
  correct: (letter, pos) =>
    `${letter} is correct at position ${pos}`,
  present: (letter) =>
    `${letter} is in the word but in the wrong position`,
  absent: (letter) => `${letter} is not in the word`,
  win: (word, attempts) =>
    `Congratulations! You guessed ${word} in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`,
  lose: (word) =>
    `Game over. The word was ${word}. Better luck next time!`,
  invalidWord: () => `Not a valid word. Try again.`,
  rowComplete: () => `Row complete. Submitting guess.`,
  newGame: () => `New game started. Guess the five-letter word.`,
  cameraGranted: () => `Camera access granted. Show hand signs to play.`,
  cameraDenied: () =>
    `Camera access denied. You can use keyboard input instead.`,
};