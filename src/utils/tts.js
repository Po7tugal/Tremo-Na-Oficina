/**
 * tts.js — Text-to-Speech Utility
 * ---------------------------------
 * Wraps the browser's SpeechSynthesis API for accessible audio feedback.
 * All game events trigger spoken announcements through this module.
 *
 * Dependencies: window.speechSynthesis (Web Speech API)
 * Used by: useGameLogic, WebcamView, GameBoard
 */

/**
 * Speak a message aloud using the browser TTS engine.
 * Cancels any ongoing speech before speaking to avoid overlap.
 *
 * @param {string} text - The text to speak
 * @param {object} options - Optional SpeechSynthesisUtterance options
 * @param {number} options.rate - Speech rate (0.1–10), default 1
 * @param {number} options.pitch - Voice pitch (0–2), default 1
 * @param {number} options.volume - Volume (0–1), default 1
 */
export function speak(text, options = {}) {
  if (!window.speechSynthesis) return;

  // Cancel any current speech to avoid queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;

  window.speechSynthesis.speak(utterance);
}

/**
 * Announce a letter being detected/inserted.
 * Uses a slightly faster rate for snappy letter-by-letter feedback.
 * @param {string} letter - Single letter A-Z
 */
export function announceLetterDetected(letter) {
  speak(`Letter ${letter}`, { rate: 1.2 });
}

/**
 * Announce the result of a submitted row.
 * Reads out per-tile results for screen reader users.
 * @param {Array<{letter: string, status: string}>} results
 */
export function announceRowResult(results) {
  const descriptions = results.map(({ letter, status }) => {
    if (status === 'correct') return `${letter}: correct position`;
    if (status === 'present') return `${letter}: wrong position`;
    return `${letter}: not in word`;
  });
  speak(descriptions.join('. '), { rate: 0.9 });
}

/**
 * Announce win state.
 * @param {number} attempts - Number of guesses taken
 */
export function announceWin(attempts) {
  speak(`Congratulations! You guessed the word in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`, { rate: 0.85 });
}

/**
 * Announce loss state and reveal the word.
 * @param {string} word - The secret word
 */
export function announceLoss(word) {
  speak(`Game over. The word was ${word.split('').join(' ')}.`, { rate: 0.85 });
}

/**
 * Announce that a word is not in the valid word list.
 */
export function announceInvalidWord() {
  speak('Word not in list. Try another word.', { rate: 1 });
}

/**
 * Announce that the current row is incomplete.
 */
export function announceIncompleteWord() {
  speak('Please complete the word before submitting.', { rate: 1 });
}

/**
 * Announce a letter was deleted.
 * @param {string} letter - The deleted letter
 */
export function announceDelete(letter) {
  speak(`Deleted ${letter}`, { rate: 1.2 });
}